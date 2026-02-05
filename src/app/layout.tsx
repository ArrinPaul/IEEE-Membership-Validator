import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { Header } from '@/components/layout/Header';
import { ThemeProvider, AuthProvider } from '@/components/providers';

export const metadata: Metadata = {
  title: 'IEEE Validate',
  description: 'Validate IEEE Memberships for your university',
  keywords: ['IEEE', 'membership', 'validation', 'verification', 'student branch'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col bg-background">
              <Header />
              <main className="flex-1">{children}</main>
              <footer className="border-t py-6 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} IEEE Membership Validator. All rights reserved.</p>
              </footer>
            </div>
            <Toaster />
            <SonnerToaster position="top-right" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
