import { redirect } from "next/navigation";

// /dashboard/writer is a convenience alias for /writer.
// Canonical writer lives at app/(dashboard)/writer/page.tsx.
export default function DashboardWriterAlias() {
  redirect("/writer");
}
