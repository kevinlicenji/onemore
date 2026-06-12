'use client';

import { cn } from '@onemore/ui';
import { motion } from 'motion/react';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { calculateSheetDragOffset, shouldDismissSheet } from '@/lib/sheet-swipe-dismiss';

interface GymSheetProps {
  open: boolean;
  title?: string;
  ariaLabel: string;
  children: ReactNode;
  tall?: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet with spring entrance, drag handle, swipe-to-dismiss, and safe-area padding.
 */
export function GymSheet({
  open,
  title,
  ariaLabel,
  children,
  tall = false,
  onClose,
}: GymSheetProps): ReactElement | null {
  const reducedMotion = useReducedMotion();
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setViewportHeight(null);
      setDragOffset(0);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    const viewport = window.visualViewport;
    function syncViewportHeight(): void {
      setViewportHeight(viewport?.height ?? null);
    }

    if (viewport) {
      syncViewportHeight();
      viewport.addEventListener('resize', syncViewportHeight);
      viewport.addEventListener('scroll', syncViewportHeight);
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (viewport) {
        viewport.removeEventListener('resize', syncViewportHeight);
        viewport.removeEventListener('scroll', syncViewportHeight);
      }
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const sheetMotion = reducedMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 48 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 420, damping: 36 },
      };

  const overlayMotion = reducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };

  const maxHeight =
    viewportHeight !== null
      ? `${viewportHeight}px`
      : tall
        ? 'min(92dvh, 100%)'
        : 'min(88dvh, 100%)';

  function handleDragStart(clientY: number): void {
    if (reducedMotion) {
      return;
    }
    dragStartYRef.current = clientY;
    draggingRef.current = true;
  }

  function handleDragMove(clientY: number): void {
    if (!draggingRef.current) {
      return;
    }
    const delta = clientY - dragStartYRef.current;
    setDragOffset(calculateSheetDragOffset(delta));
  }

  function handleDragEnd(): void {
    if (!draggingRef.current) {
      return;
    }
    if (shouldDismissSheet(dragOffset)) {
      onClose();
    }
    setDragOffset(0);
    draggingRef.current = false;
    dragStartYRef.current = 0;
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <motion.button
        aria-label={ariaLabel}
        className="absolute inset-0 bg-black/45"
        type="button"
        {...overlayMotion}
        onClick={onClose}
      />
      <motion.div
        className={cn(
          'relative z-10 flex flex-col overflow-hidden rounded-t-3xl border-t border-gym-separator bg-gym-surface-elevated shadow-[0_-12px_40px_rgba(0,0,0,0.12)]',
          tall && 'min-h-0',
        )}
        role="dialog"
        aria-label={ariaLabel}
        aria-modal="true"
        style={{
          maxHeight,
          height: tall ? maxHeight : undefined,
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        }}
        {...sheetMotion}
      >
        <div
          className="flex shrink-0 touch-none justify-center pt-3 pb-1"
          onPointerCancel={handleDragEnd}
          onPointerDown={(event) => {
            handleDragStart(event.clientY);
          }}
          onPointerMove={(event) => {
            if (draggingRef.current) {
              handleDragMove(event.clientY);
            }
          }}
          onPointerUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          onTouchMove={(event) => {
            const touch = event.touches[0];
            if (touch) {
              handleDragMove(touch.clientY);
            }
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (touch) {
              handleDragStart(touch.clientY);
            }
          }}
        >
          <span aria-hidden className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        {title ? (
          <h2 className="shrink-0 px-5 pb-2 pt-1 text-base font-semibold">{title}</h2>
        ) : null}
        <div
          className={cn(
            'min-h-0 overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]',
            tall && 'flex flex-1 flex-col',
          )}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
