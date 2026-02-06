'use server';

import { z } from 'zod';
import { members as inMemoryMembers } from '@/lib/members';
import type { Member as InMemoryMember } from '@/lib/members';
import * as XLSX from 'xlsx';
import { db, members as dbMembers, datasets as dbDatasets } from '@/lib/db';
import { eq, or, ilike, sql, and, desc } from 'drizzle-orm';
import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// Re-export Member type for external use
export type Member = InMemoryMember;

// Types
export type ValidationState = {
  status: 'valid' | 'invalid' | 'idle' | 'error';
  member?: {
    name: string;
    expiryDate: string;
    membershipLevel?: string;
    region?: string;
    schoolName?: string;
  };
  message?: string;
};

export type AdminSearchState = {
  status: 'found' | 'not_found' | 'idle' | 'error';
  member?: InMemoryMember;
  message?: string;
};

export type CsvUploadState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  membersAdded?: number;
  datasetId?: number;
};

export type SearchFilters = {
  query?: string;
  status?: 'all' | 'active' | 'expired';
  region?: string;
  school?: string;
  membershipLevel?: string;
};

export type SearchResult = {
  members: InMemoryMember[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AnalyticsData = {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringSoon: number;
  membersByRegion: { region: string; count: number }[];
  membersBySchool: { school: string; count: number }[];
  membersByLevel: { level: string; count: number }[];
  membersByStatus: { status: string; count: number }[];
};

export type DatasetInfo = {
  id: number;
  name: string;
  url: string;
  rowCount: number;
  isActive: boolean;
  createdAt: string;
};

// Validation schemas
const MembershipSchema = z.object({
  membershipId: z.string().trim().min(1, 'Membership ID must not be empty.'),
});

// Helper function to check if membership is active
function isActiveMembership(expiryDate: string | Date | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) > new Date();
}

// Helper function to check if membership expires within 30 days
function expiresSoon(expiryDate: string | Date | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expiry > now && expiry <= thirtyDaysFromNow;
}

// Clean CSV value helper
function cleanCsvValue(v: any): string {
  if (v === undefined || v === null) return '';
  let value = String(v).trim();
  if (value.startsWith('="') && value.endsWith('"')) {
    value = value.substring(2, value.length - 1);
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.substring(1, value.length - 1);
  }
  value = value.replace(/""/g, '"').trim();

  if (/^\d+(\.\d+)?e\+\d+$/i.test(value)) {
    const num = Number(value);
    if (!isNaN(num)) {
      try {
        return BigInt(Math.round(num)).toString();
      } catch {
        return String(num);
      }
    }
  }

  return value;
}

// Parse CSV content
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstLine = lines[0];
  const headersRaw = firstLine.charCodeAt(0) === 0xFEFF ? firstLine.substring(1) : firstLine;
  
  const headers = headersRaw.split(',').map(h => cleanCsvValue(h));
  const rows = lines.slice(1).map(line => line.split(',').map(cleanCsvValue));
  
  return { headers, rows };
}

// Parse Excel file
async function parseExcel(buffer: ArrayBuffer): Promise<{ headers: string[]; rows: string[][] }> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  
  if (jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
  const rows = jsonData.slice(1).map(row => 
    (row as string[]).map(cell => String(cell || '').trim())
  );
  
  return { headers, rows };
}

// Convert row data to member object for DB
function rowToDbMember(values: string[], headerMap: Record<string, number>, datasetId?: number): any {
  const getValue = (key: string) => values[headerMap[key]] || '';
  const renewYearValue = getValue('Renew Year');
  
  let expiryDate = new Date();
  if (renewYearValue && !isNaN(parseInt(renewYearValue))) {
    const expiryYear = parseInt(renewYearValue) + 1;
    expiryDate = new Date(expiryYear, 1, 27);
  }

  return {
    memberNumber: getValue('Member Number'),
    firstName: getValue('First Name'),
    middleName: getValue('Middle Name'),
    lastName: getValue('Last Name'),
    email: getValue('Email Address'),
    membershipLevel: getValue('IEEE Status'),
    expiryDate: expiryDate,
    region: getValue('Region'),
    section: getValue('Section'),
    schoolSection: getValue('School Section'),
    schoolName: getValue('School Name'),
    grade: getValue('Grade'),
    gender: getValue('Gender'),
    renewYear: getValue('Renew Year'),
    activeSocietyList: getValue('Active Society List'),
    technicalCommunityList: getValue('Technical Community List'),
    technicalCouncilList: getValue('Technical Council List'),
    specialInterestGroupList: getValue('Special Interest Group List'),
    datasetId: datasetId
  };
}

