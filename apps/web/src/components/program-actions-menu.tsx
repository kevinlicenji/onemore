'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

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

/**
 * Overflow menu for program card actions on mobile and desktop.
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

  function closeAndRun(action: () => void): void {
    setOpen(false);
    action();
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={labels.menu}
        className="min-h-9 min-w-9 px-0"
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
          className="absolute right-0 z-20 mt-1 min-w-44 overflow-hidden rounded-lg border bg-background shadow-lg"
          role="menu"
        >
          <Link
            className="block w-full px-4 py-3 text-left text-sm hover:bg-muted/60"
            href={editHref}
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
          >
            {labels.edit}
          </Link>
          {showSetActive && (
            <button
              className="block w-full px-4 py-3 text-left text-sm hover:bg-muted/60"
              role="menuitem"
              type="button"
              onClick={() => {
                closeAndRun(onSetActive);
              }}
            >
              {labels.setActive}
            </button>
          )}
          <button
            className="block w-full px-4 py-3 text-left text-sm text-destructive hover:bg-muted/60"
            role="menuitem"
            type="button"
            onClick={() => {
              closeAndRun(onDelete);
            }}
          >
            {labels.delete}
          </button>
        </div>
      )}
    </div>
  );
}
