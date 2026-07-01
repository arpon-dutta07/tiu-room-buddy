import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Building2, 
  UserCog, 
  GraduationCap, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  LayoutGrid, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary p-4 border border-primary/20 shadow-lg animate-pulse flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div className="text-sm font-medium tracking-wider text-muted-foreground animate-pulse font-display">Loading system...</div>
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
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
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
    <div className="min-h-screen flex flex-col relative bg-background font-sans overflow-x-hidden">
      {/* Background Campus Illustration Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-[0.06] dark:opacity-[0.12] z-0 pointer-events-none filter grayscale contrast-125 brightness-[0.95]"
        style={{ backgroundImage: `url('/campus.jpg')` }}
      />

      {/* Floating Header / Navbar */}
      <header className="sticky top-0 z-50 w-full p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3.5 bg-glass/85 border border-glass backdrop-blur-md rounded-2xl shadow-lg">
          <div className="flex items-center gap-3.5 pl-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-primary p-2 rounded-xl text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none text-foreground flex items-center gap-1.5">
                SmartRoom <span className="text-primary">Finder</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Techno India University</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-16 relative z-10 flex flex-col justify-center gap-12 md:gap-16">
        
        {/* Hero Section */}
        <motion.div 
          className="text-center space-y-6 max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex justify-center"
            variants={logoVariants}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glass bg-glass text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm">
              <Sparkles className="h-3 w-3 animate-spin-slow" />
              TIU Live Room Booking System
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] font-display"
            variants={itemVariants}
          >
            Locate and Book Rooms <br className="hidden sm:inline"/>
            <span className="bg-gradient-to-r from-primary via-primary to-rose-500 bg-clip-text text-transparent">Instantly in Real-Time</span>
          </motion.h1>
          
          <motion.p 
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed"
            variants={itemVariants}
          >
            Efficient room management system for Techno India University faculty and students. 
            Track live availability across all 7 floors and book slots immediately.
          </motion.p>
        </motion.div>

        {/* Portal Entry Cards */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Staff & Faculty Portal */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-glass border border-glass rounded-3xl p-8 shadow-xl shadow-glow-hover flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary opacity-80" />
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/10 text-primary group-hover:scale-105 transition-transform duration-300">
                  <UserCog className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display">Staff & Faculty</h3>
                  <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mt-0.5">Administrative & Booking Control</p>
                </div>
              </div>
              <ul className="space-y-3.5 text-sm text-muted-foreground font-sans mb-8">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  View real-time occupancies across all floors
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Allocate rooms & manage scheduling routines (Admins)
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Book or release free rooms instantly (Teachers)
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <Button 
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/10 active:scale-95 transition-transform h-11 rounded-xl" 
                onClick={() => navigate('/auth?role=admin')}
              >
                Admin Login
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-transparent active:scale-95 transition-all duration-300 font-bold h-11 rounded-xl" 
                onClick={() => navigate('/auth?role=teacher')}
              >
                Teacher Login
              </Button>
            </div>
          </motion.div>

          {/* Student Portal */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-glass border border-glass rounded-3xl p-8 shadow-xl shadow-glow-hover flex flex-col justify-between group relative overflow-hidden cursor-pointer"
            onClick={() => navigate('/auth?role=student')}
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-foreground/40 opacity-80" />
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/15 p-3 rounded-2xl border border-secondary/10 text-secondary-foreground group-hover:scale-105 transition-transform duration-300">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display">Student Portal</h3>
                  <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mt-0.5">Real-Time Search & Timelines</p>
                </div>
              </div>
              <ul className="space-y-3.5 text-sm text-muted-foreground font-sans mb-8">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  View real-time room availability matrix
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Check active floor routines & daily schedules
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Monitor instant updates on special room allocations
                </li>
              </ul>
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/10 active:scale-95 transition-transform h-11 rounded-xl mt-auto"
            >
              Student Login
              <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature Grid Section */}
        <section className="space-y-8 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight font-display text-foreground">Platform Features</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">Everything you need to orchestrate smart classroom tracking.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/20 transition-all duration-300">
              <LayoutGrid className="h-7 w-7 text-primary mb-3.5" />
              <h4 className="font-bold text-base mb-1.5 text-foreground">7-Floor Matrix</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Color-coded occupancy stats showing current slots and vacant capacities floor by floor.
              </p>
            </div>

            <div className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/20 transition-all duration-300">
              <Clock className="h-7 w-7 text-primary mb-3.5 animate-pulse" />
              <h4 className="font-bold text-base mb-1.5 text-foreground">Live Timers</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Countdown timers for temporary bookings with automatic release and instant free operations.
              </p>
            </div>

            <div className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/20 transition-all duration-300">
              <ShieldAlert className="h-7 w-7 text-primary mb-3.5" />
              <h4 className="font-bold text-base mb-1.5 text-foreground">Conflict Guard</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant warnings prevent double-allocations for the same teacher or class batch in any slot.
              </p>
            </div>

            <div className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/20 transition-all duration-300">
              <RefreshCw className="h-7 w-7 text-primary mb-3.5" />
              <h4 className="font-bold text-base mb-1.5 text-foreground">Real-time Sync</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Supabase backend notifies admins, students, and teachers in real-time when allocations change.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="bg-glass border border-glass p-6 sm:p-8 rounded-3xl shadow-md flex flex-wrap justify-around items-center gap-6">
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-display block">8</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans mt-0.5 block">Floors Tracked</span>
          </div>
          <div className="h-8 w-[1px] bg-glass hidden sm:block" />
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-display block">50+</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans mt-0.5 block">Active Classrooms</span>
          </div>
          <div className="h-8 w-[1px] bg-glass hidden sm:block" />
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-display block">100%</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans mt-0.5 block">Real-time Sync</span>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="w-full bg-glass/20 border-t border-glass py-8 mt-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold font-sans text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>SmartRoom Finder © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <a href="https://technoindiauniversity.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">TIU Website</a>
            <span>•</span>
            <span className="text-foreground/60">Manage Classrooms Smarter</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