// Map DB record to UI Member type
function mapDbToMember(m: any): InMemoryMember {
  return {
    id: m.memberNumber,
    name: `${m.firstName} ${m.lastName}`.trim(),
    email: m.email || '',
    membershipLevel: m.membershipLevel || '',
    expiryDate: m.expiryDate?.toISOString() || new Date().toISOString(),
    region: m.region || '',
    section: m.section || '',
    schoolSection: m.schoolSection || '',
    schoolName: m.schoolName || '',
    firstName: m.firstName,
    middleName: m.middleName || '',
    lastName: m.lastName,
    emailAddress: m.email || '',
    grade: m.grade || '',
    gender: m.gender || '',
    renewYear: m.renewYear || '',
    schoolNumber: '', 
    homeNumber: '', 
    activeSocietyList: m.activeSocietyList || '',
    technicalCommunityList: m.technicalCommunityList || '',
    technicalCouncilList: m.technicalCouncilList || '',
    specialInterestGroupList: m.specialInterestGroupList || '',
  };
}

/**
 * Get the currently active dataset ID
 */
async function getActiveDatasetId(): Promise<number | null> {
    if (!db) return null;
    const [active] = await db.select({ id: dbDatasets.id }).from(dbDatasets).where(eq(dbDatasets.isActive, true)).limit(1);
    return active?.id || null;
}

// ============ PUBLIC ACTIONS ============

export async function validateMembership(
  prevState: ValidationState,
  formData: FormData
): Promise<ValidationState> {
  const validatedFields = MembershipSchema.safeParse({
    membershipId: formData.get('membershipId')?.toString().trim(),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.membershipId?.[0] || 'Invalid input.',
    };
  }
  
  const { membershipId } = validatedFields.data;
  
  let member;
  if (db) {
    const activeId = await getActiveDatasetId();
    if (!activeId) {
        return { status: 'invalid', message: 'No active dataset found. Please contact an administrator.' };
    }

    const results = await db.select().from(dbMembers)
        .where(and(
            eq(dbMembers.memberNumber, membershipId),
            eq(dbMembers.datasetId, activeId)
        ))
        .limit(1);
        
    if (results.length > 0) {
      member = mapDbToMember(results[0]);
    }
  } else {
    member = inMemoryMembers.find((m) => m.id === membershipId);
  }

  if (!member) {
    return { 
      status: 'invalid', 
      message: `Membership ID "${membershipId}" not found in the active dataset.` 
    };
  }

  return {
    status: 'valid',
    member: {
      name: member.name,
      expiryDate: member.expiryDate,
      membershipLevel: member.membershipLevel,
      region: member.region,
      schoolName: member.schoolName,
    },
  };
}

// ============ ADMIN ACTIONS ============

export async function getAdminMemberDetails(
  prevState: AdminSearchState,
  formData: FormData
): Promise<AdminSearchState> {
  const validatedFields = MembershipSchema.safeParse({
    membershipId: formData.get('membershipId')?.toString().trim(),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.membershipId?.[0] || 'Invalid input.',
    };
  }
  
  const { membershipId } = validatedFields.data;
  
  let member;
  if (db) {
    const activeId = await getActiveDatasetId();
    if (!activeId) return { status: 'error', message: 'No active dataset.' };

    const results = await db.select().from(dbMembers)
        .where(and(
            eq(dbMembers.memberNumber, membershipId),
            eq(dbMembers.datasetId, activeId)
        ))
        .limit(1);

    if (results.length > 0) {
      member = mapDbToMember(results[0]);
    }
  } else {
    member = inMemoryMembers.find((m) => m.id === membershipId);
  }

  if (!member) {
    return { status: 'not_found', message: 'Membership ID not found in active dataset.' };
  }

  return {
    status: 'found',
    member,
  };
}

