import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';
import RoomGrid from '@/components/RoomGrid';
import AddRoomDialog from '@/components/AddRoomDialog';
import AssignRoomDialog from '@/components/AssignRoomDialog';

const AdminDashboard = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAssignRoomOpen, setIsAssignRoomOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('admin-rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFloor]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
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
    setLoadingRooms(false);
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Techno India University - Room Management</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => setIsAddRoomOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
            <Button onClick={() => setIsAssignRoomOpen(true)} variant="secondary">
              <Plus className="h-4 w-4 mr-2" />
              Assign Room
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Floor Selector</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedFloor.toString()} onValueChange={(v) => setSelectedFloor(parseInt(v))}>
              <TabsList className="grid grid-cols-8 w-full">
                <TabsTrigger value="0">Ground</TabsTrigger>
                <TabsTrigger value="1">1st</TabsTrigger>
                <TabsTrigger value="2">2nd</TabsTrigger>
                <TabsTrigger value="3">3rd</TabsTrigger>
                <TabsTrigger value="4">4th</TabsTrigger>
                <TabsTrigger value="5">5th</TabsTrigger>
                <TabsTrigger value="6">6th</TabsTrigger>
                <TabsTrigger value="7">7th</TabsTrigger>
              </TabsList>
              <TabsContent value={selectedFloor.toString()} className="mt-6">
                {loadingRooms ? (
                  <div className="text-center py-8">Loading rooms...</div>
                ) : (
                  <RoomGrid rooms={rooms} onFreeRoom={handleFreeRoom} isAdmin={true} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AddRoomDialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen} onSuccess={fetchRooms} />
      <AssignRoomDialog open={isAssignRoomOpen} onOpenChange={setIsAssignRoomOpen} onSuccess={fetchRooms} />
    </div>
  );
};

export default AdminDashboard;
