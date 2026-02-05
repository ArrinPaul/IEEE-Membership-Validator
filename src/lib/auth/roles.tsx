'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { createContext, useContext, ReactNode, useMemo } from 'react';

export type UserRole = 'admin' | 'volunteer' | 'user' | 'public';

interface RoleContextType {
  role: UserRole;
  isAdmin: boolean;
  isVolunteer: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: 'public',
  isAdmin: false,
  isVolunteer: false,
  isAuthenticated: false,
  isLoading: true,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const value = useMemo(() => {
    if (!isLoaded) {
      return {
        role: 'public' as UserRole,
        isAdmin: false,
        isVolunteer: false,
        isAuthenticated: false,
        isLoading: true,
      };
    }

    if (!isSignedIn || !user) {
      return {
        role: 'public' as UserRole,
        isAdmin: false,
        isVolunteer: false,
        isAuthenticated: false,
        isLoading: false,
      };
    }

    // Get role from public metadata (set in Clerk dashboard or via API)
    const role = (user.publicMetadata?.role as UserRole) || 'user';
    
    return {
      role,
      isAdmin: role === 'admin',
      isVolunteer: role === 'volunteer' || role === 'admin',
      isAuthenticated: true,
      isLoading: false,
    };
  }, [isLoaded, isSignedIn, user]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

// Higher-order component for role-based access
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function WrappedComponent(props: P) {
    const { role, isLoading } = useRole();

    if (isLoading) {
      return <div className="flex items-center justify-center p-8">Loading...</div>;
    }

    if (!allowedRoles.includes(role)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