export async function uploadMembersCsv(
  prevState: CsvUploadState,
  formData: FormData
): Promise<CsvUploadState> {
  const file = formData.get('csvFile') as File;
  if (!file || file.size === 0) {
    return { status: 'error', message: 'Please select a file to upload.' };
  }

  try {
    const blob = await put(file.name, file, { access: 'public', addRandomSuffix: true });
    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

    let headers: string[];
    let rows: string[][];
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const result = await parseExcel(buffer);
      headers = result.headers;
      rows = result.rows;
    } else {
      const text = new TextDecoder().decode(buffer);
      const result = parseCsv(text);
      headers = result.headers;
      rows = result.rows;
    }

    const expectedHeaders = [
      'Region', 'Section', 'School Section', 'School Name', 'Member Number', 
      'First Name', 'Middle Name', 'Last Name', 'Email Address', 'Grade', 'Gender',
      'IEEE Status', 'Renew Year', 
      'Active Society List', 'Technical Community List', 'Technical Council List', 'Special Interest Group List'
    ];
    
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return { status: 'error', message: `Invalid headers. Missing: ${missingHeaders.join(', ')}` };
    }

    const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

    if (db) {
      // 1. Create dataset record first to get ID
      const [dataset] = await db.insert(dbDatasets).values({
        name: file.name, url: blob.url, rowCount: rows.length, isActive: true
      }).returning();

      // 2. Map members with the new datasetId
      const membersData = rows.map(row => rowToDbMember(row, headerMap, dataset.id));

      // 3. Deactivate others
      await db.update(dbDatasets).set({ isActive: false }).where(sql`id != ${dataset.id}`);

      // 4. Batch insert members
      const batchSize = 100;
      for (let i = 0; i < membersData.length; i += batchSize) {
        await db.insert(dbMembers).values(membersData.slice(i, i + batchSize));
      }
      
      revalidatePath('/admin');
      revalidatePath('/volunteer');
      return { status: 'success', message: `Dataset "${file.name}" uploaded and set as active.`, membersAdded: membersData.length };
    }
    return { status: 'error', message: 'Database not connected.' };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ============ DATASET MANAGEMENT ============

export async function getDatasets(): Promise<DatasetInfo[]> {
  if (!db) return [];
  const results = await db.select().from(dbDatasets).orderBy(desc(dbDatasets.createdAt));
  return results.map(d => ({
    id: d.id, name: d.name, url: d.url, rowCount: d.rowCount || 0, isActive: d.isActive || false, createdAt: d.createdAt?.toISOString() || ''
  }));
}

export async function activateDataset(datasetId: number): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: 'Database not configured.' };
  try {
    const [dataset] = await db.select().from(dbDatasets).where(eq(dbDatasets.id, datasetId)).limit(1);
    if (!dataset) return { success: false, message: 'Dataset not found.' };

    // Simply toggle isActive
    await db.update(dbDatasets).set({ isActive: false });
    await db.update(dbDatasets).set({ isActive: true }).where(eq(dbDatasets.id, datasetId));

    revalidatePath('/admin');
    revalidatePath('/volunteer');
    revalidatePath('/');
    return { success: true, message: `Dataset "${dataset.name}" is now the active source.` };
  } catch (e) {
    return { success: false, message: 'Activation failed.' };
  }
}

