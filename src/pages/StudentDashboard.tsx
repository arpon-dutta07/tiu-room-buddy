import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { FloorRoomGrid } from '@/components/FloorRoomGrid';
import { RoomTimelineDialog } from '@/components/RoomTimelineDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const isTeacherRoute = location.pathname === '/teacher';
  const isTeacher = userRole === 'teacher';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate(isTeacherRoute ? '/auth?role=teacher' : '/auth?role=student');
      } else {
        const expectedRole = isTeacherRoute ? 'teacher' : 'student';
        if (userRole !== expectedRole) {
          if (userRole === 'admin') {
            navigate('/admin');
          } else if (userRole === 'teacher') {
            navigate('/teacher');
          } else if (userRole === 'student') {
            navigate('/student');
          }
        }
      }
    }
  }, [user, userRole, loading, navigate, isTeacherRoute]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setTimelineOpen(true);
  };

  const expectedRole = isTeacherRoute ? 'teacher' : 'student';
  
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!userRole || userRole !== expectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-background via-card/30 to-primary/5 relative overflow-hidden">
      {/* Ambient background wash */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[130px] pointer-events-none dark:bg-primary/10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[130px] pointer-events-none dark:bg-secondary/10" />

      <div className="container mx-auto p-4 md:p-8 relative z-10">
        {/* Header Block */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-glass border border-glass p-6 rounded-3xl shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {isTeacher ? 'Teacher' : 'Student'} <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Techno India University - {isTeacher ? 'Manage Room Bookings' : 'View Room Availability'}
            </p>
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="bg-background/50 border-glass rounded-xl px-4 hover:scale-105 active:scale-95 transition-all text-foreground hover:bg-glass/80 font-semibold shadow-sm"
            >
              <LogOut className="h-4 w-4 mr-2 text-primary" />
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Welcome Card Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.08 }}
        >
          <Card className="mb-6 relative overflow-hidden border-glass bg-glass shadow-xl rounded-3xl">
            {/* Left Brand Gradient Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary-gradient" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold font-display">
                Welcome, {isTeacher ? 'Faculty Member' : 'Student'}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono">Logged in as: {user?.email}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isTeacher 
                  ? 'Select a day, time slot, and floor to check room bookings. Click any room status button to allocate a free room or release your reservation.'
                  : 'Select a day, time slot, and floor to view room availability. Click any room to see its full day schedule.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* FloorRoomGrid Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.15 }}
        >
          <FloorRoomGrid onRoomClick={handleRoomClick} isAdmin={isTeacher} />
        </motion.div>

        <RoomTimelineDialog
          room={selectedRoom}
          day={selectedDay}
          open={timelineOpen}
          onOpenChange={setTimelineOpen}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;
