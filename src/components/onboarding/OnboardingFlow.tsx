import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Heart, Target, Bell, ArrowRight, ArrowLeft, X, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePersonalization, type GenderIdentity, type AgeRange, type LifeRole, type PersonalizationScope } from "@/hooks/usePersonalization";

type Goal = "stress" | "sleep" | "mood" | "focus" | "explore";

const GOALS: { id: Goal; label: string; emoji: string }[] = [
  { id: "stress", label: "Manage stress", emoji: "🌿" },
  { id: "sleep", label: "Sleep better", emoji: "🌙" },
  { id: "mood", label: "Track my mood", emoji: "💗" },
  { id: "focus", label: "Improve focus", emoji: "🎯" },
  { id: "explore", label: "Just exploring", emoji: "✨" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const SKIP_KEY = "calmora_onboarding_skipped";

export const OnboardingFlow = () => {
  const { user } = useAuth();
  const { save: savePersonalization } = usePersonalization();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [language, setLanguage] = useState("en");
  const [notify, setNotify] = useState(false);
  const [gender, setGender] = useState<GenderIdentity | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [role, setRole] = useState<LifeRole | null>(null);
  const [scope, setScope] = useState<PersonalizationScope>("local");

  useEffect(() => {
    if (!user) {
      setShow(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed, full_name, preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const profile = data as any;
      if (profile?.full_name) setName(profile.full_name);
      if (profile?.preferred_language) setLanguage(profile.preferred_language);
      const skippedThisSession = sessionStorage.getItem(SKIP_KEY) === "1";
      if (!profile?.onboarding_completed && !skippedThisSession) {
        setShow(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const skip = () => {
    sessionStorage.setItem(SKIP_KEY, "1");
    setShow(false);
    window.dispatchEvent(new Event("calmora:onboarding-skipped"));
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim() || null,
          primary_goal: goal,
          preferred_language: language,
          notification_opt_in: notify,
          onboarding_completed: true,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;

      // Save personalization based on chosen privacy scope
      await savePersonalization({
        gender: scope === "off" ? null : gender,
        ageRange: scope === "off" ? null : ageRange,
        role: scope === "off" ? null : role,
        scope,
        proactiveCheckins: true,
      });

      if (notify && "Notification" in window && Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {}
      }

      toast.success("Welcome to Calmora 🌿");
      setShow(false);
      window.dispatchEvent(new Event("calmora:onboarding-completed"));
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const TOTAL_STEPS = 5;
  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };
  const back = () => step > 0 && setStep(step - 1);

  const canAdvance =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && goal !== null) ||
    step === 2 || // personalization is optional
    step === 3 || // privacy always ok
    step === 4;

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl p-7 shadow-2xl"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 rounded-full h-8 w-8"
            onClick={skip}
            aria-label="Skip onboarding"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Progress */}
          <div className="flex gap-1.5 justify-center mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[260px]"
            >
              {step === 0 && (
                <div className="space-y-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Heart className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">Welcome to Calmora 🌿</h2>
                    <p className="text-sm text-muted-foreground">
                      Let's personalize your space. What should we call you?
                    </p>
                  </div>
                  <div className="text-left space-y-2">
                    <Label htmlFor="onb-name">Your name</Label>
                    <Input
                      id="onb-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aanya"
                      autoFocus
                      maxLength={60}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Target className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">What brings you here?</h2>
                    <p className="text-sm text-muted-foreground">
                      Pick one — we'll tailor your experience.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          goal === g.id
                            ? "border-primary bg-primary/10"
                            : "border-border/60 hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="font-medium text-sm">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Help Mindo understand you</h2>
                    <p className="text-xs text-muted-foreground">
                      All optional. Skip any question — Mindo will still be there.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">I identify as</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: "woman", label: "Woman" },
                        { id: "man", label: "Man" },
                        { id: "non_binary", label: "Non-binary" },
                        { id: "prefer_not_to_say", label: "Prefer not to say" },
                      ] as { id: GenderIdentity; label: string }[]).map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setGender(gender === g.id ? null : g.id)}
                          className={`p-2 rounded-lg border text-xs text-left transition-all ${
                            gender === g.id ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/50"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Age range</Label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {([
                        { id: "under_18", label: "<18" },
                        { id: "18_24", label: "18-24" },
                        { id: "25_34", label: "25-34" },
                        { id: "35_44", label: "35-44" },
                        { id: "45_plus", label: "45+" },
                      ] as { id: AgeRange; label: string }[]).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setAgeRange(ageRange === a.id ? null : a.id)}
                          className={`p-2 rounded-lg border text-[11px] transition-all ${
                            ageRange === a.id ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/50"
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Life role right now</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { id: "student", label: "Student" },
                        { id: "working", label: "Working" },
                        { id: "parent", label: "Parent" },
                        { id: "caregiver", label: "Caregiver" },
                        { id: "other", label: "Other" },
                      ] as { id: LifeRole; label: string }[]).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setRole(role === r.id ? null : r.id)}
                          className={`p-2 rounded-lg border text-[11px] transition-all ${
                            role === r.id ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/50"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Your privacy, your call</h2>
                    <p className="text-xs text-muted-foreground">
                      Where should we keep your personalization?
                    </p>
                  </div>
                  {([
                    { id: "local", title: "On this device only", desc: "Nothing leaves your phone. Recommended." },
                    { id: "cloud", title: "Sync to your account", desc: "So Mindo remembers you on any device." },
                    { id: "off", title: "Turn personalization off", desc: "Mindo replies neutrally, no identity used." },
                  ] as { id: PersonalizationScope; title: string; desc: string }[]).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setScope(opt.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        scope === opt.id ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/50"
                      }`}
                    >
                      <p className="text-sm font-medium">{opt.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Bell className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Last thing</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose your language and gentle reminders.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onb-lang">Preferred language</Label>
                    <select
                      id="onb-lang"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/60">
                    <div>
                      <p className="text-sm font-medium">Gentle reminders</p>
                      <p className="text-xs text-muted-foreground">
                        Soft nudges for journaling & streaks. No spam.
                      </p>
                    </div>
                    <Switch checked={notify} onCheckedChange={setNotify} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 gap-3">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={back} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={skip}>
                Skip
              </Button>
            )}
            <Button
              onClick={next}
              disabled={!canAdvance || saving}
              className="rounded-full gap-2 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving
                </>
              ) : step === 4 ? (
                <>Get Started <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
