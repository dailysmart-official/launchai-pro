import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CreditCard, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!(session?.user as { id?: string } | undefined)?.id) redirect("/login");
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Welcome, {session?.user?.name ?? session?.user?.email}!</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI Writer</CardTitle></CardHeader><CardContent><Button asChild><Link href="/writer">Open Writer</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Billing</CardTitle></CardHeader><CardContent><Button variant="outline" asChild><Link href="/billing">Manage</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Teams</CardTitle></CardHeader><CardContent><Button variant="outline" asChild><Link href="/teams">View Teams</Link></Button></CardContent></Card>
      </div>
    </div>
  );
}
