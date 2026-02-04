'use server';

import { z } from 'zod';
import { members, type Member } from '@/lib/members';

export type ValidationState = {
  status: 'valid' | 'invalid' | 'idle' | 'error';
  member?: Pick<Member, 'id' | 'name' | 'expiryDate'>;
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
  membershipId: z.string().length(8, 'Membership ID must be 8 characters.'),
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
    return { status: 'invalid', message: 'Membership ID not found.' };
  }

  const expiry = new Date(member.expiryDate);
  const now = new Date();
  
  if (expiry < now) {
    return { status: 'invalid', message: 'This membership has expired.' };
  }

  return {
    status: 'valid',
    member: {
      id: member.id,
      name: member.name,
      expiryDate: member.expiryDate,
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
  await sleep(1000);
  const file = formData.get('csvFile') as File;
  if (!file || file.size === 0) {
    return { status: 'error', message: 'Please select a CSV file to upload.' };
  }

  if (file.type !== 'text/csv') {
    return { status: 'error', message: 'Please upload a valid CSV file.' };
  }

  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
      return { status: 'error', message: 'CSV file is empty or contains only a header.' };
    }

    const header = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['id', 'name', 'email', 'membershipLevel', 'joinDate', 'expiryDate'];
    if (JSON.stringify(header) !== JSON.stringify(expectedHeaders)) {
        return { status: 'error', message: `Invalid CSV headers. Expected: ${expectedHeaders.join(', ')}` };
    }

    const newMembers: Member[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const member: Member = {
        id: values[0],
        name: values[1],
        email: values[2],
        membershipLevel: values[3] as any,
        joinDate: values[4],
        expiryDate: values[5],
      };
      newMembers.push(member);
    }

    // In a real application, you would persist this data to a database.
    // For this demo, we'll just confirm the number of members parsed.
    return {
      status: 'success',
      message: `Successfully processed ${newMembers.length} members from the CSV.`,
      membersAdded: newMembers.length
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { status: 'error', message: `Failed to process CSV file: ${message}` };
  }
}
