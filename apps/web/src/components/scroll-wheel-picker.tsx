'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  clampWheelIndex,
  scrollTopForIndex,
  snapIndexFromScroll,
  wheelEdgePadding,
} from '@/lib/scroll-wheel-snap';
import { getWheelItemStyle } from '@/lib/wheel-picker-style';

export type ScrollWheelPickerSize = 'default' | 'compact' | 'modal' | 'workout';

interface WheelLayoutPreset {
  itemHeight: number;
  visibleHeight: number;
  gradientHeightClass: string;
}

const WHEEL_LAYOUT: Record<ScrollWheelPickerSize, WheelLayoutPreset> = {
  default: {
    itemHeight: 44,
    visibleHeight: 220,
    gradientHeightClass: 'h-20',
  },
  compact: {
    itemHeight: 30,
    visibleHeight: 118,
    gradientHeightClass: 'h-10',
  },
  modal: {
    itemHeight: 26,
    visibleHeight: 94,
    gradientHeightClass: 'h-8',
  },
  workout: {
    itemHeight: 28,
    visibleHeight: 100,
    gradientHeightClass: 'h-9',
  },
};

const SCROLL_END_MS = 160;

/** Default wheel row height — kept for scroll-snap tests and legacy callers. */
export const WHEEL_ITEM_HEIGHT = WHEEL_LAYOUT.default.itemHeight;

export interface ScrollWheelPickerOption<T extends string | number> {
  value: T;
  label: string;
}

interface ScrollWheelPickerProps<T extends string | number> {
  label: string;
  options: ScrollWheelPickerOption<T>[];
  value: T;
  disabled?: boolean;
  showLabel?: boolean;
  size?: ScrollWheelPickerSize;
  onChange: (value: T) => void;
}

/**
 * iOS-style inertial scroll wheel with perspective scaling on off-center items.
 */
export function ScrollWheelPicker<T extends string | number>({
  label,
  options,
  value,
  disabled = false,
  showLabel = true,
  size = 'default',
  onChange,
}: ScrollWheelPickerProps<T>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const isSnappingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);
  const layout = WHEEL_LAYOUT[size];
  const itemHeight = layout.itemHeight;
  const edgePadding = wheelEdgePadding(layout.visibleHeight, itemHeight);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const padding = edgePadding;
  const centerIndexFloat = scrollTop / itemHeight;

  const snapToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth'): void => {
      const node = listRef.current;
      if (!node) {
        return;
      }
      const clamped = clampWheelIndex(index, options.length);
      isSnappingRef.current = true;
      node.scrollTo({
        top: scrollTopForIndex(clamped, itemHeight),
        behavior,
      });
      const next = options[clamped];
      if (next && next.value !== value) {
        onChange(next.value);
      }
      window.setTimeout(
        () => {
          isSnappingRef.current = false;
        },
        behavior === 'smooth' ? 320 : 0,
      );
    },
    [itemHeight, onChange, options, value],
  );

  useEffect(() => {
    const node = listRef.current;
    if (!node || reducedMotion) {
      return;
    }
    const top = scrollTopForIndex(selectedIndex, itemHeight);
    if (Math.abs(node.scrollTop - top) > 1) {
      isSnappingRef.current = true;
      node.scrollTop = top;
      setScrollTop(top);
      window.setTimeout(() => {
        isSnappingRef.current = false;
      }, 0);
    }
  }, [itemHeight, selectedIndex, reducedMotion]);

  function scheduleScrollTopUpdate(nextTop: number): void {
    if (rafRef.current !== null) {
      return;
    }
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      setScrollTop(nextTop);
    });
  }

  function handleScroll(): void {
    const node = listRef.current;
    if (!node || disabled || isSnappingRef.current) {
      return;
    }

    scheduleScrollTopUpdate(node.scrollTop);

    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(() => {
      isDraggingRef.current = false;
      const index = snapIndexFromScroll(node.scrollTop, itemHeight);
      snapToIndex(index, reducedMotion ? 'auto' : 'smooth');
    }, SCROLL_END_MS);
  }

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      {showLabel ? (
        <span className="w-full text-center text-xs font-medium text-muted-foreground">
          {label}
        </span>
      ) : null}
      <div
        className="relative isolate overflow-hidden rounded-xl border bg-muted/15"
        style={{ height: layout.visibleHeight }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-1/2 z-10 -translate-y-1/2 rounded-lg border border-primary/30 bg-primary/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          style={{ height: itemHeight }}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 ${layout.gradientHeightClass} bg-gradient-to-b from-background via-background/80 to-transparent`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 ${layout.gradientHeightClass} bg-gradient-to-t from-background via-background/80 to-transparent`}
        />

        <div
          ref={listRef}
          aria-label={label}
          className="h-full overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:y_mandatory] [&::-webkit-scrollbar]:hidden"
          data-wheel-picker
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingTop: padding,
            paddingBottom: padding,
          }}
          onPointerDown={() => {
            isDraggingRef.current = true;
          }}
          onScroll={handleScroll}
        >
          {options.map((option, index) => {
            const distance = index - centerIndexFloat;
            const style = getWheelItemStyle(distance, size);
            const isSelected = option.value === value;
            const useScaleTransform = size !== 'workout' && size !== 'modal';
            return (
              <button
                key={String(option.value)}
                className="flex w-full shrink-0 items-center justify-center overflow-hidden tabular-nums leading-none disabled:opacity-50 [scroll-snap-align:center]"
                disabled={disabled}
                style={{
                  height: itemHeight,
                  opacity: style.opacity,
                  transform: useScaleTransform ? `scale(${String(style.scale)})` : undefined,
                  transformOrigin: 'center center',
                  fontSize: `${String(style.fontSizeRem)}rem`,
                  fontWeight: style.fontWeight,
                  color: isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                }}
                type="button"
                onClick={() => {
                  snapToIndex(index);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
