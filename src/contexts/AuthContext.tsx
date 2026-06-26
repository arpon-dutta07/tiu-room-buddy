import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AppRole = 'admin' | 'student' | 'teacher';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AppRole | null>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<AppRole | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  // This ref prevents onAuthStateChange from overwriting a role
  // that was already explicitly set by signIn / signUp
  const skipNextAuthChange = useRef(false);
  const navigate = useNavigate();

  /**
   * Resolves a user's role:
   * 1. Query user_roles table (works when DB trigger is active or after self-heal)
   * 2. Fall back to user_metadata.role (set during signUp)
   * 3. Default to 'student'
   */
  const resolveRole = async (userId: string, userMetadata?: Record<string, any>): Promise<AppRole> => {
    // Step 1: Try the user_roles table
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        const roles = data.map((r: any) => r.role as string);
        if (roles.includes('admin')) return 'admin';
        if (roles.includes('teacher')) return 'teacher';
        if (roles.includes('student')) return 'student';
      }
    } catch (err) {
      console.warn('user_roles query failed, falling back to metadata', err);
    }

    // Step 2: Fall back to user_metadata.role
    const metaRole = userMetadata?.role as string | undefined;
    const roleFromMeta: AppRole =
      metaRole === 'admin' ? 'admin' :
      metaRole === 'teacher' ? 'teacher' :
      'student';

    // Step 3: Self-heal — write into user_roles for next time
    try {
      await supabase.from('user_roles').upsert(
        { user_id: userId, role: roleFromMeta },
        { onConflict: 'user_id,role' }
      );
    } catch (err) {
      console.warn('Could not upsert role:', err);
    }

    return roleFromMeta;
  };

  useEffect(() => {
    // onAuthStateChange: only run role fetch on INITIAL load or SIGN_OUT
    // During signIn/signUp the role is set directly — we skip this to avoid overwriting
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (skipNextAuthChange.current) {
            // Role already set by signIn/signUp — don't overwrite
            skipNextAuthChange.current = false;
            return;
          }
          // Initial session restore or external auth change
          setTimeout(() => {
            resolveRole(session.user.id, session.user.user_metadata).then((role) => {
              setUserRole(role);
              setLoading(false);
            });
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Load session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        resolveRole(session.user.id, session.user.user_metadata).then((role) => {
          setUserRole(role);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AppRole | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    let role: AppRole | null = null;
    if (data.user) {
      // Resolve role now — prevent onAuthStateChange from overwriting this
      skipNextAuthChange.current = true;
      role = await resolveRole(data.user.id, data.user.user_metadata);
      setUserRole(role);
      setLoading(false);
    }

    toast.success('Signed in successfully');
    return role;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: AppRole
  ): Promise<AppRole | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          role: role,          // stored in user_metadata.role
        },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    // Email confirmation OFF — session returned immediately
    if (data?.session && data.user) {
      // Prevent onAuthStateChange from overwriting the role we're about to set
      skipNextAuthChange.current = true;

      // Write role to user_roles table (in case DB trigger isn't set up)
      try {
        await supabase.from('user_roles').upsert(
          { user_id: data.user.id, role },
          { onConflict: 'user_id,role' }
        );
      } catch (err) {
        console.warn('Could not upsert role:', err);
      }

      setUser(data.user as any);
      setSession(data.session as any);
      setUserRole(role);      // <-- set the EXACT role the user chose
      setLoading(false);
      toast.success('Account created and signed in successfully!');
      return role;
    }

    // Email confirmation ON — user needs to verify email first
    toast.success('Account created! Please check your email to verify before signing in.', {
      duration: 8000,
    });
    return null;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      throw error;
    }

    setUser(null);
    setSession(null);
    setUserRole(null);
    navigate('/');
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider
      value={{ user, session, userRole, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
