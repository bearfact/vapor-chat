'use client';

import { useEffect, useRef } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  confirmText = 'OK',
  cancelText = 'Cancel',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-charcoal border-2 border-accent-magenta rounded-lg shadow-[0_0_30px_rgba(255,31,240,0.3)] max-w-md w-full mx-4 p-6 animate-in fade-in duration-200"
      >
        {title && (
          <h2
            id="dialog-title"
            className="text-xl font-bold text-accent-magenta mb-4"
          >
            {title}
          </h2>
        )}
        <p className="text-foreground mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3 justify-end">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-background border-2 border-gray/30 hover:border-gray text-foreground rounded-lg font-semibold transition-all duration-300"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-accent-magenta hover:bg-accent-magenta/90 text-background font-bold rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,31,240,0.5)]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
