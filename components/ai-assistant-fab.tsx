import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  href?: string;
  label?: string;
};

/**
 * Floating AI Assistant / Quick Writer Shortcut
 * Fixed circular FAB in bottom-left — navigates to AI Writer.
 * Use in dashboard pages: <AiAssistantFab /> (defaults to /writer)
 */
export function AiAssistantFab({ href = "/dashboard/writer", label = "Open AI Writer" }: Props) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="fixed bottom-6 left-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Sparkles className="h-6 w-6" />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export default AiAssistantFab;
