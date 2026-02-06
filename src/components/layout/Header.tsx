'use client';

import Link from 'next/link';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useRole } from '@/lib/auth/roles';

export function Header() {
  const { setTheme, theme } = useTheme();
  const { isSignedIn, isLoaded } = useAuth();
  const { role, isAdmin, isVolunteer } = useRole();

  const NavLinks = () => (
    <>
      {isVolunteer && (
        <Link
          href="/volunteer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Volunteer Portal
        </Link>
      )}
      {isAdmin && (
        <Link
          href="/admin"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Admin Portal
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold sm:inline-block font-headline">IEEE VALIDATOR</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          <NavLinks />
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 ml-auto">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Auth Buttons */}
          {isLoaded && (
            <>
              {!isSignedIn ? (
                <div className="hidden sm:flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm">Sign Up</Button>
                  </SignUpButton>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="hidden sm:flex capitalize">
                    {role}
                  </Badge>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'h-8 w-8',
                      },
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="font-headline">Navigation</SheetTitle>
              <nav className="flex flex-col space-y-4 mt-6">
                <Link href="/" className="text-lg font-medium">
                  Home
                </Link>
                {isVolunteer && (
                  <Link href="/volunteer" className="text-lg font-medium">
                    Volunteer Portal
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-lg font-medium">
                    Admin Portal
                  </Link>
                )}
                {!isSignedIn && (
                  <>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full">Sign Up</Button>
                    </SignUpButton>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
