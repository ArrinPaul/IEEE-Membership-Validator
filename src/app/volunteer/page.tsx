'use client';

import { ValidatorClient } from '@/components/ValidatorClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { CheckCircle, Clock, Users } from 'lucide-react';

export default function VolunteerPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto py-12 sm:py-16">
      <div className="w-full text-center mb-12">
        <Badge variant="outline" className="mb-4">Volunteer Portal</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl font-headline">
          Welcome, {user?.firstName || 'Volunteer'}!
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Validate IEEE memberships quickly and efficiently. Use the form below to check member status.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">Volunteer</div>
            <p className="text-xs text-muted-foreground">
              Member validation access
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Account is in good standing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date().toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validator */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <ValidatorClient />
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-16 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Quick Tips</CardTitle>
            <CardDescription>Make the most of your volunteer experience</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Always verify the membership ID matches the member&apos;s official IEEE card</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Check the expiry date to ensure the membership is still active</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>If a member&apos;s data seems incorrect, contact an administrator</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Keep member information confidential and secure</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
