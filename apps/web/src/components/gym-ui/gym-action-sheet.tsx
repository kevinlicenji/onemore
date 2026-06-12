'use client';

import { Button } from '@onemore/ui';

import { GymAdaptiveOverlay } from './gym-adaptive-overlay';

interface GymActionSheetProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation overlay: bottom sheet on mobile, centered dialog on desktop.
 */
export function GymActionSheet({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: GymActionSheetProps): React.ReactElement {
  return (
    <GymAdaptiveOverlay ariaLabel={title} open={open} title={title} onClose={onCancel}>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="min-h-12 w-full"
          disabled={loading}
          type="button"
          variant={destructive ? 'destructive' : 'default'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button
          className="min-h-12 w-full"
          disabled={loading}
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </div>
    </GymAdaptiveOverlay>
  );
}
