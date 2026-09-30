"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteMemberAction } from "../actions";

export function InviteForm() {
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      const result = await inviteMemberAction({ email, role: "member" });
      if (result.success) {
        setEmail("");
        setMessage(`Invite sent to ${email}`);
      } else {
        setMessage(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Invite"}
          </Button>
        </form>
        {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
