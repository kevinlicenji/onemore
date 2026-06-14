export const ROLES = {
  ATHLETE: 'athlete',
  ADMIN: 'admin',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Build JWT role claims for a user.
 *
 * @param isAdmin - Whether the user has admin privileges.
 */
export function buildUserRoles(isAdmin: boolean): AppRole[] {
  return isAdmin ? [ROLES.ATHLETE, ROLES.ADMIN] : [ROLES.ATHLETE];
}

/**
 * Check whether a role list includes admin.
 *
 * @param roles - JWT role claims.
 */
export function hasAdminRole(roles: readonly string[] | undefined): boolean {
  return roles?.includes(ROLES.ADMIN) ?? false;
}
