import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditMeter } from "@/features/billing/components/credit-meter";
import { PreviewBadge } from "@/components/preview-badge";

export function StatCards({
  totalGenerations,
  totalTokens,
  creditsUsed,
  creditsTotal,
}: {
  totalGenerations: number;
  totalTokens: number;
  creditsUsed: number;
  creditsTotal: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Generations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGenerations.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Consumed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Credits</CardTitle>
          <PreviewBadge />
        </CardHeader>
        <CardContent>
          <CreditMeter used={creditsUsed} total={creditsTotal} />
        </CardContent>
      </Card>
    </div>
  );
}
