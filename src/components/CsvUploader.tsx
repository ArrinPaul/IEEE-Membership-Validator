'use client';

import { useActionState } from 'react';
import { uploadMembersCsv, type CsvUploadState } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';

const initialState: CsvUploadState = {
  status: 'idle',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
      Upload CSV
    </Button>
  );
}

export function CsvUploader() {
  const [state, formAction] = useActionState(uploadMembersCsv, initialState);

  const renderResult = () => {
    switch (state.status) {
      case 'success':
        return (
          <div className="rounded-lg border border-green-500 bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-300">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500 mt-1" />
              <div>
                <h3 className="font-bold font-headline">Upload Successful</h3>
                <p className="mt-1 text-sm">{state.message}</p>
              </div>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive dark:bg-destructive/20">
            <div className="flex items-start gap-4">
              <XCircle className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold font-headline">Upload Failed</h3>
                <p className="mt-1 text-sm">{state.message}</p>
              </div>
            </div>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 border border-dashed rounded-lg">
            <Upload className="h-10 w-10 mb-3 text-muted-foreground/50"/>
            <p className="text-sm">Upload status will be shown here.</p>
          </div>
        );
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Upload Members</CardTitle>
        <CardDescription>Upload a CSV file with member data.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Input name="csvFile" type="file" accept=".csv" required />
          </div>
          <SubmitButton />
        </form>
        
        <div className="mt-6 min-h-[240px] transition-opacity duration-300">
            {renderResult()}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <p><strong>Note:</strong> The CSV file must have the following headers in this order: <code>id,name,email,membershipLevel,joinDate,expiryDate</code>.</p>
        </div>
      </CardContent>
    </Card>
  );
}
