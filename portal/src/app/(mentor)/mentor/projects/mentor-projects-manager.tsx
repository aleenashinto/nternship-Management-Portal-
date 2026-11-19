"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";

const ALL_TOOLS = ["EXCEL", "SQL", "POWER_BI", "TABLEAU", "PYTHON", "OTHER"] as const;

type ProjectRow = {
  id: string;
  title: string;
  toolsUsed: string[];
  instructions: string;
  dataSourceText: string | null;
  createdByMentorId: string;
  createdBy: { id: string; name: string };
  files: { id: string; kind: string; originalName: string; size: number }[];
  _count: { assignments: number };
};

const field = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm";

export function MentorProjectsManager({
  initial,
  actorMentorId,
  isAdmin,
}: {
  initial: ProjectRow[];
  actorMentorId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<null | "new" | ProjectRow>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>(["PYTHON", "SQL"]);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setSelectedTools(["PYTHON", "SQL"]);
    setEditing("new");
  }

  function openEdit(p: ProjectRow) {
    setSelectedTools(p.toolsUsed);
    setEditing(p);
  }

  function toggleTool(t: string) {
    setSelectedTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function uploadProjectFile(projectId: string, file: File, kind: "PROJECT_DATA" | "PROJECT_INSTRUCTIONS") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    await api(`/api/projects/${projectId}/files`, { method: "POST", body: fd });
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTools.length === 0) return toast.error("Select at least one tool");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      title: String(fd.get("title") ?? ""),
      toolsUsed: selectedTools,
      instructions: String(fd.get("instructions") ?? ""),
      dataSourceText: String(fd.get("dataSourceText") ?? ""),
    };
    const dataFile = fd.get("dataFile");
    const pdfFile = fd.get("instructionPdf");

    setBusy(true);
    try {
      let projectId = editing && editing !== "new" ? editing.id : "";
      if (editing && editing !== "new") {
        await api(`/api/projects/${editing.id}`, { method: "PATCH", json: body });
      } else {
        const created = await api<{ id: string }>("/api/projects", { method: "POST", json: body });
        projectId = created.id;
      }

      if (dataFile instanceof File && dataFile.size > 0) {
        await uploadProjectFile(projectId, dataFile, "PROJECT_DATA");
      }
      if (pdfFile instanceof File && pdfFile.size > 0) {
        await uploadProjectFile(projectId, pdfFile, "PROJECT_INSTRUCTIONS");
      }

      toast.success(editing === "new" ? "Reusable project created" : "Project updated");
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const current = editing && editing !== "new" ? editing : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reusable Project Templates</h1>
          <p className="text-sm text-gray-500">
            Create reusable projects with tools, instructions, data source files/API details, and instruction PDFs.
          </p>
        </div>
        <button onClick={openNew} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          + New Project Template
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {initial.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
            No project templates yet.
          </div>
        )}
        {initial.map((p) => {
          const canEdit = isAdmin || p.createdByMentorId === actorMentorId;
          return (
            <div key={p.id} className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-gray-900">{p.title}</h2>
                  {canEdit && (
                    <button onClick={() => openEdit(p)} className="text-xs font-semibold text-brand-600 hover:underline">
                      Edit
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.toolsUsed.map((t) => (
                    <span key={t} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="whitespace-pre-line text-xs text-gray-600 line-clamp-3">{p.instructions}</p>
                {p.dataSourceText && (
                  <p className="rounded-xl bg-gray-50 p-2 text-xs text-gray-600">
                    <b>Data Source:</b> {p.dataSourceText}
                  </p>
                )}
                {p.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.files.map((f) => (
                      <a
                        key={f.id}
                        href={`/api/files/${f.id}`}
                        className="rounded-lg border border-brand-100 bg-brand-50/50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                      >
                        {f.kind === "PROJECT_INSTRUCTIONS" ? "PDF: " : "Data: "}
                        {f.originalName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                <span>By {p.createdBy.name}</span>
                <span>Assigned {p._count.assignments} times</span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={current ? `Edit ${current.title}` : "Create Reusable Project"}>
        <form onSubmit={onSave} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Project Title *
            <input name="title" required minLength={3} defaultValue={current?.title ?? ""} className={field} />
          </label>
          <div>
            <span className="block text-xs font-semibold text-gray-700">Tools Used (multi-select) *</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {ALL_TOOLS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTool(t)}
                  className={`rounded-xl border px-3 py-1 text-xs font-semibold ${
                    selectedTools.includes(t)
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-semibold text-gray-700">
            Instructions *
            <textarea name="instructions" required rows={4} defaultValue={current?.instructions ?? ""} className={field} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Data Source Description (API / Database connection details)
            <input name="dataSourceText" defaultValue={current?.dataSourceText ?? ""} className={field} />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-gray-700">
              Upload Data Source File (optional)
              <input name="dataFile" type="file" className="mt-1 block w-full text-xs text-gray-600" />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Upload Instruction PDF (optional)
              <input name="instructionPdf" type="file" accept=".pdf" className="mt-1 block w-full text-xs text-gray-600" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
