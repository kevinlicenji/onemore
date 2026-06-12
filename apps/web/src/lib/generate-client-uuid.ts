/**
 * Generates a RFC 4122 version-4 UUID on the client.
 *
 * `crypto.randomUUID()` is only available in secure contexts (HTTPS or localhost).
 * When testing from a phone over LAN HTTP (e.g. http://192.168.x.x:3000), this
 * helper falls back to `getRandomValues` or a Math.random-based v4 UUID.
 *
 * @returns A new UUID string.
 *
 * @example
 * const sessionId = generateClientUuid();
 */
export function generateClientUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return formatUuidV4(crypto.getRandomValues(new Uint8Array(16)));
  }

  const bytes = new Uint8Array(16);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return formatUuidV4(bytes);
}

function formatUuidV4(bytes: Uint8Array): string {
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
