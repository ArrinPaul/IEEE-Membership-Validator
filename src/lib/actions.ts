'use server';

import { z } from 'zod';
import { members as inMemoryMembers } from '@/lib/members';
import type { Member as InMemoryMember } from '@/lib/members';
import * as XLSX from 'xlsx';
import { db, members as dbMembers, datasets as dbDatasets } from '@/lib/db';
import { eq, or, ilike, sql, and, desc } from 'drizzle-orm';
import { put } from '@vercel/blob';
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
function rowToDbMember(values: string[], headerMap: Record<string, number>): any {
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
    schoolNumber: '', // Removed from DB but kept for type compatibility
    homeNumber: '', // Removed from DB but kept for type compatibility
    activeSocietyList: m.activeSocietyList || '',
    technicalCommunityList: m.technicalCommunityList || '',
    technicalCouncilList: m.technicalCouncilList || '',
    specialInterestGroupList: m.specialInterestGroupList || '',
  };
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
    const results = await db.select().from(dbMembers).where(eq(dbMembers.memberNumber, membershipId)).limit(1);
    if (results.length > 0) {
      member = mapDbToMember(results[0]);
    }
  } else {
    member = inMemoryMembers.find((m) => m.id === membershipId);
  }

  if (!member) {
    return { 
      status: 'invalid', 
      message: `Membership ID "${membershipId}" not found in the database.` 
    };
  }

  return {
    status: 'valid',
    member: {
      name: member.name,
      expiryDate: member.expiryDate,
      membershipLevel: member.membershipLevel,
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
    const results = await db.select().from(dbMembers).where(eq(dbMembers.memberNumber, membershipId)).limit(1);
    if (results.length > 0) {
      member = mapDbToMember(results[0]);
    }
  } else {
    member = inMemoryMembers.find((m) => m.id === membershipId);
  }

  if (!member) {
    return { status: 'not_found', message: 'Membership ID not found.' };
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
    // 1. Upload to Vercel Blob for persistent storage
    const blob = await put(file.name, file, { access: 'public' });
    
    // 2. Parse file locally to get data for initial activation
    let headers: string[];
    let rows: string[][];
    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

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
      return { 
        status: 'error', 
        message: `Invalid file headers. Missing: ${missingHeaders.join(', ')}` 
      };
    }

    const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));
    const membersData = rows.map(row => rowToDbMember(row, headerMap));

    if (db) {
      // 3. Save dataset metadata
      const [dataset] = await db.insert(dbDatasets).values({
        name: file.name,
        url: blob.url,
        rowCount: membersData.length,
        isActive: true
      }).returning();

      // 4. Update all other datasets to NOT active
      await db.update(dbDatasets).set({ isActive: false }).where(sql`id != ${dataset.id}`);

      // 5. Populate members table
      await db.delete(dbMembers);
      const batchSize = 100;
      for (let i = 0; i < membersData.length; i += batchSize) {
        await db.insert(dbMembers).values(membersData.slice(i, i + batchSize));
      }
      
      revalidatePath('/admin');
      return {
        status: 'success',
        message: `Successfully uploaded ${file.name} to cloud storage and activated it.`,
        membersAdded: membersData.length,
        datasetId: dataset.id
      };
    } else {
        // Fallback for local development without DB
        inMemoryMembers.length = 0;
        inMemoryMembers.push(...rows.map(row => mapDbToMember(rowToDbMember(row, headerMap))));
        return {
            status: 'success',
            message: `Loaded ${rows.length} members into memory (No DB configured).`,
            membersAdded: rows.length
        };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { 
      status: 'error', 
      message: `Failed to process file. Error: ${message}` 
    };
  }
}

// ============ DATASET MANAGEMENT ============

export async function getDatasets(): Promise<DatasetInfo[]> {
  if (!db) return [];
  const results = await db.select().from(dbDatasets).orderBy(desc(dbDatasets.createdAt));
  return results.map(d => ({
    id: d.id,
    name: d.name,
    url: d.url,
    rowCount: d.rowCount || 0,
    isActive: d.isActive || false,
    createdAt: d.createdAt?.toISOString() || ''
  }));
}

export async function activateDataset(datasetId: number): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: 'Database not configured.' };

  try {
    const [dataset] = await db.select().from(dbDatasets).where(eq(dbDatasets.id, datasetId)).limit(1);
    if (!dataset) return { success: false, message: 'Dataset not found.' };

    // 1. Fetch file from Vercel Blob
    const response = await fetch(dataset.url);
    const buffer = await response.arrayBuffer();
    
    // 2. Parse
    let headers: string[];
    let rows: string[][];
    if (dataset.url.toLowerCase().endsWith('.xlsx') || dataset.url.toLowerCase().endsWith('.xls')) {
      const result = await parseExcel(buffer);
      headers = result.headers;
      rows = result.rows;
    } else {
      const text = new TextDecoder().decode(buffer);
      const result = parseCsv(text);
      headers = result.headers;
      rows = result.rows;
    }

    const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));
    const membersData = rows.map(row => rowToDbMember(row, headerMap));

    // 3. Update active status in DB
    await db.update(dbDatasets).set({ isActive: false });
    await db.update(dbDatasets).set({ isActive: true }).where(eq(dbDatasets.id, datasetId));

    // 4. Update members table
    await db.delete(dbMembers);
    const batchSize = 100;
    for (let i = 0; i < membersData.length; i += batchSize) {
      await db.insert(dbMembers).values(membersData.slice(i, i + batchSize));
    }

    revalidatePath('/admin');
    return { success: true, message: `Dataset "${dataset.name}" is now active.` };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Activation failed.' };
  }
}