export async function deleteDataset(datasetId: number): Promise<{ success: boolean; message: string }> {
    if (!db) return { success: false, message: 'Database not configured.' };
    try {
      const [dataset] = await db.select().from(dbDatasets).where(eq(dbDatasets.id, datasetId)).limit(1);
      if (dataset) {
        // 1. Delete linked file
        await del(dataset.url);
        
        // 2. Delete linked members (handled by CASCADE in schema, but being explicit)
        await db.delete(dbMembers).where(eq(dbMembers.datasetId, datasetId));
        
        // 3. Delete dataset record
        await db.delete(dbDatasets).where(eq(dbDatasets.id, datasetId));
        
        revalidatePath('/admin');
        return { success: true, message: 'Dataset and its member data permanently removed.' };
      }
      return { success: false, message: 'Dataset not found.' };
    } catch (e) {
      return { success: false, message: 'Failed to delete dataset.' };
    }
}

export async function deactivateAllDatasets(): Promise<{ success: boolean; message: string }> {
    if (!db) return { success: false, message: 'Database not configured.' };
    try {
        await db.update(dbDatasets).set({ isActive: false });
        revalidatePath('/admin');
        return { success: true, message: 'All datasets disabled. App is currently empty.' };
    } catch (e) {
        return { success: false, message: 'Operation failed.' };
    }
}

export async function clearAllMembers(): Promise<{ success: boolean; message: string }> {
    if (!db) return { success: false, message: 'Database not configured.' };
    try {
        await db.delete(dbMembers);
        revalidatePath('/admin');
        return { success: true, message: 'All membership records wiped.' };
    } catch (e) {
        return { success: false, message: 'Wipe failed.' };
    }
}

// ============ SEARCH & FILTER ACTIONS ============

