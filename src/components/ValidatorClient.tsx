'use client';

import { useActionState } from 'react';
import { validateMembership, type ValidationState } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, User } from 'lucide-react';
import { useFormStatus } from 'react-dom';

const initialState: ValidationState = {
  status: 'idle',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Validate
    </Button>
  );
}

export function ValidatorClient() {
  const [state, formAction] = useActionState(validateMembership, initialState);

  const renderResult = () => {
    switch (state.status) {
      case 'valid':
        if (!state.member) return null;
        const isActive = new Date(state.member.expiryDate) > new Date();

        return (
          <div className={`rounded-lg border p-4 ${isActive ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300' : 'border-destructive/50 bg-destructive/10 text-destructive dark:bg-destructive/20'}`}>
            <div className="flex items-start gap-4">
              {isActive ? <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500 mt-1" /> : <XCircle className="h-6 w-6 flex-shrink-0 mt-1" />}
              <div>
                <h3 className="font-bold font-headline">{isActive ? 'Valid & Active Membership' : 'Expired Membership'}</h3>
                <dl className="mt-2 text-sm">
                  <div className="flex gap-2"><dt className="font-medium">Name:</dt><dd>{state.member.name}</dd></div>
                  <div className="flex gap-2"><dt className="font-medium">Status:</dt><dd className="font-semibold">{isActive ? 'Active' : 'Expired'}</dd></div>
                  <div className="flex gap-2"><dt className="font-medium">Expires on:</dt><dd>{new Date(state.member.expiryDate).toLocaleDateString()}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        );
      case 'invalid':
        return state.message && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive dark:bg-destructive/20">
            <div className="flex items-start gap-4">
              <XCircle className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold font-headline">Validation Failed</h3>
                <p className="mt-1 text-sm">{state.message}</p>
              </div>
            </div>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-6 border border-dashed rounded-lg">
            <User className="h-10 w-10 mb-3 text-muted-foreground/50"/>
            <p className="text-sm">Your validation result will appear here.</p>
          </div>
        );
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Check Membership</CardTitle>
        <CardDescription>Enter the membership ID below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
             <Input name="membershipId" placeholder="e.g., 98765432" required className="text-base" />
             {state.status === 'error' && <p className="text-sm text-destructive mt-2">{state.message}</p>}
          </div>
          <SubmitButton />
        </form>
        
        <div className="mt-6 min-h-[120px] transition-opacity duration-300">
            {renderResult()}
        </div>
      </CardContent>
    </Card>
  );
}
