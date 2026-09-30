import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export function CreditMeter({ used, total }: { used: number; total: number }) {
  const percentage = Math.min(100, Math.round((used / total) * 100));
  const isWarning = percentage > 80;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between mb-2 text-sm">
          <span className="font-medium">AI Credits Used</span>
          <span className="text-muted-foreground">{used.toLocaleString()} / {total.toLocaleString()}</span>
        </div>
        <Progress value={percentage} className={isWarning ? "[&>div]:bg-destructive" : ""} />
        {isWarning && <p className="text-xs text-destructive mt-2">You have used {percentage}% of your credits.</p>}
      </CardContent>
    </Card>
  );
}
