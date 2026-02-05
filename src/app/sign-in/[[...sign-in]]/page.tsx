import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
