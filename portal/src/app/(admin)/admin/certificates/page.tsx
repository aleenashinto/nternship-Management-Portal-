import { requireExactRole } from "@/lib/rbac/guard";
import { listCertificateRequests } from "@/services/certificate";
import { CertificatesTableClient } from "@/app/(hr)/hr/certificates/certificates-table-client";

export const dynamic = "force-dynamic";

export default async function AdminCertificatesPage() {
  const actor = await requireExactRole("ADMIN");
  const rows = await listCertificateRequests(actor);
  return <CertificatesTableClient initial={JSON.parse(JSON.stringify(rows))} canDecide />;
}
