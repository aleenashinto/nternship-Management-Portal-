"use client";

import { useEffect, useRef } from "react";

/** Accessible modal on the native <dialog> element (focus trap, Esc to close, aria-modal built in). */
export function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="modal-title"
      className="m-auto w-full max-w-lg rounded-2xl border border-gray-100 p-0 shadow-2xl backdrop:bg-black/40"
    >
      {open && (
        <div className="p-6">
          <h2 id="modal-title" className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", destructive = false, busy = false, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel?: string;
  destructive?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
            destructive ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"
          }`}
        >
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
