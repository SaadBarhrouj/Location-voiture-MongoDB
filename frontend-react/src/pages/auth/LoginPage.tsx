import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}