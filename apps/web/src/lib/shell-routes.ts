/**
 * Routes where app chrome (sidebar / bottom nav) is hidden.
 */
export function shouldHideShell(route: string): boolean {
  if (route === '') {
    return true;
  }
  if (route === 'login' || route === 'register' || route === 'forgot-password') {
    return true;
  }
  if (route.startsWith('onboarding') || route === 'offline') {
    return true;
  }
  if (route.startsWith('workouts/') && route !== 'workouts/start') {
    return true;
  }
  return false;
}
