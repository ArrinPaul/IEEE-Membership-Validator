'use client';

import { useActionState } from 'react';
import { getAdminMemberDetails, type AdminSearchState } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserSearch, XCircle, Search } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Badge } from '@/components/ui/badge';

const initialState: AdminSearchState = {
  status: 'idle',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      Search Member
    </Button>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between border-b py-3 last:border-b-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">{value}</dd>
        </div>
    );
}

export function AdminClient() {
  const [state, formAction] = useActionState(getAdminMemberDetails, initialState);

  const renderResult = () => {
    switch (state.status) {
      case 'found':
        if (!state.member) return null;
        const isActive = new Date(state.member.expiryDate) > new Date();
        return (
          <Card className="mt-6 shadow-md">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">{state.member.name}</CardTitle>
                <CardDescription>Membership ID: {state.member.id}</CardDescription>
              </div>
              <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-green-600 text-white' : ''}>
                {isActive ? 'Active' : 'Expired'}
              </Badge>
            </CardHeader>
            <CardContent>
                <dl className="text-sm">
                    <DetailRow label="Email" value={state.member.email} />
                    <DetailRow label="Membership Level" value={state.member.membershipLevel} />
                    <DetailRow label="Join Date" value={new Date(state.member.joinDate).toLocaleDateString()} />
                    <DetailRow label="Expiry Date" value={new Date(state.member.expiryDate).toLocaleDateString()} />
                </dl>
            </CardContent>
          </Card>
        );
      case 'not_found':
        return (
            <div className="mt-6 rounded-lg border border-accent/50 bg-accent/10 p-4 text-accent-foreground/80">
              <div className="flex items-start gap-4">
                <XCircle className="h-6 w-6 flex-shrink-0 text-accent mt-1" />
                <div>
                  <h3 className="font-bold font-headline">Search Failed</h3>
                  <p className="mt-1 text-sm">{state.message}</p>
                </div>
              </div>
            </div>
          );
      case 'idle':
      default:
        return (
          <div className="mt-6 flex flex-col items-center justify-center text-center text-muted-foreground p-6 border border-dashed rounded-lg">
            <UserSearch className="h-10 w-10 mb-3 text-muted-foreground/50"/>
            <p className="text-sm">Member details will appear here.</p>
          </div>
        );
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Member Details</CardTitle>
        <CardDescription>Enter the 8-digit membership ID.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Input name="membershipId" placeholder="e.g., 12345678" maxLength={8} required className="text-base" />
            {state.status === 'error' && <p className="text-sm text-destructive mt-2">{state.message}</p>}
          </div>
          <SubmitButton />
        </form>
        
        <div className="mt-6 min-h-[240px] transition-opacity duration-300">
            {renderResult()}
        </div>
      </CardContent>
    </Card>
  );
}
