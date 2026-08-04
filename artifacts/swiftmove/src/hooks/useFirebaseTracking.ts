// Stub — Firebase tracking removed for Replit compatibility
export function useFirebaseTracking(_userId?: string) {
  return {
    trackEvent: (_name: string, _data?: Record<string, unknown>) => {},
    saveBookingStep: (_step: string, _data?: Record<string, unknown>) => Promise.resolve(),
  };
}