export async function deleteDataset(datasetId: number): Promise<{ success: boolean; message: string }> {
    if (!db) return { success: false, message: 'Database not configured.' };
    // Implementation for deletion could be added here (including Blob deletion)
    await db.delete(dbDatasets).where(eq(dbDatasets.id, datasetId));
    revalidatePath('/admin');
    return { success: true, message: 'Dataset record removed.' };
}

// ============ SEARCH & FILTER ACTIONS ============

export async function searchMembers(filters: SearchFilters, page = 1, pageSize = 20): Promise<SearchResult> {
  if (db) {
    let whereClauses = [];
    if (filters.query) {
      const q = `%${filters.query}%`;
      whereClauses.push(or(
        ilike(dbMembers.memberNumber, q),
        ilike(dbMembers.firstName, q),
        ilike(dbMembers.lastName, q),
        ilike(dbMembers.email, q),
        ilike(dbMembers.schoolName, q)
      ));
    }
    if (filters.status && filters.status !== 'all') {
      const now = new Date();
      if (filters.status === 'active') whereClauses.push(sql`${dbMembers.expiryDate} > ${now}`);
      else whereClauses.push(sql`${dbMembers.expiryDate} <= ${now}`);
    }
    if (filters.region) whereClauses.push(eq(dbMembers.region, filters.region));
    if (filters.school) whereClauses.push(eq(dbMembers.schoolName, filters.school));
    if (filters.membershipLevel) whereClauses.push(eq(dbMembers.membershipLevel, filters.membershipLevel));

    const finalWhere = whereClauses.length > 0 ? and(...whereClauses) : undefined;
    const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(finalWhere);
    const total = Number(totalCount.count);

    const results = await db.select().from(dbMembers).where(finalWhere).limit(pageSize).offset((page - 1) * pageSize);

    return {
      members: results.map(mapDbToMember),
      total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Fallback to in-memory
  let filtered = [...inMemoryMembers];
  if (filters.query) {
    const q = filters.query.toLowerCase();
    filtered = filtered.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
  }
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(m => filters.status === 'active' ? isActiveMembership(m.expiryDate) : !isActiveMembership(m.expiryDate));
  }
  if (filters.region) filtered = filtered.filter(m => m.region === filters.region);
  if (filters.school) filtered = filtered.filter(m => m.schoolName === filters.school);
  if (filters.membershipLevel) filtered = filtered.filter(m => m.membershipLevel === filters.membershipLevel);

  const total = filtered.length;
  return {
    members: filtered.slice((page - 1) * pageSize, page * pageSize),
    total, page, pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getFilterOptions(): Promise<{
  regions: string[];
  schools: string[];
  membershipLevels: string[];
}> {
  if (db) {
    const regions = await db.select({ val: dbMembers.region }).from(dbMembers).groupBy(dbMembers.region);
    const schools = await db.select({ val: dbMembers.schoolName }).from(dbMembers).groupBy(dbMembers.schoolName);
    const levels = await db.select({ val: dbMembers.membershipLevel }).from(dbMembers).groupBy(dbMembers.membershipLevel);
    return {
      regions: regions.map(r => r.val).filter(Boolean).sort() as string[],
      schools: schools.map(s => s.val).filter(Boolean).sort() as string[],
      membershipLevels: levels.map(l => l.val).filter(Boolean).sort() as string[],
    };
  }
  return {
    regions: [...new Set(inMemoryMembers.map(m => m.region).filter(Boolean))].sort() as string[],
    schools: [...new Set(inMemoryMembers.map(m => m.schoolName).filter(Boolean))].sort() as string[],
    membershipLevels: [...new Set(inMemoryMembers.map(m => m.membershipLevel).filter(Boolean))].sort() as string[],
  };
}

// ============ ANALYTICS ACTIONS ============

export async function getAnalytics(): Promise<AnalyticsData> {
  if (db) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers);
    const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(sql`${dbMembers.expiryDate} > ${now}`);
    const [expiringSoonCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers).where(and(sql`${dbMembers.expiryDate} > ${now}`, sql`${dbMembers.expiryDate} <= ${thirtyDaysFromNow}`));
    const regionStats = await db.select({ region: dbMembers.region, count: sql<number>`count(*)` }).from(dbMembers).groupBy(dbMembers.region).orderBy(sql`count(*) DESC`).limit(10);
    const schoolStats = await db.select({ school: dbMembers.schoolName, count: sql<number>`count(*)` }).from(dbMembers).groupBy(dbMembers.schoolName).orderBy(sql`count(*) DESC`).limit(10);
    const levelStats = await db.select({ level: dbMembers.membershipLevel, count: sql<number>`count(*)` }).from(dbMembers).groupBy(dbMembers.membershipLevel);

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
  const activeMembers = inMemoryMembers.filter(m => isActiveMembership(m.expiryDate));
  return {
    totalMembers: inMemoryMembers.length, activeMembers: activeMembers.length, expiredMembers: inMemoryMembers.length - activeMembers.length, expiringSoon: inMemoryMembers.filter(m => expiresSoon(m.expiryDate)).length,
    membersByRegion: [], membersBySchool: [], membersByLevel: [], membersByStatus: [],
  };
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
      const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(dbMembers);
      return Number(totalCount.count);
  }
  return inMemoryMembers.length;
}

export async function getAllMembersList(): Promise<InMemoryMember[]> {
  if (db) {
      const dbResults = await db.select().from(dbMembers);
      return dbResults.map(mapDbToMember);
  }
  return [...inMemoryMembers];
}
