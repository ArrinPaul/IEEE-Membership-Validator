import { AdminClient } from '@/components/AdminClient';

export default function AdminPage() {
  return (
    <div className="container mx-auto flex flex-col items-center py-12 sm:py-24">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl font-headline">
          Admin Portal
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Search for a member to view their complete details.
        </p>
      </div>
      <div className="mt-10 w-full max-w-lg">
        <AdminClient />
      </div>
    </div>
  );
}
