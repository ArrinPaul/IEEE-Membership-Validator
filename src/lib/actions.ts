'use server';

import { z } from 'zod';
import { members as inMemoryMembers } from '@/lib/members';
import type { Member as InMemoryMember } from '@/lib/members';
import * as XLSX from 'xlsx';

// Re-export Member type for external use
export type Member = InMemoryMember;

// Types
export type ValidationState = {
  status: 'valid' | 'invalid' | 'idle' | 'error';
  member?: {
    name: string;
    expiryDate: string;
    homeNumber?: string;
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

// Validation schemas
const MembershipSchema = z.object({
  membershipId: z.string().trim().min(1, 'Membership ID must not be empty.'),
});

// Helper function to check if membership is active
function isActiveMembership(expiryDate: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) > new Date();
}

// Helper function to check if membership expires within 30 days
function expiresSoon(expiryDate: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expiry > now && expiry <= thirtyDaysFromNow;
}

// Clean CSV value helper
function cleanCsvValue(v: string): string {
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

// Convert row data to member object
function rowToMember(values: string[], headerMap: Record<string, number>): InMemoryMember {
  const getValue = (key: string) => values[headerMap[key]] || '';
  const renewYearValue = getValue('Renew Year');
  
  let expiryDate = new Date().toISOString().split('T')[0];
  if (renewYearValue && !isNaN(parseInt(renewYearValue))) {
    const expiryYear = parseInt(renewYearValue) + 1;
    const expiry = new Date(expiryYear, 1, 27);
    expiryDate = expiry.toISOString().split('T')[0];
  }

  return {
    id: getValue('Member Number'),
    name: `${getValue('First Name')} ${getValue('Last Name')}`.trim(),
    email: getValue('Email Address'),
    membershipLevel: getValue('IEEE Status'),
    expiryDate,
    region: getValue('Region'),
    section: getValue('Section'),
    schoolSection: getValue('School Section'),
    schoolName: getValue('School Name'),
    firstName: getValue('First Name'),
    middleName: getValue('Middle Name'),
    lastName: getValue('Last Name'),
    emailAddress: getValue('Email Address'),
    grade: getValue('Grade'),
    gender: getValue('Gender'),
    renewYear: getValue('Renew Year'),
    schoolNumber: getValue('School Number'),
    homeNumber: getValue('Home Number'),
    activeSocietyList: getValue('Active Society List'),
    technicalCommunityList: getValue('Technical Community List'),
    technicalCouncilList: getValue('Technical Council List'),
    specialInterestGroupList: getValue('Special Interest Group List'),
  };
}

// ============ PUBLIC ACTIONS ============

export async function validateMembership(
  prevState: ValidationState,
  formData: FormData
): Promise<ValidationState> {
  if (inMemoryMembers.length === 0) {
    return { 
      status: 'invalid', 
      message: 'No member data has been uploaded. Please ask an admin to upload a dataset.' 
    };
  }

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
  const member = inMemoryMembers.find((m) => m.id === membershipId);

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
      homeNumber: member.homeNumber,
      membershipLevel: member.membershipLevel,
    },
  };
}

// ============ ADMIN ACTIONS ============

export async function getAdminMemberDetails(
  prevState: AdminSearchState,
  formData: FormData
): Promise<AdminSearchState> {
  if (inMemoryMembers.length === 0) {
    return { 
      status: 'not_found', 
      message: 'No dataset uploaded. Please upload a member CSV/Excel file to begin.' 
    };
  }

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
  const member = inMemoryMembers.find((m) => m.id === membershipId);

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
    let headers: string[];
    let rows: string[][];

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const result = await parseExcel(buffer);
      headers = result.headers;
      rows = result.rows;
    } else {
      const text = await file.text();
      const result = parseCsv(text);
      headers = result.headers;
      rows = result.rows;
    }

    if (rows.length === 0) {
      return { status: 'error', message: 'The file is empty or contains only a header.' };
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
    const newMembers: InMemoryMember[] = rows.map(row => rowToMember(row, headerMap));

    inMemoryMembers.length = 0;
    inMemoryMembers.push(...newMembers);

    return {
      status: 'success',
      message: `Successfully loaded ${newMembers.length} members from ${file.name}.`,
      membersAdded: newMembers.length
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { 
      status: 'error', 
      message: `Failed to process file. Error: ${message}` 
    };
  }
}

// ============ SEARCH & FILTER ACTIONS ============

