// New users land on the onboarding flow; returning users go straight to the dashboard.
// Iter 135: if they were bounced off a specific page (e.g. /payment-success after a
// checkout with an expired session), send them back there instead.
export const postLoginRoute = (user, from) => {
  if (from && typeof from === 'string' && from.startsWith('/') && !from.startsWith('/login')) {
    return from;
  }
  return user?.onboarding_completed ? '/dashboard' : '/onboarding';
};
