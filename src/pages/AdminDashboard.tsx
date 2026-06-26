import { useState } from 'react';
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

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('availability');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setTimelineOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Techno India University - Room Management</p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, Administrator</CardTitle>
            <p className="text-sm text-muted-foreground">Logged in as: {user?.email}</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="availability">Room Availability</TabsTrigger>
                <TabsTrigger value="rooms">Manage Rooms</TabsTrigger>
                <TabsTrigger value="schedule">Allocate Rooms</TabsTrigger>
                <TabsTrigger value="batches">Batches</TabsTrigger>
                <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="availability" className="space-y-4">
                {activeTab === 'availability' && <FloorRoomGrid onRoomClick={handleRoomClick} isAdmin={true} />}
              </TabsContent>
              
              <TabsContent value="rooms" className="space-y-4">
                {activeTab === 'rooms' && <RoomBlockDiagram />}
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                {activeTab === 'schedule' && <WeeklySchedule />}
              </TabsContent>

              <TabsContent value="batches" className="space-y-4">
                {activeTab === 'batches' && <BatchManagement />}
              </TabsContent>

              <TabsContent value="bulk-upload" className="space-y-4">
                {activeTab === 'bulk-upload' && <BulkRoutineUpload />}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
