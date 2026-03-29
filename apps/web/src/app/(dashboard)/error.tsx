"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
      <AlertTriangle className="h-8 w-8 text-destructive/60" />
      <div>
        <h2 className="font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-1">Failed to load this section. Please try again.</p>
      </div>
      <Button onClick={reset} size="sm" variant="outline">Try again</Button>
    </div>
  );
}
