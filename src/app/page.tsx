import { ValidatorClient } from '@/components/ValidatorClient';

export default function Home() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center py-12 sm:py-24">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl font-headline">
          IEEE Membership Validator
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Enter an IEEE membership number to verify its status.
        </p>
      </div>
      <div className="mt-10 w-full max-w-md">
        <ValidatorClient />
      </div>
    </div>
  );
}
