'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Download, CheckCircle, Clock, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { getDatasets, activateDataset, deleteDataset, clearAllMembers, type DatasetInfo } from '@/lib/actions';
import { toast } from 'sonner';

export function DatasetManager() {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setIsLoading(true);
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error('Failed to load dataset history:', error);
      toast.error('Failed to load dataset history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    setActionId(id);
    try {
      const result = await activateDataset(id);
      if (result.success) {
        toast.success(result.message);
        loadDatasets();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Activation failed:', error);
      toast.error('Activation failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: number) => {
      if (!confirm('Are you sure you want to remove this dataset record?')) return;
      setActionId(id);
      try {
          const result = await deleteDataset(id);
          if (result.success) {
              toast.success(result.message);
              loadDatasets();
          }
      } catch (error) {
          console.error('Deletion failed:', error);
          toast.error('Deletion failed');
      } finally {
          setActionId(null);
      }
  };

  const handleWipe = async () => {
      if (!confirm('CRITICAL: This will permanently delete ALL members from the application database. Dataset files in cloud will remain. Continue?')) return;
      setIsWiping(true);
      try {
          const result = await clearAllMembers();
          if (result.success) {
              toast.success(result.message);
              loadDatasets();
          }
      } catch (error) {
          console.error('Wipe failed:', error);
          toast.error('Wipe failed');
      } finally {
          setIsWiping(false);
      }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-destructive font-headline">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanent actions that affect all membership data.
              </CardDescription>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleWipe}
              disabled={isWiping}
            >
              {isWiping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Wipe Membership Database
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Database className="h-5 w-5" />
            Cloud Dataset History
          </CardTitle>
          <CardDescription>
            Switch between previously uploaded datasets stored in Vercel Cloud.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cloud datasets found. Upload a file to see it here.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id} className={dataset.isActive ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {dataset.name}
                          {dataset.isActive && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>}
                        </div>
                        <a href={dataset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                          <Download className="h-3 w-3" /> Download Source
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dataset.rowCount.toLocaleString()} members
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(dataset.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {dataset.isActive ? (
                          <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle className="h-4 w-4" /> Live
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Stored</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!dataset.isActive && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleActivate(dataset.id)}
                              disabled={actionId !== null}
                            >
                              {actionId === dataset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activate'}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(dataset.id)}
                            disabled={actionId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
