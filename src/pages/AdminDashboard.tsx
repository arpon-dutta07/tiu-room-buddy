import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RoomGrid from '@/components/RoomGrid';
import WeeklySchedule from '@/components/WeeklySchedule';
import AddRoomDialog from '@/components/AddRoomDialog';
import { FloorRoomGrid } from '@/components/FloorRoomGrid';
import { RoomTimelineDialog } from '@/components/RoomTimelineDialog';
import { BatchManagement } from '@/components/BatchManagement';
import { ThemeToggle } from '@/components/ThemeToggle';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setTimelineOpen(true);
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('floor_number', selectedFloor)
      .order('room_number');

    if (error) {
      toast.error('Failed to fetch rooms');
      console.error(error);
    } else {
      setRooms(data || []);
    }
  };

  const handleFreeRoom = async (roomId: string) => {
    const { error } = await supabase
      .from('rooms')
      .update({
        status: 'free',
        allocated_to: null,
        subject: null,
        batch: null,
        teacher_name: null,
        occupied_from: null,
        occupied_till: null,
      })
      .eq('id', roomId);

    if (error) {
      toast.error('Failed to free room');
      console.error(error);
    } else {
      toast.success('Room freed successfully');
      fetchRooms();
    }
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
            <Tabs defaultValue="availability" className="w-full" onValueChange={(value) => {
              if (value === 'rooms') fetchRooms();
            }}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="availability">Room Availability</TabsTrigger>
                <TabsTrigger value="rooms">Manage Rooms</TabsTrigger>
                <TabsTrigger value="schedule">Allocate Rooms</TabsTrigger>
                <TabsTrigger value="batches">Batches</TabsTrigger>
              </TabsList>
              
              <TabsContent value="availability" className="space-y-4">
                <FloorRoomGrid onRoomClick={handleRoomClick} isAdmin={true} />
              </TabsContent>
              
              <TabsContent value="rooms" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setIsAddRoomOpen(true)}>Add Room</Button>
                </div>
                <RoomGrid rooms={rooms} onFreeRoom={handleFreeRoom} isAdmin={true} />
                <AddRoomDialog 
                  open={isAddRoomOpen} 
                  onOpenChange={setIsAddRoomOpen}
                  onSuccess={fetchRooms}
                />
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <WeeklySchedule />
              </TabsContent>

              <TabsContent value="batches" className="space-y-4">
                <BatchManagement />
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
