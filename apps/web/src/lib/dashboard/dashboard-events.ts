export type DashboardInvalidationReason =
  | 'WORKOUT_SAVED'
  | 'WORKOUT_DELETED'
  | 'WORKOUT_EDITED'
  | 'SYNC_COMPLETE';

type DashboardInvalidationListener = (reason: DashboardInvalidationReason) => void;

const listeners = new Set<DashboardInvalidationListener>();

/**
 * Subscribe to dashboard cache invalidation events.
 *
 * @param listener - Callback invoked when dashboard data should refresh.
 */
export function subscribeDashboardInvalidation(
  listener: DashboardInvalidationListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Emit a dashboard invalidation event after local workout data changes.
 *
 * @param reason - Event that triggered invalidation.
 */
export function emitDashboardInvalidation(reason: DashboardInvalidationReason): void {
  for (const listener of listeners) {
    listener(reason);
  }
}
