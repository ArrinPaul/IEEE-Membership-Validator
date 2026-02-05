'use client';

import { ValidatorClient } from '@/components/ValidatorClient';
import { BarChart, CheckSquare, Users } from 'lucide-react';

export default function Home() {
  return (
    <>
      <section className="py-10 sm:py-20 md:py-32 lg:py-40">
        <div className="container px-4 mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl font-headline">
            Institutional IEEE Membership Verification
          </h1>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            The official portal for university administrators and IEEE student branches to verify member status, 
            streamline event check-ins, and manage chapter growth with data-driven insights.
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
      
      <section className="pb-24 bg-secondary/30">
        <div className="container px-4 mx-auto py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">Platform Capabilities</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              A comprehensive solution designed to support the operational excellence of IEEE Student Branches.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center p-6 bg-background rounded-2xl shadow-sm border">
              <div className="p-4 bg-primary/10 rounded-xl mb-6">
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-headline mb-3">Real-time Verification</h3>
              <p className="text-muted-foreground text-center">
                Instant confirmation of membership status and level, ensuring exclusive benefits reach the right individuals.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-background rounded-2xl shadow-sm border">
              <div className="p-4 bg-primary/10 rounded-xl mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-headline mb-3">Centralized Management</h3>
              <p className="text-muted-foreground text-center">
                Unified administration for chapter volunteers to upload, search, and manage member directories securely.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-background rounded-2xl shadow-sm border">
              <div className="p-4 bg-primary/10 rounded-xl mb-6">
                <BarChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-headline mb-3">Strategic Analytics</h3>
              <p className="text-muted-foreground text-center">
                Gain deep insights into membership trends, renewal cycles, and demographic distributions to plan better events.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