export async function searchMembers(filters: SearchFilters, page = 1, pageSize = 20): Promise<SearchResult> {
  if (db) {
    const activeId = await getActiveDatasetId();
    if (!activeId) return { members: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

    let whereClauses = [eq(dbMembers.datasetId, activeId)];
    
    if (filters.query) {
      const q = `%${filters.query}%`;
      const searchFilter = or(
        ilike(dbMembers.memberNumber, q),
        ilike(dbMembers.firstName, q),
        ilike(dbMembers.lastName, q),
        ilike(dbMembers.email, q),
        ilike(dbMembers.schoolName, q)
      );
      if (searchFilter) whereClauses.push(searchFilter);
    }
    if (filters.status && filters.status !== 'all') {
      const now = new Date();
      if (filters.status === 'active') whereClauses.push(sql`${dbMembers.expiryDate} > ${now}`);
      else whereClauses.push(sql`${dbMembers.expiryDate} <= ${now}`);
    }
    if (filters.region) whereClauses.push(eq(dbMembers.region, filters.region));
    if (filters.school) whereClauses.push(eq(dbMembers.schoolName, filters.school));
    if (filters.membershipLevel) whereClauses.push(eq(dbMembers.membershipLevel, filters.membershipLevel));

    const finalWhere = and(...whereClauses);
    const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(finalWhere);
    const total = Number(totalCount.count);

    const results = await db.select().from(dbMembers).where(finalWhere).limit(pageSize).offset((page - 1) * pageSize);

    return {
      members: results.map(mapDbToMember),
      total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  return { members: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
}

export async function getFilterOptions(): Promise<{
  regions: string[];
  schools: string[];
  membershipLevels: string[];
}> {
  if (db) {
    const activeId = await getActiveDatasetId();
    if (!activeId) return { regions: [], schools: [], membershipLevels: [] };

    const regions = await db.select({ val: dbMembers.region }).from(dbMembers).where(eq(dbMembers.datasetId, activeId)).groupBy(dbMembers.region);
    const schools = await db.select({ val: dbMembers.schoolName }).from(dbMembers).where(eq(dbMembers.datasetId, activeId)).groupBy(dbMembers.schoolName);
    const levels = await db.select({ val: dbMembers.membershipLevel }).from(dbMembers).where(eq(dbMembers.datasetId, activeId)).groupBy(dbMembers.membershipLevel);
    
    return {
      regions: regions.map(r => r.val).filter(Boolean).sort() as string[],
      schools: schools.map(s => s.val).filter(Boolean).sort() as string[],
      membershipLevels: levels.map(l => l.val).filter(Boolean).sort() as string[],
    };
  }
  return { regions: [], schools: [], membershipLevels: [] };
}

// ============ ANALYTICS ACTIONS ============

export async function getAnalytics(): Promise<AnalyticsData> {
  if (db) {
    const activeId = await getActiveDatasetId();
    if (!activeId) return { totalMembers: 0, activeMembers: 0, expiredMembers: 0, expiringSoon: 0, membersByRegion: [], membersBySchool: [], membersByLevel: [], membersByStatus: [] };

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const activeWhere = eq(dbMembers.datasetId, activeId);

    const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(activeWhere);
    const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(and(activeWhere, sql`${dbMembers.expiryDate} > ${now}`));
    const [expiringSoonCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(and(activeWhere, sql`${dbMembers.expiryDate} > ${now}`, sql`${dbMembers.expiryDate} <= ${thirtyDaysFromNow}`));
    
    const regionStats = await db.select({ region: dbMembers.region, count: sql<number>`count(*)` }).from(dbMembers).where(activeWhere).groupBy(dbMembers.region).orderBy(sql`count(*) DESC`).limit(10);
    const schoolStats = await db.select({ school: dbMembers.schoolName, count: sql<number>`count(*)` }).from(dbMembers).where(activeWhere).groupBy(dbMembers.schoolName).orderBy(sql`count(*) DESC`).limit(10);
    const levelStats = await db.select({ level: dbMembers.membershipLevel, count: sql<number>`count(*)` }).from(dbMembers).where(activeWhere).groupBy(dbMembers.membershipLevel);

    const total = Number(totalCount.count);
    const active = Number(activeCount.count);
    return {
        totalMembers: total, activeMembers: active, expiredMembers: total - active, expiringSoon: Number(expiringSoonCount.count),
        membersByRegion: regionStats.map(r => ({ region: r.region || 'Unknown', count: Number(r.count) })),
        membersBySchool: schoolStats.map(s => ({ school: s.school || 'Unknown', count: Number(s.count) })),
        membersByLevel: levelStats.map(l => ({ level: l.level || 'Unknown', count: Number(l.count) })),
        membersByStatus: [{ status: 'Active', count: active }, { status: 'Expired', count: total - active }],
    };
  }
  return { totalMembers: 0, activeMembers: 0, expiredMembers: 0, expiringSoon: 0, membersByRegion: [], membersBySchool: [], membersByLevel: [], membersByStatus: [] };
}

// ============ EXPORT ACTIONS ============

export async function exportMembersToCsv(filters?: SearchFilters): Promise<string> {
  const { members: membersToExport } = await searchMembers(filters || {}, 1, 10000);
  const headers = ['Member Number', 'First Name', 'Middle Name', 'Last Name', 'Email Address', 'IEEE Status', 'Expiry Date', 'Status', 'Region', 'Section', 'School Section', 'School Name', 'Grade', 'Gender', 'Renew Year'];
  const rows = membersToExport.map(m => [
    m.id, m.firstName || '', m.middleName || '', m.lastName || '', m.emailAddress || m.email || '', m.membershipLevel || '', m.expiryDate, isActiveMembership(m.expiryDate) ? 'Active' : 'Expired', m.region || '', m.section || '', m.schoolSection || '', m.schoolName || '', m.grade || '', m.gender || '', m.renewYear || ''
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export async function getMembersCount(): Promise<number> {
  if (db) {
      const activeId = await getActiveDatasetId();
      if (!activeId) return 0;
      const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(eq(dbMembers.datasetId, activeId));
      return Number(totalCount.count);
  }
  return 0;
}

export async function getAllMembersList(): Promise<InMemoryMember[]> {
  if (db) {
      const activeId = await getActiveDatasetId();
      if (!activeId) return [];
      const dbResults = await db.select().from(dbMembers).where(eq(dbMembers.datasetId, activeId));
      return dbResults.map(mapDbToMember);
  }
  return [];
}