export async function searchMembers(filters: SearchFilters, page = 1, pageSize = 20): Promise<SearchResult> {
  let filtered = [...inMemoryMembers];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(m => 
      m.id.toLowerCase().includes(query) ||
      m.name.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.emailAddress?.toLowerCase().includes(query) ||
      m.firstName?.toLowerCase().includes(query) ||
      m.lastName?.toLowerCase().includes(query) ||
      m.schoolName?.toLowerCase().includes(query)
    );
  }

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(m => {
      const isActive = isActiveMembership(m.expiryDate);
      return filters.status === 'active' ? isActive : !isActive;
    });
  }

  if (filters.region) {
    filtered = filtered.filter(m => m.region === filters.region);
  }

  if (filters.school) {
    filtered = filtered.filter(m => m.schoolName === filters.school);
  }

  if (filters.membershipLevel) {
    filtered = filtered.filter(m => m.membershipLevel === filters.membershipLevel);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedMembers = filtered.slice(startIndex, startIndex + pageSize);

  return {
    members: paginatedMembers,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getFilterOptions(): Promise<{
  regions: string[];
  schools: string[];
  membershipLevels: string[];
}> {
  const regions = [...new Set(inMemoryMembers.map(m => m.region).filter(Boolean))].sort() as string[];
  const schools = [...new Set(inMemoryMembers.map(m => m.schoolName).filter(Boolean))].sort() as string[];
  const membershipLevels = [...new Set(inMemoryMembers.map(m => m.membershipLevel).filter(Boolean))].sort() as string[];

  return { regions, schools, membershipLevels };
}

// ============ ANALYTICS ACTIONS ============

export async function getAnalytics(): Promise<AnalyticsData> {
  const activeMembers = inMemoryMembers.filter(m => isActiveMembership(m.expiryDate));
  const expiredMembers = inMemoryMembers.filter(m => !isActiveMembership(m.expiryDate));
  const expiringSoonList = inMemoryMembers.filter(m => expiresSoon(m.expiryDate));

  const regionCounts = inMemoryMembers.reduce((acc, m) => {
    const region = m.region || 'Unknown';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const schoolCounts = inMemoryMembers.reduce((acc, m) => {
    const school = m.schoolName || 'Unknown';
    acc[school] = (acc[school] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const levelCounts = inMemoryMembers.reduce((acc, m) => {
    const level = m.membershipLevel || 'Unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalMembers: inMemoryMembers.length,
    activeMembers: activeMembers.length,
    expiredMembers: expiredMembers.length,
    expiringSoon: expiringSoonList.length,
    membersByRegion: Object.entries(regionCounts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    membersBySchool: Object.entries(schoolCounts)
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    membersByLevel: Object.entries(levelCounts)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count),
    membersByStatus: [
      { status: 'Active', count: activeMembers.length },
      { status: 'Expired', count: expiredMembers.length },
    ],
  };
}

// ============ EXPORT ACTIONS ============

export async function exportMembersToCsv(filters?: SearchFilters): Promise<string> {
  let membersToExport = [...inMemoryMembers];

  if (filters) {
    if (filters.query) {
      const query = filters.query.toLowerCase();
      membersToExport = membersToExport.filter(m => 
        m.id.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query)
      );
    }

    if (filters.status && filters.status !== 'all') {
      membersToExport = membersToExport.filter(m => {
        const isActive = isActiveMembership(m.expiryDate);
        return filters.status === 'active' ? isActive : !isActive;
      });
    }

    if (filters.region) {
      membersToExport = membersToExport.filter(m => m.region === filters.region);
    }

    if (filters.school) {
      membersToExport = membersToExport.filter(m => m.schoolName === filters.school);
    }
  }

  const headers = [
    'Member Number', 'First Name', 'Middle Name', 'Last Name', 'Email Address',
    'Home Number', 'IEEE Status', 'Expiry Date', 'Status',
    'Region', 'Section', 'School Section', 'School Name', 'School Number',
    'Grade', 'Gender', 'Renew Year',
    'Active Society List', 'Technical Community List', 'Technical Council List', 'Special Interest Group List'
  ];

  const rows = membersToExport.map(m => [
    m.id,
    m.firstName || '',
    m.middleName || '',
    m.lastName || '',
    m.emailAddress || m.email || '',
    m.homeNumber || '',
    m.membershipLevel || '',
    m.expiryDate,
    isActiveMembership(m.expiryDate) ? 'Active' : 'Expired',
    m.region || '',
    m.section || '',
    m.schoolSection || '',
    m.schoolName || '',
    m.schoolNumber || '',
    m.grade || '',
    m.gender || '',
    m.renewYear || '',
    m.activeSocietyList || '',
    m.technicalCommunityList || '',
    m.technicalCouncilList || '',
    m.specialInterestGroupList || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  return [headers.join(','), ...rows].join('\n');
}

export async function getMembersCount(): Promise<number> {
  return inMemoryMembers.length;
}

export async function getAllMembersList(): Promise<InMemoryMember[]> {
  return [...inMemoryMembers];
}