import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import RoomGrid from '@/components/RoomGrid';

const StudentDashboard = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'student')) {
      navigate('/');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('student-rooms')
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
            <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground">Techno India University - View Room Availability</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card className="mb-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success"></div>
                <span className="text-sm">Free</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive"></div>
                <span className="text-sm">Occupied</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Floor Selector (1st to 6th Floor Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedFloor.toString()} onValueChange={(v) => setSelectedFloor(parseInt(v))}>
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="1">1st Floor</TabsTrigger>
                <TabsTrigger value="2">2nd Floor</TabsTrigger>
                <TabsTrigger value="3">3rd Floor</TabsTrigger>
                <TabsTrigger value="4">4th Floor</TabsTrigger>
                <TabsTrigger value="5">5th Floor</TabsTrigger>
                <TabsTrigger value="6">6th Floor</TabsTrigger>
              </Tabs>
              <TabsContent value={selectedFloor.toString()} className="mt-6">
                {loadingRooms ? (
                  <div className="text-center py-8">Loading rooms...</div>
                ) : (
                  <RoomGrid rooms={rooms} isAdmin={false} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
