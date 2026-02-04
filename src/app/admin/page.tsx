import { AdminClient } from '@/components/AdminClient';
import { CsvUploader } from '@/components/CsvUploader';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-12 sm:py-16">
      <div className="w-full text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl font-headline">
          Admin Portal
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Manage IEEE membership data by searching for individual members or bulk uploading member information via CSV.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <AdminClient />
        <CsvUploader />
      </div>
    </div>
  );
}
