import { usePageTracking } from '@/hooks/useAnalytics';

export const AnalyticsProvider = () => {
  usePageTracking();
  return null;
};
