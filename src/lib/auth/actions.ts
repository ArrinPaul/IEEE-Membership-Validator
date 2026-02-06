'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { db, userRoles } from '@/lib/db';

export type UserRole = 'admin' | 'volunteer' | 'user';

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return (user.publicMetadata?.role as UserRole) || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

export async function setUserRole(userId: string, role: UserRole): Promise<{ success: boolean; message: string }> {
  const currentAuth = await auth();
  
  if (!currentAuth.userId) {
    return { success: false, message: 'Not authenticated' };
  }

  // Verify the current user is an admin
  const currentRole = await getCurrentUserRole();
  if (currentRole !== 'admin') {
    return { success: false, message: 'Only admins can change user roles' };
  }

  try {
    const client = await clerkClient();
    
    // Update Clerk user metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    // Also update our database for backup if it's configured
    if (db) {
      const user = await client.users.getUser(userId);
      const email = user.emailAddresses[0]?.emailAddress || '';

      await db
        .insert(userRoles)
        .values({
          clerkUserId: userId,
          email,
          role,
        })
        .onConflictDoUpdate({
          target: userRoles.clerkUserId,
          set: { role, updatedAt: new Date() },
        });
    }

    return { success: true, message: `User role updated to ${role}` };
  } catch (error) {
    console.error('Error setting user role:', error);
    return { success: false, message: 'Failed to update user role' };
  }
}

export async function getAllUsers(): Promise<Array<{
  id: string;
  email: string;
  name: string;
  role: UserRole;
  imageUrl: string;
  createdAt: Date;
}>> {
  const currentRole = await getCurrentUserRole();
  
  if (currentRole !== 'admin') {
    return [];
  }

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 100 });
    
    return users.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
      role: (user.publicMetadata?.role as UserRole) || 'user',
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt),
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}
