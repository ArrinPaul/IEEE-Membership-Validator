'use client';

import { ValidatorClient } from '@/components/ValidatorClient';
import { BarChart, CheckSquare, Users } from 'lucide-react';

export default function Home() {
  return (
    <>
      <section className="py-10 sm:py-20 md:py-32 lg:py-40">
        <div className="container px-4 mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl font-headline">
            IEEE Membership Validation Portal
          </h1>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground">
            Quickly and easily verify the status of IEEE memberships for your students and faculty.
            Ensure only active members access exclusive resources and events.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 lg:pb-32">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-lg">
              <ValidatorClient />
            </div>
          </div>
        </div>
      </section>
      
      <section className="pb-24 bg-secondary/50">
        <div className="container mx-auto py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Why Use the Validator?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Streamline your verification process and manage your local IEEE chapter more efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold font-headline">Instant Verification</h3>
              <p className="mt-2 text-muted-foreground">
                Get real-time confirmation of membership status.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold font-headline">Bulk Management</h3>
              <p className="mt-2 text-muted-foreground">
                Use the Admin Portal to upload and manage lists of members via CSV.
              </p>
            </div>
            <div className="flex flex-col items-center">
               <div className="p-4 bg-primary/10 rounded-full mb-4">
                <BarChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold font-headline">Simplified Reporting</h3>
              <p className="mt-2 text-muted-foreground">
                Easily see member details and expiry dates for planning.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
