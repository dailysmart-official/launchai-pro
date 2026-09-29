import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DevLoginCard } from "@/components/auth/dev-login-card";

export default function LoginPage() {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Welcome back</CardTitle><CardDescription>Sign in to continue to LaunchAI Pro</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
            <Button type="submit" className="w-full">Continue with Google</Button>
          </form>
          {isDev && <DevLoginCard />}
        </CardContent>
      </Card>
    </main>
  );
}
