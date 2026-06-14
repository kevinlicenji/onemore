'use client';

import { Button } from '@onemore/ui';

import { GymAdaptiveOverlay } from '@/components/gym-ui/gym-adaptive-overlay';

interface ActiveWorkoutConflictSheetProps {
  open: boolean;
  title: string;
  message?: string;
  saveAndStartLabel: string;
  discardAndStartLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onSaveAndStart: () => void;
  onDiscardAndStart: () => void;
  onCancel: () => void;
}

/**
 * Three-way choice when starting a new workout while another session is still active.
 */
export function ActiveWorkoutConflictSheet({
  open,
  title,
  message,
  saveAndStartLabel,
  discardAndStartLabel,
  cancelLabel,
  loading = false,
  onSaveAndStart,
  onDiscardAndStart,
  onCancel,
}: ActiveWorkoutConflictSheetProps): React.ReactElement {
  return (
    <GymAdaptiveOverlay ariaLabel={title} open={open} title={title} onClose={onCancel}>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="min-h-12 w-full"
          disabled={loading}
          type="button"
          onClick={onSaveAndStart}
        >
          {saveAndStartLabel}
        </Button>
        <Button
          className="min-h-12 w-full"
          disabled={loading}
          type="button"
          variant="outline"
          onClick={onDiscardAndStart}
        >
          {discardAndStartLabel}
        </Button>
        <Button
          className="min-h-12 w-full"
          disabled={loading}
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </div>
    </GymAdaptiveOverlay>
  );
}
