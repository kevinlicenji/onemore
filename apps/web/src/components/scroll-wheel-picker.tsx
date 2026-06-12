'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  clampWheelIndex,
  scrollTopForIndex,
  snapIndexFromScroll,
} from '@/lib/scroll-wheel-snap';
import { getWheelItemStyle } from '@/lib/wheel-picker-style';

export const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_HEIGHT = 220;
const WHEEL_PADDING_ROWS = 2;
const SCROLL_END_MS = 160;

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
  onChange,
}: ScrollWheelPickerProps<T>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const isSnappingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const padding = WHEEL_PADDING_ROWS * WHEEL_ITEM_HEIGHT;
  const centerIndexFloat = scrollTop / WHEEL_ITEM_HEIGHT;

  const snapToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth'): void => {
      const node = listRef.current;
      if (!node) {
        return;
      }
      const clamped = clampWheelIndex(index, options.length);
      isSnappingRef.current = true;
      node.scrollTo({
        top: scrollTopForIndex(clamped, WHEEL_ITEM_HEIGHT),
        behavior,
      });
      const next = options[clamped];
      if (next && next.value !== value) {
        onChange(next.value);
      }
      window.setTimeout(() => {
        isSnappingRef.current = false;
      }, behavior === 'smooth' ? 320 : 0);
    },
    [onChange, options, value],
  );

  useEffect(() => {
    const node = listRef.current;
    if (!node || reducedMotion) {
      return;
    }
    const top = scrollTopForIndex(selectedIndex, WHEEL_ITEM_HEIGHT);
    if (Math.abs(node.scrollTop - top) > 1) {
      isSnappingRef.current = true;
      node.scrollTop = top;
      setScrollTop(top);
      window.setTimeout(() => {
        isSnappingRef.current = false;
      }, 0);
    }
  }, [selectedIndex, reducedMotion]);

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
      const index = snapIndexFromScroll(node.scrollTop, WHEEL_ITEM_HEIGHT);
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
    <div className="flex flex-col gap-2" data-no-swipe>
      {showLabel ? <span className="text-sm font-medium">{label}</span> : null}
      <div
        className="relative overflow-hidden rounded-xl border bg-muted/15"
        style={{ height: WHEEL_VISIBLE_HEIGHT, perspective: '1000px' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-1/2 z-10 h-11 -translate-y-1/2 rounded-lg border border-primary/30 bg-primary/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-background via-background/80 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-background via-background/80 to-transparent"
        />

        <div
          ref={listRef}
          aria-label={label}
          className="h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:y_mandatory] [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingTop: padding,
            paddingBottom: padding,
            transformStyle: 'preserve-3d',
          }}
          onPointerDown={() => {
            isDraggingRef.current = true;
          }}
          onScroll={handleScroll}
        >
          {options.map((option, index) => {
            const distance = index - centerIndexFloat;
            const style = getWheelItemStyle(distance);
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                className="flex w-full shrink-0 items-center justify-center tabular-nums disabled:opacity-50 [scroll-snap-align:center]"
                disabled={disabled}
                style={{
                  height: WHEEL_ITEM_HEIGHT,
                  opacity: style.opacity,
                  transform: `scale(${style.scale}) rotateX(${distance * -14}deg) translateZ(${Math.max(0, 24 - Math.abs(distance) * 12)}px)`,
                  fontSize: `${style.fontSizeRem}rem`,
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
