import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get('role');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Block access to admin auth page for non-admin users
  useEffect(() => {
    if (!loading && queryRole === 'admin') {
      // If user is logged in but not admin, redirect to home
      if (user && userRole && userRole !== 'admin') {
        navigate('/', { replace: true });
        return;
      }
    }
  }, [loading, user, userRole, queryRole, navigate]);

  useEffect(() => {
    if (!loading && user && userRole) {
      const targetRole = queryRole === 'admin' ? 'admin' : queryRole === 'teacher' ? 'teacher' : 'student';
      
      if (userRole === targetRole) {
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'teacher') {
          navigate('/teacher');
        } else if (userRole === 'student') {
          navigate('/student');
        }
      } else {
        // Notify the user of the mismatch and sign them out so they can log in to the desired role
        toast.error(`You need to sign in as a ${targetRole === 'teacher' ? 'teacher' : targetRole === 'admin' ? 'admin' : 'student'}.`);
        signOut().then(() => {
          navigate(`/auth?role=${targetRole}`);
        });
      }
    }
  }, [user, userRole, loading, navigate, queryRole, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let resolvedRole: 'admin' | 'student' | 'teacher' | null = null;
      if (isLogin) {
        resolvedRole = await signIn(email, password);
      } else {
        const roleParam = (queryRole === 'admin' ? 'admin' : queryRole === 'teacher' ? 'teacher' : 'student') as 'admin' | 'student' | 'teacher';
        resolvedRole = await signUp(email, password, fullName, roleParam);
      }
      // Navigate immediately based on returned role
      if (resolvedRole === 'admin') {
        navigate('/admin');
      } else if (resolvedRole === 'teacher') {
        navigate('/teacher');
      } else if (resolvedRole === 'student') {
        navigate('/student');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary p-4 border border-primary/20 shadow-lg animate-pulse flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div className="text-sm font-medium tracking-wider text-muted-foreground animate-pulse font-display">Checking session...</div>
        </div>
      </div>
    );
  }

  // Format the title depending on selected role context
  const getRoleTitle = () => {
    if (queryRole === 'admin') return 'Admin Portal';
    if (queryRole === 'teacher') return 'Teacher Portal';
    return 'Student Portal';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* 3D Floating Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-1/4 -left-12 w-80 h-80 rounded-full bg-gradient-to-tr from-primary/10 to-rose-500/10 blur-3xl opacity-50 dark:opacity-40"
          animate={{
            y: [0, -35, 0],
            x: [0, 25, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-12 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 to-rose-600/5 blur-3xl opacity-45 dark:opacity-30"
          animate={{
            y: [0, 45, 0],
            x: [0, -30, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="border border-glass bg-background/50 hover:bg-glass/80 text-foreground rounded-xl h-10 px-4 active:scale-95 transition-transform"
        >
          ← Back to Home
        </Button>
        <ThemeToggle />
      </div>

      {/* University Campus Ambient Background */}
      <div 
        className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-15 dark:opacity-25 z-0 pointer-events-none filter grayscale contrast-125 brightness-[0.95]"
        style={{ backgroundImage: `url('/campus.jpg')` }}
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 14 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-glass border-glass shadow-2xl rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-primary" />
          
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-primary/10 p-4 rounded-2xl border border-primary/10 text-primary flex items-center justify-center">
                <Building2 className="h-7 w-7" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold font-display tracking-tight text-foreground">
              {getRoleTitle()}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin ? 'Sign in to access room management' : 'Create an account to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="bg-background/50 border-muted focus-visible:ring-primary focus-visible:border-transparent rounded-xl h-11"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-muted focus-visible:ring-primary focus-visible:border-transparent rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50 border-muted pr-10 focus-visible:ring-primary focus-visible:border-transparent rounded-xl h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-lg shadow-primary/10 active:scale-95 transition-transform h-11 rounded-xl mt-4" 
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-semibold text-primary hover:underline hover:opacity-90 transition-opacity"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
