"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { createPortalAction } from "../actions";

/** Opens the Stripe Customer Portal (update card, cancel, invoices). */
export function ManageBillingButton() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openPortal = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await createPortalAction();
      if (result.success) {
        window.location.href = result.url;
        return;
      }
      setError(result.error);
    } catch {
      setError("Unable to open the billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={openPortal} disabled={loading}>
        {loading ? "Opening..." : "Manage billing"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
