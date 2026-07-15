import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type GenderIdentity = "woman" | "man" | "non_binary" | "prefer_not_to_say";
export type PersonalizationScope = "cloud" | "local" | "off";
export type AgeRange = "under_18" | "18_24" | "25_34" | "35_44" | "45_plus";
export type LifeRole = "student" | "working" | "parent" | "caregiver" | "other";

export interface Personalization {
  gender: GenderIdentity | null;
  ageRange: AgeRange | null;
  role: LifeRole | null;
  scope: PersonalizationScope;
  proactiveCheckins: boolean;
}

const LOCAL_KEY = "calmora_personalization_v1";
const PROACTIVE_KEY = "calmora_proactive_checkins";

const DEFAULT: Personalization = {
  gender: null,
  ageRange: null,
  role: null,
  scope: "off",
  proactiveCheckins: true,
};

const readLocal = (): Partial<Personalization> => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeLocal = (p: Partial<Personalization>) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  } catch {}
};

export const usePersonalization = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Personalization>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    // Proactive check-ins pref lives in localStorage regardless of scope
    const proactive = localStorage.getItem(PROACTIVE_KEY);
    const proactiveCheckins = proactive == null ? true : proactive === "1";

    if (!user) {
      const local = readLocal();
      setData({ ...DEFAULT, ...local, proactiveCheckins });
      setLoaded(true);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("gender_identity, personalization_scope, life_context")
        .eq("user_id", user.id)
        .maybeSingle();

      const scope = ((profile as any)?.personalization_scope as PersonalizationScope) || "off";
      if (scope === "cloud") {
        const life = ((profile as any)?.life_context as Record<string, any>) || {};
        setData({
          gender: ((profile as any)?.gender_identity as GenderIdentity) ?? null,
          ageRange: (life.ageRange as AgeRange) ?? null,
          role: (life.role as LifeRole) ?? null,
          scope: "cloud",
          proactiveCheckins,
        });
      } else if (scope === "local") {
        const local = readLocal();
        setData({ ...DEFAULT, ...local, scope: "local", proactiveCheckins });
      } else {
        setData({ ...DEFAULT, scope: "off", proactiveCheckins });
      }
    } catch {
      const local = readLocal();
      setData({ ...DEFAULT, ...local, proactiveCheckins });
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (next: Personalization) => {
      setData(next);
      localStorage.setItem(PROACTIVE_KEY, next.proactiveCheckins ? "1" : "0");

      if (next.scope === "off") {
        writeLocal({});
        if (user) {
          await supabase
            .from("profiles")
            .update({
              gender_identity: null,
              life_context: {},
              personalization_scope: "off",
            } as any)
            .eq("user_id", user.id);
        }
        return;
      }

      if (next.scope === "local" || !user) {
        writeLocal({
          gender: next.gender,
          ageRange: next.ageRange,
          role: next.role,
          scope: "local",
        });
        if (user) {
          await supabase
            .from("profiles")
            .update({
              gender_identity: null,
              life_context: {},
              personalization_scope: "local",
            } as any)
            .eq("user_id", user.id);
        }
        return;
      }

      // cloud
      writeLocal({});
      await supabase
        .from("profiles")
        .update({
          gender_identity: next.gender,
          life_context: { ageRange: next.ageRange, role: next.role },
          personalization_scope: "cloud",
        } as any)
        .eq("user_id", user.id);
    },
    [user]
  );

  const reset = useCallback(async () => {
    await save({ ...DEFAULT, proactiveCheckins: true });
  }, [save]);

  return { data, loaded, save, reset, reload: load };
};
