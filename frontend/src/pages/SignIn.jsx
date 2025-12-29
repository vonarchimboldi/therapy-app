import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="auth-page-wrapper">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "auth-root-box",
            card: "auth-card"
          }
        }}
      />
    </div>
  );
}
