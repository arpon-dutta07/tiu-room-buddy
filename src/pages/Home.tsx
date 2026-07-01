import { useState, useEffect } from 'react';
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
  ArrowRight,
  HelpCircle,
  ChevronDown,
  User,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Character-by-character typing text animation component
const TypingText = ({ text, className = "" }: { text: string; className?: string }) => {
  const letters = Array.from(text);
  return (
    <motion.span
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.015, delayChildren: 0.2 }
        }
      }}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 3 },
            visible: { opacity: 1, y: 0 }
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Animated Number Counter Component
const CountUp = ({ to, duration = 1.8, suffix = "" }: { to: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = to;
    if (start === end) return;

    const totalMilliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMilliseconds / end), 25);
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [to, duration]);

  return <span>{count}{suffix}</span>;
};

// FAQ Item Accordion Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-glass bg-glass/25 rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between text-left font-bold text-foreground focus:outline-none transition-colors"
      >
        <span className="text-sm md:text-base font-display">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-primary"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-muted-foreground font-sans leading-relaxed border-t border-glass/30">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Home = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  // Premium 3D Mouse Tilt Animation Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    card.style.transform = `perspective(1000px) rotateX(${-y / 16}deg) rotateY(${x / 16}deg) scale3d(1.015, 1.015, 1.015)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        {/* Spinner Loader */}
        <div className="flex flex-col items-center gap-5 z-10">
          <div className="relative w-20 h-20">
            <motion.div 
              className="absolute inset-0 rounded-2xl border-4 border-primary/20"
              style={{ borderTopColor: 'var(--primary)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-xs font-extrabold tracking-widest text-primary uppercase animate-pulse font-sans">
            Checking Session
          </div>
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

  const scrollRevealVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 16,
        duration: 0.7
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-background font-sans overflow-x-hidden">
      {/* 3D Floating Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-1/6 -left-16 w-96 h-96 rounded-full bg-gradient-to-tr from-primary/10 to-rose-500/10 blur-3xl opacity-50 dark:opacity-40"
          animate={{
            y: [0, -40, 0],
            x: [0, 30, 0],
            scale: [1, 1.12, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-20 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-primary/10 to-rose-600/5 blur-3xl opacity-45 dark:opacity-30"
          animate={{
            y: [0, 50, 0],
            x: [0, -35, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Background Campus Illustration Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-[0.06] dark:opacity-[0.12] z-0 pointer-events-none filter grayscale contrast-125 brightness-[0.95]"
        style={{ backgroundImage: `url('/campus.jpg')` }}
      />

      {/* Floating Header / Navbar */}
      <header className="sticky top-0 z-50 w-full p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3.5 bg-glass/85 border border-glass backdrop-blur-md rounded-2xl shadow-lg shadow-glow/5">
          <div className="flex items-center gap-3.5 pl-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-primary p-2 rounded-xl text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none text-foreground flex items-center gap-1.5 font-display">
                SmartRoom <span className="text-primary">Finder</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 font-sans">Techno India University</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-16 relative z-10 flex flex-col justify-center gap-16 md:gap-24">
        
        {/* Hero Section */}
        <motion.div 
          className="text-center space-y-6 max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex justify-center"
            variants={itemVariants}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-glass bg-glass text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
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
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed min-h-[56px]"
            variants={itemVariants}
          >
            <TypingText 
              text="Efficient room management system for Techno India University faculty and students. Track live availability across all 7 floors and book slots immediately."
            />
          </motion.p>
        </motion.div>

        {/* Portal Entry Cards with cursor 3D Tilt */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Staff & Faculty Portal */}
          <motion.div
            variants={itemVariants}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="bg-glass border border-glass rounded-3xl p-8 shadow-xl shadow-glow-hover flex flex-col justify-between group relative overflow-hidden transition-all duration-200"
            style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px)' }}
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary opacity-80" />
            <div style={{ transform: 'translateZ(30px)' }}>
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
            
            <div className="flex flex-col sm:flex-row gap-3 mt-auto" style={{ transform: 'translateZ(40px)' }}>
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
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="bg-glass border border-glass rounded-3xl p-8 shadow-xl shadow-glow-hover flex flex-col justify-between group relative overflow-hidden cursor-pointer transition-all duration-200"
            onClick={() => navigate('/auth?role=student')}
            style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px)' }}
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-foreground/40 opacity-80" />
            <div style={{ transform: 'translateZ(30px)' }}>
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
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/10 active:scale-95 transition-transform h-11 rounded-xl mt-auto animate-pulse"
              style={{ transform: 'translateZ(40px)' }}
            >
              Student Login
              <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Row - Animated CountUp Counters */}
        <motion.section 
          className="bg-glass border border-glass p-6 sm:p-8 rounded-3xl shadow-md flex flex-wrap justify-around items-center gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={scrollRevealVariants}
        >
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-display block">
              <CountUp to={8} />
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans mt-0.5 block">Floors Tracked</span>
          </div>
          <div className="h-8 w-[1px] bg-glass hidden sm:block" />
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-display block">
              <CountUp to={50} suffix="+" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans mt-0.5 block">Active Classrooms</span>
          </div>
          <div className="h-8 w-[1px] bg-glass hidden sm:block" />
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-display block">
              <CountUp to={100} suffix="%" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans mt-0.5 block">Real-time Sync</span>
          </div>
        </motion.section>

        {/* How It Works Timeline Section */}
        <motion.section 
          className="space-y-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight font-display text-foreground">How it Works</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">Streamlining room updates in four simple steps.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-glass hidden md:block -z-10" />
            
            <motion.div 
              whileHover={{ y: -5, scale: 1.015 }}
              className="bg-glass/30 border border-glass rounded-2xl p-5 space-y-3 relative hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <span className="absolute -top-3.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">STEP 1</span>
              <h4 className="font-bold text-sm uppercase tracking-wider text-foreground font-display pt-2">Authenticate</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log in to your dashboard. The system securely identifies whether you are an admin, faculty, or student.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, scale: 1.015 }}
              className="bg-glass/30 border border-glass rounded-2xl p-5 space-y-3 relative hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <span className="absolute -top-3.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">STEP 2</span>
              <h4 className="font-bold text-sm uppercase tracking-wider text-foreground font-display pt-2">Explore Grid</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                View the visual 7-floor master grid. Hover or click to check current room availability summaries.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, scale: 1.015 }}
              className="bg-glass/30 border border-glass rounded-2xl p-5 space-y-3 relative hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <span className="absolute -top-3.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">STEP 3</span>
              <h4 className="font-bold text-sm uppercase tracking-wider text-foreground font-display pt-2">Allocate Room</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Faculty can book free rooms for classes or temporary special slots with automated release timers.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, scale: 1.015 }}
              className="bg-glass/30 border border-glass rounded-2xl p-5 space-y-3 relative hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <span className="absolute -top-3.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">STEP 4</span>
              <h4 className="font-bold text-sm uppercase tracking-wider text-foreground font-display pt-2">Live Update</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Room status updates update all user roles instantly. Active timers release rooms automatically.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Feature Grid Section - Reordered here! */}
        <motion.section 
          className="space-y-8 pt-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight font-display text-foreground">Platform Features</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">Everything you need to orchestrate smart classroom tracking.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <LayoutGrid className="h-7 w-7 text-primary mb-3.5" />
              <h4 className="font-bold text-base mb-1.5 text-foreground font-display">7-Floor Matrix</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Color-coded occupancy stats showing current slots and vacant capacities floor by floor.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <Clock className="h-7 w-7 text-primary mb-3.5 animate-pulse" />
              <h4 className="font-bold text-base mb-1.5 text-foreground font-display">Live Timers</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Countdown timers for temporary bookings with automatic release and instant free operations.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <ShieldAlert className="h-7 w-7 text-primary mb-3.5" />
              <h4 className="font-bold text-base mb-1.5 text-foreground font-display">Conflict Guard</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant warnings prevent double-allocations for the same teacher or class batch in any slot.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-glass border border-glass/40 rounded-2xl p-5 shadow-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <RefreshCw className="h-7 w-7 text-primary mb-3.5" />
              <h4 className="font-bold text-base mb-1.5 text-foreground font-display">Real-time Sync</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Supabase backend notifies admins, students, and teachers in real-time when allocations change.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Interactive Floor Preview Showcase */}
        <motion.section 
          className="space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight font-display text-foreground">Interactive Demo</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">Hover over the room blocks below to preview classroom statuses.</p>
          </div>

          <div className="bg-glass border border-glass rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-glass/30 pb-4 mb-6 gap-3">
              <div>
                <h4 className="font-bold text-lg text-foreground font-display">Ground Floor Plan Preview</h4>
                <p className="text-xs text-muted-foreground">Example live state layout for 9:00 - 10:00 AM slot</p>
              </div>
              <div className="flex gap-4 text-xs font-bold font-sans">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Free
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Occupied
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" /> Special (Temp)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex flex-col justify-between h-28 cursor-pointer shadow-sm shadow-emerald-500/5"
              >
                <span className="font-extrabold text-lg text-emerald-700 dark:text-emerald-400 font-display">G01</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 w-max">FREE</span>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl flex flex-col justify-between h-28 cursor-pointer shadow-sm shadow-rose-500/5"
              >
                <span className="font-extrabold text-lg text-rose-700 dark:text-rose-400 font-display">G02</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300 w-max">OCCUPIED</span>
                  <span className="text-[9px] text-muted-foreground truncate">Subject: Biotech Lab</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="bg-amber-500/10 border border-amber-500/50 p-5 rounded-2xl flex flex-col justify-between h-28 cursor-pointer shadow-md shadow-amber-500/10 animate-[pulse_2.2s_infinite]"
              >
                <span className="font-extrabold text-lg text-amber-700 dark:text-amber-400 font-display">G03</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 w-max">SPECIAL</span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">⚡ 12m 45s left</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex flex-col justify-between h-28 cursor-pointer shadow-sm shadow-emerald-500/5"
              >
                <span className="font-extrabold text-lg text-emerald-700 dark:text-emerald-400 font-display">G04</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 w-max">FREE</span>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Faculty & Student Testimonials Section */}
        <motion.section 
          className="space-y-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight font-display text-foreground flex items-center justify-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              User Testimonials
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">See what our faculty and students say about SmartRoom Finder.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-glass border-glass rounded-3xl p-6 shadow-md">
              <CardContent className="p-0 space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground italic font-sans leading-relaxed">
                  "Finding an empty lecture hall or conference room for lab seminars used to take up to 20 minutes of wandering between floors. Now I just check the live matrix and reserve a free room instantly."
                </p>
                <div className="flex items-center gap-3 border-t border-glass/30 pt-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground">Siddharth Sen</h5>
                    <p className="text-[10px] text-muted-foreground">B.Tech Student, Computer Science</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-glass border-glass rounded-3xl p-6 shadow-md">
              <CardContent className="p-0 space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground italic font-sans leading-relaxed">
                  "The special temporary slot allocation is a game-changer. I can schedule make-up lectures on any day, and the system automatically updates the student schedule and counts down to release the room when done."
                </p>
                <div className="flex items-center gap-3 border-t border-glass/30 pt-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground">Dr. Ananya Roy</h5>
                    <p className="text-[10px] text-muted-foreground">Professor, Department of Biotech</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Platform FAQs Accordion */}
        <motion.section 
          className="space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight font-display text-foreground flex items-center justify-center gap-2">
              <HelpCircle className="h-7 w-7 text-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">Common questions about schedules, roles, and room reservations.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem 
              question="What is the difference between standard and special bookings?" 
              answer="Standard bookings are recurring classroom routines uploaded by school admins. Special bookings are temporary sessions allocated instantly by teachers (e.g. for make-up lectures, lab exams, or seminars) which automatically expire after a set time."
            />
            <FAQItem 
              question="Can students allocate or book classrooms?" 
              answer="No. Students have view-only access. They can check real-time availability grids, see which classes are scheduled, and check floor timelines, but only faculty and admins can write or release bookings."
            />
            <FAQItem 
              question="How do the automatic release timers work?" 
              answer="When a teacher creates a 'Special Instant Booking', they choose a countdown duration (e.g. 30 minutes, 65 minutes). The system registers the precise expiration timestamp and automatically frees the room, returning it to vacant status when the countdown ends."
            />
            <FAQItem 
              question="How does the conflict guard feature work?" 
              answer="When an admin or teacher attempts to allocate a room, the system checks in real-time if the selected batch or teacher already has another class scheduled during that specific time slot. If a conflict exists, it warns the user immediately."
            />
          </div>
        </motion.section>
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
            <span className="text-foreground/60 font-sans">Manage Classrooms Smarter</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
