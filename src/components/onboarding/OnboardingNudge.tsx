import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "calmora_onboarding_nudge_dismissed";

export const OnboardingNudge = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  const check = async () => {
    if (!user) return setShow(false);
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return setShow(false);
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();
    setShow(!(data as any)?.onboarding_completed);
  };

  useEffect(() => {
    check();
    const onDone = () => setShow(false);
    const onSkip = () => check();
    window.addEventListener("calmora:onboarding-completed", onDone);
    window.addEventListener("calmora:onboarding-skipped", onSkip);
    return () => {
      window.removeEventListener("calmora:onboarding-completed", onDone);
      window.removeEventListener("calmora:onboarding-skipped", onSkip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  const start = () => {
    sessionStorage.removeItem("calmora_onboarding_skipped");
    window.location.reload();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="fixed left-1/2 -translate-x-1/2 top-[76px] md:top-[84px] z-40 w-[calc(100%-1rem)] max-w-xl px-2"
      >
        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Finish setting up your space</p>
            <p className="text-xs text-muted-foreground">
              Takes 30 seconds. Personalize Calmora to fit your goals.
            </p>
          </div>
          <Button size="sm" onClick={start} className="rounded-full shrink-0">
            Continue
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={dismiss}
            className="h-8 w-8 rounded-full shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
