## Goal
Make Calmora adapt tone, themes, coping suggestions, and resources to the user's identity and life context — via a mix of an optional stored profile field, inferred cues from conversation, and a clear privacy choice.

## 1. Data model
Add optional fields to `profiles`:
- `gender_identity` — `woman | man | non_binary | prefer_not_to_say | null`
- `personalization_scope` — `cloud | local | off` (asked at the end of onboarding step)
- `life_context` — jsonb (age_range, role e.g. student/working/parent, cultural notes) — all optional

RLS: user reads/updates own row only (already the pattern).

## 2. Capture points
- **Onboarding**: new optional step "Help Calmora understand you better" — gender + age range + role. Skippable. Ends with the privacy choice: *"Save this to your account (syncs across devices) or keep it on this device only?"*
- **Profile/Settings → Personalization**: same fields, editable anytime, plus a "Reset personalization" button.
- **Conversation inference**: lightweight client-side signal builder that watches recent messages for cues (cycle, pregnancy, fatherhood, workplace bias, caregiving, masculinity pressure, etc.) and passes them as a transient `inferredContext` to the AI — never stored.

## 3. AI personalization (all three depths together)
Extend `gemini-chat` + `ai-support-chat` edge functions:
- Accept `personalization` payload: `{ gender, ageRange, role, inferredThemes[], scope }`.
- Inject into system prompt in three layers:
  1. **Tone tuning**: warmth, examples, pronouns mirror identity.
  2. **Context-aware themes**: awareness of gender-specific stressors (hormonal shifts, postpartum, workplace bias, emotional suppression, caregiver burnout, body image, safety anxiety) — surfaced only when relevant.
  3. **Tailored coping + resources**: suggestions and helpline routing adapt (e.g., iCall women's line, AASRA, Vandrevala; men's mental health communities; LGBTQ+ affirming resources).
- Never assume — always phrase as gentle offers ("Would it help to talk about…?").

## 4. Proactive check-ins (gentle, both modes)
- If gender known + relevant cue detected → offer once per session: *"Some folks find their mood shifts with their cycle — want to note that today?"* / *"A lot of guys bottle this up. Want to unpack it here?"*
- User can mute proactive prompts in Settings.

## 5. Privacy handling
- End of onboarding personalization step asks: **Save to account** (Supabase, RLS) or **This device only** (localStorage via `useUserStorage`) or **Don't personalize**.
- Choice stored in `personalization_scope`; a small badge in Settings shows current mode with a one-tap switch + delete.
- Clear copy: "Calmora uses this only to make responses feel more like you. Never shared, never sold."

## 6. Files to touch
- Migration: `profiles` add 3 columns
- `src/components/onboarding/OnboardingFlow.tsx` — add Personalization step + privacy choice
- `src/pages/SettingsPage.tsx` (or ProfilePage) — Personalization panel
- `src/hooks/usePersonalization.tsx` (new) — reads from Supabase or local per scope, exposes context
- `src/utils/inferContext.ts` (new) — keyword-based theme inference
- `src/components/MoodChatPanel.tsx` + `src/pages/AIBuddyPage.tsx` — pass personalization to edge functions
- `supabase/functions/gemini-chat/index.ts` + `ai-support-chat/index.ts` — accept & weave into prompt
- Crisis resources map updated for identity-aware routing

## Out of scope (for now)
- Medical cycle tracking UI
- Gendered content gates
- Any auto-detection of gender from name/voice

Ready to build on approval.