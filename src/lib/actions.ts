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
