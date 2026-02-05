'use client';

import { AdminClient } from '@/components/AdminClient';
import { CsvUploader } from '@/components/CsvUploader';
import { MemberSearch } from '@/components/MemberSearch';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { UserManagement } from '@/components/UserManagement';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Search, Upload, Users, UserSearch } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-12 sm:py-16">
      <div className="w-full text-center mb-12">
        <Badge variant="outline" className="mb-4">Admin Portal</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl font-headline">
          Administration Dashboard
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Manage members, view analytics, upload data, and control user access.
        </p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="lookup" className="flex items-center gap-2">
            <UserSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Lookup</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="search">
          <MemberSearch />
        </TabsContent>

        <TabsContent value="lookup">
          <div className="max-w-xl mx-auto">
            <AdminClient />
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <div className="max-w-xl mx-auto">
            <CsvUploader />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
