import { requireRole } from "@/lib/rbac/guard";
import { listCertificateRequests } from "@/services/certificate";
import { CertificatesTableClient } from "./certificates-table-client";

export const dynamic = "force-dynamic";

export default async function HRCertificatesPage() {
  const actor = await requireRole("HR");
  const rows = await listCertificateRequests(actor);
  return <CertificatesTableClient initial={JSON.parse(JSON.stringify(rows))} canDecide />;
}
