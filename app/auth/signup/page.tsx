import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="from-pw-accent/10 to-pw-accent/5 flex min-h-screen items-center justify-center bg-gradient-to-br px-4 py-12 sm:px-6 lg:px-8">
      <SignupForm />
    </div>
  );
}
