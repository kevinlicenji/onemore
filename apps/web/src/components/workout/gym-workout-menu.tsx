'use client';

import { Button, cn } from '@onemore/ui';
import { useState } from 'react';

import { GymSheet } from '@/components/gym-ui/gym-sheet';

interface GymWorkoutMenuProps {
  labels: {
    menu: string;
    notes: string;
    skipExercise: string;
    finishWorkout: string;
    abandon: string;
    addSet: string;
  };
  showAddSet: boolean;
  showSkipExercise: boolean;
  disabled?: boolean;
  onNotes: () => void;
  onSkipExercise: () => void;
  onAddSet: () => void;
  onFinishWorkout: () => void;
  onAbandon: () => void;
}

/**
 * Workout overflow actions as a bottom sheet (mobile gym pattern).
 */
export function GymWorkoutMenu({
  labels,
  showAddSet,
  showSkipExercise,
  disabled = false,
  onNotes,
  onSkipExercise,
  onAddSet,
  onFinishWorkout,
  onAbandon,
}: GymWorkoutMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  function handleAction(action: () => void): void {
    setOpen(false);
    action();
  }

  const actions = [
    { label: labels.notes, onClick: onNotes },
    ...(showAddSet ? [{ label: labels.addSet, onClick: onAddSet }] : []),
    ...(showSkipExercise ? [{ label: labels.skipExercise, onClick: onSkipExercise }] : []),
    { label: labels.finishWorkout, onClick: onFinishWorkout, emphasis: true as const },
    { label: labels.abandon, onClick: onAbandon, destructive: true as const },
  ];

  return (
    <>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={labels.menu}
        className="min-h-11 min-w-11 px-0"
        disabled={disabled}
        size="sm"
        type="button"
        variant="outline"
        onClick={() => {
          setOpen(true);
        }}
      >
        ···
      </Button>

      <GymSheet
        ariaLabel={labels.menu}
        open={open}
        title={labels.menu}
        onClose={() => {
          setOpen(false);
        }}
      >
        <ul className="overflow-hidden rounded-2xl border border-gym-separator bg-gym-surface">
          {actions.map((action, index) => (
            <li key={action.label} className={cn(index > 0 && 'border-t border-gym-separator')}>
              <button
                className={cn(
                  'flex min-h-12 w-full items-center px-4 py-3 text-left text-base transition-colors active:bg-muted/50',
                  action.destructive && 'font-medium text-destructive',
                  action.emphasis && 'font-semibold text-primary',
                )}
                type="button"
                onClick={() => {
                  handleAction(action.onClick);
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      </GymSheet>
    </>
  );
}
