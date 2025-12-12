import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import AddRoomDialog from '@/components/AddRoomDialog';

interface Room {
  id: string;
  floor_number: number;
  room_number: string;
  room_type: string;
  status: string;
}

const FLOORS = [
  { value: 0, label: 'Ground Floor' },
  { value: 1, label: '1st Floor' },
  { value: 2, label: '2nd Floor' },
  { value: 3, label: '3rd Floor' },
  { value: 4, label: '4th Floor' },
  { value: 5, label: '5th Floor' },
  { value: 6, label: '6th Floor' },
];

export const RoomBlockDiagram = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  const fetchAllRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('id, floor_number, room_number, room_type, status')
      .order('floor_number')
      .order('room_number');

    if (error) {
      toast.error('Failed to fetch rooms');
      console.error(error);
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllRooms();
  }, []);

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    if (!confirm(`Are you sure you want to delete room ${roomNumber}?`)) return;

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      toast.error('Failed to delete room');
      console.error(error);
    } else {
      toast.success(`Room ${roomNumber} deleted`);
      fetchAllRooms();
    }
  };

  const getRoomsByFloor = (floorNumber: number) => {
    return rooms.filter(room => room.floor_number === floorNumber);
  };

  const getRoomTypeColor = (roomType: string) => {
    switch (roomType) {
      case 'lab': return 'bg-purple-500/20 border-purple-500';
      case 'conference': return 'bg-amber-500/20 border-amber-500';
      default: return 'bg-blue-500/20 border-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <h2 className="text-xl font-semibold">All Rooms ({rooms.length} total)</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/20 border-blue-500">Classroom</Badge>
            <Badge variant="outline" className="bg-purple-500/20 border-purple-500">Lab</Badge>
            <Badge variant="outline" className="bg-amber-500/20 border-amber-500">Conference</Badge>
          </div>
        </div>
        <Button onClick={() => setIsAddRoomOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      <div className="space-y-4">
        {FLOORS.map((floor) => {
          const floorRooms = getRoomsByFloor(floor.value);
          
          return (
            <Card key={floor.value} className="overflow-hidden">
              <CardHeader className="py-3 bg-muted/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium">
                    {floor.label}
                  </CardTitle>
                  <Badge variant="secondary">{floorRooms.length} rooms</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {floorRooms.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No rooms on this floor
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {floorRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`relative group px-4 py-2 rounded-lg border-2 transition-all hover:shadow-md ${getRoomTypeColor(room.room_type)}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{room.room_number}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            ({room.room_type})
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.room_number)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddRoomDialog 
        open={isAddRoomOpen} 
        onOpenChange={setIsAddRoomOpen}
        onSuccess={fetchAllRooms}
      />
    </div>
  );
};

export default RoomBlockDiagram;
