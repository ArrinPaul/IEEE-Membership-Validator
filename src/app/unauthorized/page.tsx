import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            This page requires specific permissions. If you believe you should have access,
            please contact an administrator.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/volunteer">Go to Volunteer Portal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
