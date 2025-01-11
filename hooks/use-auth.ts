import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsSignedIn(!!session);
        setUser(session?.user ?? null);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isSignedIn, user };
};
