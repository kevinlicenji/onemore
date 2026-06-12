'use client';

import { Button } from '@onemore/ui';
import { useEffect, useState } from 'react';

interface ExerciseNotesModalProps {
  open: boolean;
  title: string;
  placeholder: string;
  saveLabel: string;
  cancelLabel: string;
  initialValue: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
}

/**
 * Modal editor for per-exercise workout notes.
 */
export function ExerciseNotesModal({
  open,
  title,
  placeholder,
  saveLabel,
  cancelLabel,
  initialValue,
  saving = false,
  onClose,
  onSave,
}: ExerciseNotesModalProps): React.ReactElement | null {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setDraft(initialValue);
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        aria-label={cancelLabel}
        className="absolute inset-0"
        type="button"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-background p-4 shadow-lg">
        <h3 className="text-base font-semibold">{title}</h3>
        <textarea
          autoFocus
          className="mt-3 min-h-28 w-full rounded-md border px-3 py-2 text-sm"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button disabled={saving} type="button" variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            disabled={saving}
            type="button"
            onClick={() => {
              onSave(draft);
            }}
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
