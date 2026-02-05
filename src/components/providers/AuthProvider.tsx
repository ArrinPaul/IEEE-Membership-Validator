'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { RoleProvider } from '@/lib/auth/roles';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'shadow-lg',
        },
      }}
    >
      <RoleProvider>{children}</RoleProvider>
    </ClerkProvider>
  );
}
