/**
 * Pure merge helpers for offline sync conflict resolution.
 */

/**
 * Whether an incoming set log should replace the server row (last-write-wins).
 *
 * @param serverTimestamp - Existing server client_timestamp.
 * @param incomingTimestamp - Incoming client_timestamp.
 * @returns True when incoming is strictly newer, or equal (server wins ties).
 */
export function shouldAcceptSetLogUpdate(serverTimestamp: Date, incomingTimestamp: Date): boolean {
  return incomingTimestamp.getTime() >= serverTimestamp.getTime();
}

/**
 * Whether an incoming workout session patch should be applied.
 *
 * @param serverUpdatedAt - Existing client_updated_at on server.
 * @param incomingUpdatedAt - Incoming client_updated_at.
 */
export function shouldAcceptSessionUpdate(serverUpdatedAt: Date, incomingUpdatedAt: Date): boolean {
  return incomingUpdatedAt.getTime() >= serverUpdatedAt.getTime();
}
