import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MESSAGE_LENGTH = 5000;
const MAX_HISTORY_LENGTH = 50;
const MAX_MOOD_LENGTH = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user properly using getClaims
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims?.sub) {
      console.error('JWT verification failed');
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = data.claims.sub;
    console.log('Authenticated user:', userId);

    const { message, mood, history, personalization, inferredThemes } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ error: 'Message too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sanitizedMood = typeof mood === 'string' ? mood.slice(0, MAX_MOOD_LENGTH) : 'neutral';

    const sanitizedHistory = Array.isArray(history) 
      ? history.slice(0, MAX_HISTORY_LENGTH).map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: typeof msg.content === 'string' ? msg.content.slice(0, MAX_MESSAGE_LENGTH) : ''
        }))
      : [];

    // Sanitize personalization (all fields optional)
    const p = personalization && typeof personalization === 'object' ? personalization : {};
    const allowedGender = ['woman','man','non_binary','prefer_not_to_say'];
    const allowedAge = ['under_18','18_24','25_34','35_44','45_plus'];
    const allowedRole = ['student','working','parent','caregiver','other'];
    const personaGender = allowedGender.includes(p.gender) ? p.gender : null;
    const personaAge = allowedAge.includes(p.ageRange) ? p.ageRange : null;
    const personaRole = allowedRole.includes(p.role) ? p.role : null;
    const themes = Array.isArray(inferredThemes)
      ? inferredThemes.slice(0, 6).filter((t) => typeof t === 'string' && t.length < 40)
      : [];

    const isGreeting = /^(hi|hello|hey|namaste|kaise ho|what's up|sup)/i.test(message.trim());
    const isShort = message.split(' ').length <= 5;
    const needsEmpathy = /sad|anxious|stressed|angry|hurt|worried|scared|lonely|depressed|failed|exam|didn't pass/i.test(message);
    
    let responseGuidance = "";
    if (isGreeting) {
      responseGuidance = "Reply with 1-2 warm sentences. Be friendly, ask how they're feeling.";
    } else if (isShort && !needsEmpathy) {
      responseGuidance = "Keep reply brief: 2-3 sentences max. Match their energy.";
    } else if (needsEmpathy) {
      responseGuidance = "Be deeply empathetic first (2-3 sentences validating feelings), then offer 2 gentle activities. End with caring question. 60-80 words.";
    } else {
      responseGuidance = "Give thoughtful reply: 40-60 words. Include 1-2 helpful suggestions if relevant.";
    }

    // Build a soft personalization block — never assume, never diagnose,
    // never make it feel like the AI is profiling the user.
    let personaBlock = '';
    if (personaGender || personaAge || personaRole || themes.length) {
      const bits: string[] = [];
      if (personaGender && personaGender !== 'prefer_not_to_say') bits.push(`identifies as ${personaGender.replace('_',' ')}`);
      if (personaAge) bits.push(`age range ${personaAge.replace('_','-')}`);
      if (personaRole) bits.push(`life role ${personaRole}`);
      const themesLine = themes.length ? `\nRecent conversational themes: ${themes.join(', ')}.` : '';
      personaBlock = `\n\nPERSONALIZATION (use gently, never announce it, never stereotype):\nThe user ${bits.join(', ') || 'has not shared identity'}.${themesLine}\nAdapt tone, pronouns, and examples to feel resonant. Avoid gendered assumptions unless they align with the user's stated identity. Never say "as a woman/man you..." — instead, speak to the human in front of you.`;
    }

    const systemPrompt = `You are Calmora (also called Mindo), a warm emotional support companion. 

LANGUAGE RULE (CRITICAL): Detect the language and script the user wrote in and ALWAYS reply in the SAME language and script.
- Pure English input → reply in pure English.
- Hindi in Devanagari (हिंदी) → reply in Devanagari Hindi.
- Hinglish (Hindi words in Roman script) → reply in Hinglish.
- Other Indian languages (Bengali, Tamil, Telugu, etc.) → reply in that language/script.
NEVER force Hinglish if the user wrote in plain English or another language.

If the prompt includes a [User's recent mood history...] block, gently reference it when relevant (e.g. "I remember you felt anxious yesterday too…") to feel personal and continuous, but never make it feel like surveillance.
${personaBlock}

User's current mood: ${sanitizedMood}. ${responseGuidance} Never be preachy or give long lectures.`;


    const conversationHistory = sanitizedHistory;
    const conversationText = conversationHistory
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Calmora'}: ${m.content}`)
      .join('\n');

    let generatedText: string | null = null;
    let providerUsed: 'gemini' | 'lovable' | 'fallback' = 'fallback';

    const fullPrompt = `${systemPrompt}\n\nCONVERSATION SO FAR:\n${conversationText}\n\nUser: ${message}\n\nCalmora:`;

    if (geminiApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { maxOutputTokens: 400, temperature: 0.8 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
          if (generatedText) providerUsed = 'gemini';
        } else {
          console.error('AI API error:', response.status);
        }
      } catch (e) {
        console.error('AI fetch failed');
      }
    }

    if (!generatedText && lovableApiKey) {
      try {
        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lovableApiKey}` },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            temperature: 0.8,
            max_tokens: 400,
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: message },
            ]
          })
        });
        if (aiResp.ok) {
          const g = await aiResp.json();
          generatedText = g?.choices?.[0]?.message?.content ?? null;
          if (generatedText) providerUsed = 'lovable';
        } else {
          console.error('AI gateway error:', aiResp.status);
        }
      } catch (e) {
        console.error('Lovable AI fallback failed');
      }
    }

    if (!generatedText) {
      generatedText = "Main yahan hoon tumhare saath. 💙 Kya chal raha hai aaj?";
      providerUsed = 'fallback';
    }

    console.log('Response provider:', providerUsed);

    return new Response(JSON.stringify({ response: generatedText, mood: sanitizedMood }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function');
    return new Response(JSON.stringify({ 
      response: "Koi baat nahi, sometimes technology bhi thak jaati hai! Aap mujhe phir se bata sakte ho - main sun raha/rahi hoon. 🌸",
      fallback: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
