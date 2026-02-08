"use client";

import { X } from "lucide-react";

interface ResultModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export default function ResultModal({ title, children, onClose }: ResultModalProps) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="modal-content max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 id="modal-title" className="text-xl font-semibold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 text-gray-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
