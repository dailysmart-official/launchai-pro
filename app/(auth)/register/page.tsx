import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Create account</CardTitle><CardDescription>Get started with LaunchAI Pro</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" asChild><Link href="/login">Continue with Google</Link></Button>
          <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="underline">Sign in</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
