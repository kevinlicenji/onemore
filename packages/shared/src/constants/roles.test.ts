import { describe, expect, it } from 'vitest';

import { buildUserRoles, hasAdminRole, ROLES } from './roles.js';

describe('roles', () => {
  it('builds athlete-only roles by default', () => {
    expect(buildUserRoles(false)).toEqual([ROLES.ATHLETE]);
  });

  it('adds admin role when flagged', () => {
    expect(buildUserRoles(true)).toEqual([ROLES.ATHLETE, ROLES.ADMIN]);
  });

  it('detects admin in role list', () => {
    expect(hasAdminRole([ROLES.ATHLETE, ROLES.ADMIN])).toBe(true);
    expect(hasAdminRole([ROLES.ATHLETE])).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
  });
});
