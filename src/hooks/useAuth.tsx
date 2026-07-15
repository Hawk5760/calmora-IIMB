import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkAuthRateLimit } from '@/hooks/useAuthRateLimit';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInAnonymously: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome to Calmora",
            description: "You've successfully signed in to your soul garden.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Goodbye",
            description: "You've been safely signed out.",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const rateCheck = checkAuthRateLimit('signUp');
    if (!rateCheck.allowed) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: `Please wait ${Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)}s before trying again.`,
      });
      return { error: { message: 'Rate limited' } };
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      toast({ variant: "destructive", title: "Invalid email", description: "Please enter a valid email address." });
      return { error: { message: 'Invalid email' } };
    }
    if (password.length < 8 || password.length > 128) {
      toast({ variant: "destructive", title: "Invalid password", description: "Password must be 8-128 characters." });
      return { error: { message: 'Invalid password length' } };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName?.trim().slice(0, 100),
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const rateCheck = checkAuthRateLimit('signIn');
    if (!rateCheck.allowed) {
      toast({
        variant: "destructive",
        title: "Too many login attempts",
        description: `Account temporarily locked. Try again in ${Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)}s.`,
      });
      return { error: { message: 'Rate limited' } };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: error.message,
      });
    }

    return { error };
  };

  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      toast({
        variant: "destructive",
        title: "Anonymous sign in failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Welcome to Calmora",
        description: "You're browsing anonymously. Your identity is protected.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    }
  };

  const resetPassword = async (email: string) => {
    const rateCheck = checkAuthRateLimit('resetPassword');
    if (!rateCheck.allowed) {
      toast({
        variant: "destructive",
        title: "Too many reset attempts",
        description: `Please wait ${Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)}s before trying again.`,
      });
      return { error: { message: 'Rate limited' } };
    }

    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    }

    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};