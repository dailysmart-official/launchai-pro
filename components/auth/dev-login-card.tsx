"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DevLoginCard() {
  const [email, setEmail] = useState("dev@launchai.pro");
  const [password, setPassword] = useState("dev1234");
  const [loading, setLoading] = useState(false);

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
    setLoading(false);
  }

  return (
    <div className="mt-2 p-4 border border-dashed rounded-lg bg-yellow-50 dark:bg-yellow-950/20 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Local Dev Login (dev only — hidden in production)</p>
      <p className="text-xs text-muted-foreground">Default: dev@launchai.pro / dev1234</p>
      <form onSubmit={handleDevLogin} className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="dev-email" className="text-xs">Email</Label>
          <Input id="dev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dev@launchai.pro" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dev-password" className="text-xs">Password</Label>
          <Input id="dev-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="dev1234" />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login as Dev (Local Only)"}
        </Button>
      </form>
    </div>
  );
}
