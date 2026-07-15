import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COOKIE_CONSENT_KEY = 'calmora_cookie_consent';

type ConsentChoice = 'accepted' | 'essential' | null;

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 flex justify-center"
        >
          <Card className="max-w-lg w-full p-4 bg-card/95 backdrop-blur-md border-border/50 shadow-lg">
            <div className="flex items-start gap-3">
              <Cookie className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Cookie Preferences</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    We use essential cookies for the app to function and optional analytics cookies to improve your experience. 
                    Learn more in our{' '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleAcceptAll} className="text-xs">
                    Accept All
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleEssentialOnly} className="text-xs">
                    Essential Only
                  </Button>
                </div>
              </div>
              <button
                onClick={handleEssentialOnly}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close cookie consent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
