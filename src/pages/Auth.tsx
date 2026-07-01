import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get('role');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'teacher') {
        navigate('/teacher');
      } else if (userRole === 'student') {
        navigate('/student');
      }
    }
  }, [user, userRole, loading, navigate]);

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
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-gradient p-4 border border-primary/20 shadow-lg animate-pulse flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div className="text-sm font-medium tracking-wider text-muted-foreground animate-pulse">Checking session...</div>
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background bg-gradient-to-br from-background via-card/30 to-primary/5">
      {/* Ambient gradient wash circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[130px] pointer-events-none dark:bg-primary/10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[130px] pointer-events-none dark:bg-secondary/10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 14 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-glass border-glass shadow-2xl rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-primary-gradient" />
          
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-primary-gradient p-4 rounded-2xl shadow-lg border border-primary/10 text-white flex items-center justify-center">
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
                className="w-full bg-primary-gradient hover:opacity-90 text-white font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-transform shimmer-hover h-11 rounded-xl mt-4" 
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
