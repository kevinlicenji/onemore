export interface ExerciseRowBounds {
  index: number;
  top: number;
  bottom: number;
  height: number;
}

/**
 * Collects vertical bounds for each exercise row inside a list container.
 *
 * @param listElement - The `<ul>` wrapping exercise rows.
 */
export function collectExerciseRowBounds(listElement: HTMLElement | null): ExerciseRowBounds[] {
  if (!listElement) {
    return [];
  }

  const listRect = listElement.getBoundingClientRect();
  const rows = listElement.querySelectorAll('[data-exercise-row-index]');

  return Array.from(rows)
    .map((row) => {
      const raw = row.getAttribute('data-exercise-row-index');
      const index = raw !== null ? Number(raw) : Number.NaN;
      if (Number.isNaN(index)) {
        return null;
      }
      const rect = row.getBoundingClientRect();
      return {
        index,
        top: rect.top - listRect.top,
        bottom: rect.bottom - listRect.top,
        height: rect.height,
      };
    })
    .filter((bounds): bounds is ExerciseRowBounds => bounds !== null)
    .sort((left, right) => left.index - right.index);
}

/**
 * Resolves the drop index from a pointer Y coordinate against row midpoints.
 *
 * @param bounds - Row bounds relative to the list container.
 * @param pointerY - Pointer Y relative to the list container.
 * @param itemCount - Total exercise count.
 */
export function findDropIndexFromPointerY(
  bounds: ExerciseRowBounds[],
  pointerY: number,
  itemCount: number,
): number {
  if (itemCount <= 0) {
    return 0;
  }
  if (bounds.length === 0) {
    return Math.max(0, itemCount - 1);
  }

  for (const row of bounds) {
    const midpoint = row.top + row.height / 2;
    if (pointerY < midpoint) {
      return row.index;
    }
  }

  return itemCount - 1;
}
