// New users land on the onboarding flow; returning users go straight to the dashboard.
export const postLoginRoute = (user) =>
  user?.onboarding_completed ? '/dashboard' : '/onboarding';
