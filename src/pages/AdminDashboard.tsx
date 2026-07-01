import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import RoomBlockDiagram from '@/components/RoomBlockDiagram';
import WeeklySchedule from '@/components/WeeklySchedule';
import { FloorRoomGrid } from '@/components/FloorRoomGrid';
import { RoomTimelineDialog } from '@/components/RoomTimelineDialog';
import { BatchManagement } from '@/components/BatchManagement';
import { BulkRoutineUpload } from '@/components/BulkRoutineUpload';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('availability');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth?role=admin');
      } else if (userRole !== 'admin') {
        if (userRole === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/student');
        }
      }
    }
  }, [user, userRole, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setTimelineOpen(true);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!userRole || userRole !== 'admin') {
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
            <h1 className="text-3xl font-extrabold tracking-tight">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Techno India University - Room Management & Allocation
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

        {/* Main Content Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-glass bg-glass shadow-xl rounded-3xl">
            {/* Left Brand Gradient Border Accent */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary-gradient" />
            
            <CardHeader className="border-b border-glass/60 bg-muted/10 pb-6">
              <CardTitle className="text-2xl font-bold font-display">Welcome, Administrator</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">Logged in as: {user?.email}</p>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-background/60 border border-glass p-1.5 rounded-2xl h-auto gap-1.5 mb-6">
                  <TabsTrigger value="availability" className="rounded-xl font-bold data-[state=active]:bg-primary-gradient data-[state=active]:text-white transition-smooth py-2.5">Room Availability</TabsTrigger>
                  <TabsTrigger value="rooms" className="rounded-xl font-bold data-[state=active]:bg-primary-gradient data-[state=active]:text-white transition-smooth py-2.5">Manage Rooms</TabsTrigger>
                  <TabsTrigger value="schedule" className="rounded-xl font-bold data-[state=active]:bg-primary-gradient data-[state=active]:text-white transition-smooth py-2.5">Allocate Rooms</TabsTrigger>
                  <TabsTrigger value="batches" className="rounded-xl font-bold data-[state=active]:bg-primary-gradient data-[state=active]:text-white transition-smooth py-2.5">Batches</TabsTrigger>
                  <TabsTrigger value="bulk-upload" className="rounded-xl font-bold data-[state=active]:bg-primary-gradient data-[state=active]:text-white transition-smooth py-2.5">Bulk Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="availability" className="space-y-4 focus-visible:outline-none">
                  {activeTab === 'availability' && <FloorRoomGrid onRoomClick={handleRoomClick} isAdmin={true} />}
                </TabsContent>
                
                <TabsContent value="rooms" className="space-y-4 focus-visible:outline-none">
                  {activeTab === 'rooms' && <RoomBlockDiagram />}
                </TabsContent>
                
                <TabsContent value="schedule" className="space-y-4 focus-visible:outline-none">
                  {activeTab === 'schedule' && <WeeklySchedule />}
                </TabsContent>

                <TabsContent value="batches" className="space-y-4 focus-visible:outline-none">
                  {activeTab === 'batches' && <BatchManagement />}
                </TabsContent>

                <TabsContent value="bulk-upload" className="space-y-4 focus-visible:outline-none">
                  {activeTab === 'bulk-upload' && <BulkRoutineUpload />}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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

export default AdminDashboard;
