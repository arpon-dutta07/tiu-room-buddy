import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { FloorRoomGrid } from '@/components/FloorRoomGrid';
import { RoomTimelineDialog } from '@/components/RoomTimelineDialog';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  if (loading || !user || userRole !== expectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              Techno India University - {isTeacher ? 'Manage Room Bookings' : 'View Room Availability'}
            </p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome, {isTeacher ? 'Teacher' : 'Student'} ({user?.email})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isTeacher 
                ? 'Select a day, time slot, and floor to check room bookings. Click any room status button to allocate a free room or release your reservation.'
                : 'Select a day, time slot, and floor to view room availability. Click any room to see its full day schedule.'}
            </p>
          </CardContent>
        </Card>

        <FloorRoomGrid onRoomClick={handleRoomClick} isAdmin={isTeacher} />

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
