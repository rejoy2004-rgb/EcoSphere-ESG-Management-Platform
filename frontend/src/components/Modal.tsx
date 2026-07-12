import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/5 bg-[#111726] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/5 p-4 bg-[#161d30]/50">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            &times;
          </button>
        </div>
        <div className="p-6 text-slate-300 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer !== undefined && (
          <div className="flex items-center justify-end gap-3 border-t border-white/5 p-4 bg-[#161d30]/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
