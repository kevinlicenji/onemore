'use client';

import { Button } from '@onemore/ui';
import { useEffect, useRef, useState } from 'react';

interface ExerciseActionsMenuProps {
  labels: {
    menu: string;
    notes: string;
    skip: string;
  };
  disabled?: boolean;
  onNotes: () => void;
  onSkip: () => void;
}

/**
 * Compact overflow menu for in-workout exercise actions.
 */
export function ExerciseActionsMenu({
  labels,
  disabled = false,
  onNotes,
  onSkip,
}: ExerciseActionsMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  function handleAction(action: () => void): void {
    setOpen(false);
    action();
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={labels.menu}
        disabled={disabled}
        size="sm"
        type="button"
        variant="outline"
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        ···
      </Button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-36 overflow-hidden rounded-md border bg-background shadow-md"
          role="menu"
        >
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
            role="menuitem"
            type="button"
            onClick={() => {
              handleAction(onNotes);
            }}
          >
            {labels.notes}
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
            role="menuitem"
            type="button"
            onClick={() => {
              handleAction(onSkip);
            }}
          >
            {labels.skip}
          </button>
        </div>
      )}
    </div>
  );
}
