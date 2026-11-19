import { requireRole } from "@/lib/rbac/guard";
import { listCertificateRequests } from "@/services/certificate";

export const dynamic = "force-dynamic";

export default async function InternCertificatePage() {
  const actor = await requireRole("INTERN");
  const rows = await listCertificateRequests(actor);
  const req = rows[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Internship Certificate</h1>
        <p className="text-sm text-gray-500">
          Your certificate is generated after your mentor marks your overall internship completed and HR approves the request.
        </p>
      </div>

      {!req && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-sm text-gray-500">
          Your internship is currently ongoing. Once your mentor marks your internship completed, a certificate request will be sent to HR automatically.
        </div>
      )}

      {req && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Certificate Request Status</span>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">{req.status}</span>
          </div>
          {req.rejectionReason && (
            <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
              <b>Rejection Reason:</b> {req.rejectionReason}
            </p>
          )}
          {req.certificate && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Certificate ID: {req.certificate.certificateNumber}</p>
                <p className="text-xs text-gray-500">Issued on {new Date(req.certificate.issueDate).toLocaleDateString()}</p>
              </div>
              <a
                href={`/api/certificates/${req.certificate.id}/download`}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Download Official PDF Certificate
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
