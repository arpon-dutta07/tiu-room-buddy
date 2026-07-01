import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, UserCog, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const { user, userRole, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-gradient p-4 border border-primary/20 shadow-lg animate-pulse flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div className="text-sm font-medium tracking-wider text-muted-foreground animate-pulse">Loading system...</div>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 14
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background bg-gradient-to-br from-background via-card/30 to-primary/5">
      {/* Ambient gradient wash circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[130px] pointer-events-none dark:bg-primary/10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[130px] pointer-events-none dark:bg-secondary/10" />
      
      <motion.div 
        className="w-full max-w-4xl space-y-10 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center space-y-4">
          <motion.div 
            className="flex justify-center mb-6"
            variants={logoVariants}
          >
            <motion.div 
              className="bg-primary-gradient p-5 rounded-2xl shadow-xl border border-primary/20 text-white flex items-center justify-center"
              animate={{
                scale: [1, 1.04, 1],
                boxShadow: [
                  "0 10px 25px -5px rgba(193, 21, 47, 0.25)",
                  "0 15px 35px 5px rgba(193, 21, 47, 0.4)",
                  "0 10px 25px -5px rgba(193, 21, 47, 0.25)"
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Building2 className="h-12 w-12" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tight"
            variants={itemVariants}
          >
            SmartRoom <span className="text-gradient font-extrabold">Finder</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl font-medium text-muted-foreground tracking-wider uppercase"
            variants={itemVariants}
          >
            Techno India University
          </motion.p>
          
          <motion.p 
            className="text-base text-muted-foreground max-w-2xl mx-auto font-sans"
            variants={itemVariants}
          >
            Efficient room management system for faculty and students. Real-time availability tracking
            across all university floors.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-4">
          {/* Staff Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-glass border border-glass rounded-3xl p-8 shadow-xl shadow-glow-hover flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/10 text-primary">
                  <UserCog className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display">Staff & Faculty</h3>
                  <p className="text-sm text-muted-foreground">Manage rooms & routines</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground font-sans mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  View occupancy across all 7 floors (G, 1-7)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Manage schedules & upload routines (Admins)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Book or release free rooms (Teachers)
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-primary-gradient hover:opacity-90 text-white font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-transform shimmer-hover h-11 rounded-xl" 
                onClick={() => navigate('/auth?role=admin')}
              >
                Login as Admin
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-2 border-primary/30 text-primary hover:bg-primary-gradient hover:text-white hover:border-transparent active:scale-95 transition-all duration-300 font-semibold h-11 rounded-xl" 
                onClick={() => navigate('/auth?role=teacher')}
              >
                Login as Teacher
              </Button>
            </div>
          </motion.div>

          {/* Student Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-glass border border-glass rounded-3xl p-8 shadow-xl shadow-glow-hover flex flex-col justify-between cursor-pointer"
            onClick={() => navigate('/auth?role=student')}
          >
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-2xl border border-secondary/10 text-secondary">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display">Student Portal</h3>
                  <p className="text-sm text-muted-foreground">Check real-time availability</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground font-sans mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  View real-time room occupancies
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Check floor routines & schedules
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Instant updates on room releases
                </li>
              </ul>
            </div>
            
            <Button 
              variant="secondary" 
              className="w-full bg-primary-gradient hover:opacity-90 text-white font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-transform shimmer-hover h-11 rounded-xl"
            >
              Login as Student
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
