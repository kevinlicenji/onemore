import { DEFAULT_USER_SETTINGS, userSettingsSchema, type UserSettings } from '@onemore/shared';

/**
 * Parse user.settings JSONB with safe defaults.
 *
 * @param raw - Stored JSON value from the database.
 */
export function parseUserSettings(raw: unknown): UserSettings {
  const parsed = userSettingsSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }
  return DEFAULT_USER_SETTINGS;
}

/**
 * Merge partial settings update into existing settings.
 *
 * @param current - Current user settings.
 * @param patch - Partial update from the client.
 */
export function mergeUserSettings(
  current: UserSettings,
  patch: {
    units?: UserSettings['units'];
    notifications?: Partial<UserSettings['notifications']>;
  },
): UserSettings {
  return userSettingsSchema.parse({
    units: patch.units ?? current.units,
    notifications: {
      ...current.notifications,
      ...patch.notifications,
    },
  });
}
