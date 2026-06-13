'use client';

import { Button, cn } from '@onemore/ui';
import Link from 'next/link';
import { useState } from 'react';

import { GymSheet } from '@/components/gym-ui/gym-sheet';

interface ProgramActionsMenuProps {
  labels: {
    menu: string;
    edit: string;
    setActive: string;
    delete: string;
  };
  editHref: string;
  showSetActive: boolean;
  disabled?: boolean;
  onSetActive: () => void;
  onDelete: () => void;
}

interface ProgramLinkAction {
  label: string;
  href: string;
}

interface ProgramButtonAction {
  label: string;
  onClick: () => void;
  destructive?: true;
}

type ProgramAction = ProgramLinkAction | ProgramButtonAction;

function isLinkAction(action: ProgramAction): action is ProgramLinkAction {
  return 'href' in action;
}

/**
 * Program card overflow actions as a full-screen bottom sheet (mobile-safe).
 */
export function ProgramActionsMenu({
  labels,
  editHref,
  showSetActive,
  disabled = false,
  onSetActive,
  onDelete,
}: ProgramActionsMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  function handleAction(action: () => void): void {
    setOpen(false);
    action();
  }

  const actions: ProgramAction[] = [
    { label: labels.edit, href: editHref },
    ...(showSetActive
      ? [
          {
            label: labels.setActive,
            onClick: () => {
              handleAction(onSetActive);
            },
          },
        ]
      : []),
    {
      label: labels.delete,
      destructive: true as const,
      onClick: () => {
        handleAction(onDelete);
      },
    },
  ];

  return (
    <>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={labels.menu}
        className="min-h-9 min-w-9 px-0"
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
          {actions.map((action, index) => {
            if (isLinkAction(action)) {
              return (
                <li key={action.label} className={cn(index > 0 && 'border-t border-gym-separator')}>
                  <Link
                    className="flex min-h-12 w-full items-center px-4 py-3 text-left text-base transition-colors active:bg-muted/50"
                    href={action.href}
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    {action.label}
                  </Link>
                </li>
              );
            }

            return (
              <li key={action.label} className={cn(index > 0 && 'border-t border-gym-separator')}>
                <button
                  className={cn(
                    'flex min-h-12 w-full items-center px-4 py-3 text-left text-base transition-colors active:bg-muted/50',
                    action.destructive && 'font-medium text-destructive',
                  )}
                  type="button"
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              </li>
            );
          })}
        </ul>
      </GymSheet>
    </>
  );
}
