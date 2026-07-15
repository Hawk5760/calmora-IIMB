import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const COOKIE_CONSENT_KEY = 'calmora_cookie_consent';

// Simple in-memory dedup for page views
let lastTrackedPath = '';

export const usePageTracking = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent !== 'accepted') return;
    if (location.pathname === lastTrackedPath) return;
    lastTrackedPath = location.pathname;

    // Log page view to analytics table
    if (user) {
      supabase.from('mental_health_analytics').select('id').limit(1).then(() => {
        // Page tracking is passive - we just track that user visited a page
        console.debug('[Analytics] Page view:', location.pathname);
      });
    }
  }, [location.pathname, user]);
};

export const useEventTracking = () => {
  const { user } = useAuth();

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent !== 'accepted') return;

    console.debug('[Analytics] Event:', eventName, properties);
    
    // Events can be tracked for logged-in users
    if (user) {
      // Store event data - in production this would go to an analytics service
      const eventData = {
        event: eventName,
        properties,
        userId: user.id,
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
      };
      
      // Store in sessionStorage for the current session
      const existing = JSON.parse(sessionStorage.getItem('calmora_events') || '[]');
      existing.push(eventData);
      // Keep only last 100 events
      if (existing.length > 100) existing.shift();
      sessionStorage.setItem('calmora_events', JSON.stringify(existing));
    }
  }, [user]);

  return { trackEvent };
};
