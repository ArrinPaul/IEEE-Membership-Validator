'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { searchMembers, getFilterOptions, exportMembersToCsv, type SearchFilters, type SearchResult } from '@/lib/actions';
import { toast } from 'sonner';

export function MemberSearch() {
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    region: '',
    school: '',
    membershipLevel: '',
  });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [filterOptions, setFilterOptions] = useState<{
    regions: string[];
    schools: string[];
    membershipLevels: string[];
  }>({ regions: [], schools: [], membershipLevels: [] });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = useCallback((page = 1) => {
    startTransition(async () => {
      const searchResult = await searchMembers(filters, page, 10);
      setResult(searchResult);
      setCurrentPage(page);
    });
  }, [filters]);

  useEffect(() => {
    getFilterOptions().then(setFilterOptions);
    handleSearch();
  }, [handleSearch]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = await exportMembersToCsv(filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ieee-members-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const isActive = (expiryDate: string) => new Date(expiryDate) > new Date();

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Filter className="h-5 w-5" />
            Search & Filter Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name, email, or school..."
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value as SearchFilters['status'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="expired">Expired Only</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.region || 'all'}
              onValueChange={(value) => setFilters({ ...filters, region: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {filterOptions.regions.map((region) => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.school || 'all'}
              onValueChange={(value) => setFilters({ ...filters, school: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {filterOptions.schools.map((school) => (
                  <SelectItem key={school} value={school}>{school}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.membershipLevel || 'all'}
              onValueChange={(value) => setFilters({ ...filters, membershipLevel: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Membership Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {filterOptions.membershipLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleSearch(1)} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={isExporting || !result?.total}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Results ({result.total} members found)</span>
              {result.total > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Page {result.page} of {result.totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.total === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No members found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-mono">{member.id}</TableCell>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell className="text-muted-foreground">{member.emailAddress || member.email}</TableCell>
                          <TableCell className="text-muted-foreground">{member.schoolName}</TableCell>
                          <TableCell>
                            <Badge variant={isActive(member.expiryDate) ? 'default' : 'destructive'}>
                              {isActive(member.expiryDate) ? 'Active' : 'Expired'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(member.expiryDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {result.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(currentPage - 1)}
                      disabled={currentPage <= 1 || isPending}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {currentPage} of {result.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(currentPage + 1)}
                      disabled={currentPage >= result.totalPages || isPending}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
