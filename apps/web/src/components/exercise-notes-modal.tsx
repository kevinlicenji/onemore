'use client';

import { Button } from '@onemore/ui';
import { useEffect, useState } from 'react';

import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';

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
 * Adaptive overlay editor for per-exercise workout notes.
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

  return (
    <GymAdaptiveOverlay ariaLabel={title} open={open} title={title} onClose={onClose}>
      <textarea
        autoFocus
        className="min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm"
        placeholder={placeholder}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <div className="flex gap-2">
        <Button
          className="min-h-12 flex-1"
          disabled={saving}
          type="button"
          variant="outline"
          onClick={onClose}
        >
          {cancelLabel}
        </Button>
        <Button
          className="min-h-12 flex-1"
          disabled={saving}
          type="button"
          onClick={() => {
            onSave(draft);
          }}
        >
          {saveLabel}
        </Button>
      </div>
    </GymAdaptiveOverlay>
  );
}
