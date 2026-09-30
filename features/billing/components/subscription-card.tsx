import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditMeter } from "./credit-meter";
import type { SubscriptionState } from "../types";

export function SubscriptionCard({ sub }: { sub: SubscriptionState }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="capitalize">{sub.planId}</CardTitle>
          <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
        </div>
        <CardDescription>Current period ends {new Date(sub.currentPeriodEnd).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CreditMeter used={sub.creditsUsed} total={sub.creditsTotal} />
        <Button variant="outline" className="w-full">Manage Billing</Button>
      </CardContent>
    </Card>
  );
}
