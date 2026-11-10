const emit = (level, message, properties = {}) => {
  if (typeof window === 'undefined' || !window.posthog?.capture) return;

  try {
    window.posthog.capture('$log', {
      $level: level,
      $message: message,
      ...properties,
    });
  } catch {}
};

const posthogLogger = {
  info: (message, properties) => emit('info', message, properties),
  error: (message, properties) => emit('error', message, properties),
};

export default posthogLogger;
