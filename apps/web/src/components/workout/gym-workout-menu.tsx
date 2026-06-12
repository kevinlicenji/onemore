'use client';

import { Button } from '@onemore/ui';
import { useEffect, useRef, useState } from 'react';

interface GymWorkoutMenuProps {
  labels: {
    menu: string;
    notes: string;
    substitute: string;
    skipExercise: string;
    skipSet: string;
    finishWorkout: string;
    abandon: string;
    addSet: string;
  };
  showSubstitute: boolean;
  showSkipSet: boolean;
  showAddSet: boolean;
  disabled?: boolean;
  onNotes: () => void;
  onSubstitute: () => void;
  onSkipExercise: () => void;
  onSkipSet: () => void;
  onAddSet: () => void;
  onFinishWorkout: () => void;
  onAbandon: () => void;
}

/**
 * Overflow menu for gym workout session actions (finish, abandon, exercise tools).
 */
export function GymWorkoutMenu({
  labels,
  showSubstitute,
  showSkipSet,
  showAddSet,
  disabled = false,
  onNotes,
  onSubstitute,
  onSkipExercise,
  onSkipSet,
  onAddSet,
  onFinishWorkout,
  onAbandon,
}: GymWorkoutMenuProps): React.ReactElement {
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
        className="min-h-11 min-w-11 px-0"
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
          className="absolute right-0 z-30 mt-1 min-w-44 overflow-hidden rounded-lg border bg-background shadow-lg"
          role="menu"
        >
          <button
            className="block w-full px-4 py-3 text-left text-sm hover:bg-muted/60"
            role="menuitem"
            type="button"
            onClick={() => {
              handleAction(onNotes);
            }}
          >
            {labels.notes}
          </button>
          {showSubstitute && (
            <button
              className="block w-full px-4 py-3 text-left text-sm hover:bg-muted/60"
              role="menuitem"
              type="button"
              onClick={() => {
                handleAction(onSubstitute);
              }}
            >
              {labels.substitute}
            </button>
          )}
          {showSkipSet && (
            <button
              className="block w-full px-4 py-3 text-left text-sm hover:bg-muted/60"
              role="menuitem"
              type="button"
              onClick={() => {
                handleAction(onSkipSet);
              }}
            >
              {labels.skipSet}
            </button>
          )}
          {showAddSet && (
            <button
              className="block w-full px-4 py-3 text-left text-sm hover:bg-muted/60"
              role="menuitem"
              type="button"
              onClick={() => {
                handleAction(onAddSet);
              }}
            >
              {labels.addSet}
            </button>
          )}
          <button
            className="block w-full px-4 py-3 text-left text-sm hover:bg-muted/60"
            role="menuitem"
            type="button"
            onClick={() => {
              handleAction(onSkipExercise);
            }}
          >
            {labels.skipExercise}
          </button>
          <div className="border-t" />
          <button
            className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-muted/60"
            role="menuitem"
            type="button"
            onClick={() => {
              handleAction(onFinishWorkout);
            }}
          >
            {labels.finishWorkout}
          </button>
          <button
            className="block w-full px-4 py-3 text-left text-sm text-destructive hover:bg-muted/60"
            role="menuitem"
            type="button"
            onClick={() => {
              handleAction(onAbandon);
            }}
          >
            {labels.abandon}
          </button>
        </div>
      )}
    </div>
  );
}
