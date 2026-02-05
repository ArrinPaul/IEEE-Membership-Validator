'use server';

import { z } from 'zod';
import { members, type Member } from '@/lib/members';

export type ValidationState = {
  status: 'valid' | 'invalid' | 'idle' | 'error';
  member?: Pick<Member, 'name' | 'expiryDate' | 'homeNumber'>;
  message?: string;
};

export type AdminSearchState = {
  status: 'found' | 'not_found' | 'idle' | 'error';
  member?: Member;
  message?: string;
};

export type CsvUploadState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  membersAdded?: number;
};

const MembershipSchema = z.object({
  membershipId: z.string().trim().min(1, 'Membership ID must not be empty.'),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function validateMembership(
  prevState: ValidationState,
  formData: FormData
): Promise<ValidationState> {
  await sleep(1000); 

  const validatedFields = MembershipSchema.safeParse({
    membershipId: formData.get('membershipId'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors.membershipId?.[0] || 'Invalid input.',
    };
  }
  
  const { membershipId } = validatedFields.data;
  const member = members.find((m) => m.id === membershipId);

  if (!member) {
    return { status: 'invalid', message: `Membership ID not found. Searched for '${membershipId}' in a list of ${members.length} members. The first ID in memory is '${members[0]?.id || 'none'}'.` };
  }

  return {
    status: 'valid',
    member: {
      name: member.name,
      expiryDate: member.expiryDate,
      homeNumber: member.homeNumber,
    },
  };
}

export async function getAdminMemberDetails(
  prevState: AdminSearchState,
  formData: FormData
): Promise<AdminSearchState> {
    await sleep(1000);
    const validatedFields = MembershipSchema.safeParse({
        membershipId: formData.get('membershipId'),
    });

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: validatedFields.error.flatten().fieldErrors.membershipId?.[0] || 'Invalid input.',
        };
    }
    
    const { membershipId } = validatedFields.data;
    const member = members.find((m) => m.id === membershipId);

    if (!member) {
        return { status: 'not_found', message: `Membership ID not found. Searched for '${membershipId}' in a list of ${members.length} members. The first ID in memory is '${members[0]?.id || 'none'}'.` };
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
  await sleep(1000);
  const file = formData.get('csvFile') as File;
  if (!file || file.size === 0) {
    return { status: 'error', message: 'Please select a file to upload.' };
  }

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) {
      return { status: 'error', message: 'The file is empty or contains only a header.' };
    }
    
    const firstLine = lines[0];
    const headersRaw = firstLine.charCodeAt(0) === 0xFEFF ? firstLine.substring(1) : firstLine;
    
    const cleanCsvValue = (v: string) => {
        let value = v.trim();
        if (value.startsWith('="') && value.endsWith('"')) {
            return value.substring(2, value.length - 1);
        }
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.substring(1, value.length - 1);
        }
        return value;
    };
    
    const csvHeaders = headersRaw.split(',').map(cleanCsvValue);
    
    const expectedHeaders = [
        'Region', 'Section', 'School Section', 'School Name', 'Member Number', 
        'First Name', 'Middle Name', 'Last Name', 'Email Address', 'Grade', 'Gender',
        'IEEE Status', 'Renew Year', 'School Number', 'Home Number', 
        'Active Society List', 'Technical Community List', 'Technical Council List', 'Special Interest Group List'
    ];
    
    const missingHeaders = expectedHeaders.filter(h => !csvHeaders.includes(h));
    if (missingHeaders.length > 0) {
        return { status: 'error', message: `Invalid CSV headers. Missing: ${missingHeaders.join(', ')}` };
    }

    const headerMap = Object.fromEntries(csvHeaders.map((h, i) => [h, i]));

    const newMembers: Member[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(cleanCsvValue);
      const renewYear = values[headerMap['Renew Year']];
      
      const member: Member = {
        id: values[headerMap['Member Number']],
        name: `${values[headerMap['First Name']]} ${values[headerMap['Last Name']]}`,
        email: values[headerMap['Email Address']],
        membershipLevel: values[headerMap['IEEE Status']],
        expiryDate: renewYear ? `${renewYear}-12-31` : new Date().toISOString().split('T')[0],
        region: values[headerMap['Region']],
        section: values[headerMap['Section']],
        schoolSection: values[headerMap['School Section']],
        schoolName: values[headerMap['School Name']],
        firstName: values[headerMap['First Name']],
        middleName: values[headerMap['Middle Name']],
        lastName: values[headerMap['Last Name']],
        emailAddress: values[headerMap['Email Address']],
        grade: values[headerMap['Grade']],
        gender: values[headerMap['Gender']],
        renewYear: values[headerMap['Renew Year']],
        schoolNumber: values[headerMap['School Number']],
        homeNumber: values[headerMap['Home Number']],
        activeSocietyList: values[headerMap['Active Society List']],
        technicalCommunityList: values[headerMap['Technical Community List']],
        technicalCouncilList: values[headerMap['Technical Council List']],
        specialInterestGroupList: values[headerMap['Special Interest Group List']],
      };
      newMembers.push(member);
    }

    members.length = 0;
    members.push(...newMembers);

    return {
      status: 'success',
      message: `Successfully loaded ${newMembers.length} members. The validator will now use only this data. First member ID parsed: '${newMembers[0]?.id || 'none'}'`,
      membersAdded: newMembers.length
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { status: 'error', message: `Failed to process file. Please ensure it is a valid CSV file. Error: ${message}` };
  }
}
