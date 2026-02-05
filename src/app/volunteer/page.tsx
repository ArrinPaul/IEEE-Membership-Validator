'use client';

import { ValidatorClient } from '@/components/ValidatorClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { CheckCircle, Clock, Users } from 'lucide-react';

export default function VolunteerPage() {
  const { user } = useUser();

  return (
    <div className="container px-4 mx-auto py-10 sm:py-16">
      <div className="w-full text-center mb-12">
        <Badge variant="outline" className="mb-4">Operational Portal</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-5xl font-headline">
          Welcome, {user?.firstName || 'Colleague'}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          You are logged into the operational dashboard. Use the verification engine below to confirm active status 
          and membership credentials for chapter participants.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Role</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">Volunteer</div>
            <p className="text-xs text-muted-foreground mt-1">
              Validation & Operational Access
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authorization Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              Session is verified and secure
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Session</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              IEEE Validator System Time
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

      {/* Protocol Section */}
      <div className="mt-16 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Standard Operating Protocols</CardTitle>
            <CardDescription>Guidelines for secure member verification</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-full p-1 bg-green-500/10">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span>**Verify Identity**: Ensure the membership ID matches the participant&apos;s physical or digital IEEE membership card.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-full p-1 bg-green-500/10">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span>**Expiry Awareness**: Pay close attention to the expiration date. Grace periods may apply depending on local chapter policy.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-full p-1 bg-green-500/10">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span>**Data Integrity**: If a membership record appears incorrect or outdated, notify an administrator immediately for dataset revision.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 rounded-full p-1 bg-green-500/10">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span>**Confidentiality**: Treat all retrieved member data as sensitive information. Do not share or export data outside of official portal functions.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
