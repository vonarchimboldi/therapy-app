import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="auth-page-wrapper">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
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
