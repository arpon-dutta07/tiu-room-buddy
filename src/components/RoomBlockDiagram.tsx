import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import AddRoomDialog from '@/components/AddRoomDialog';
import { motion } from 'framer-motion';

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
  { value: 7, label: '7th Floor' },
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
      case 'lab': return 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300 hover:shadow-purple-500/5';
      case 'conference': return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 hover:shadow-amber-500/5';
      default: return 'bg-primary/10 border-primary/20 text-primary hover:shadow-primary/5';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-glass pb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-xl font-bold font-display">All Rooms ({rooms.length} total)</h2>
          <div className="flex gap-1.5 flex-wrap">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">Classroom</Badge>
            <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">Lab</Badge>
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">Conference</Badge>
          </div>
        </div>
        <Button 
          onClick={() => setIsAddRoomOpen(true)}
          className="bg-primary-gradient hover:opacity-90 text-white font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-transform shimmer-hover h-10 rounded-xl px-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {FLOORS.map((floor, fIdx) => {
          const floorRooms = getRoomsByFloor(floor.value);
          
          return (
            <motion.div
              key={floor.value}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: fIdx * 0.03 }}
            >
              <Card className="overflow-hidden border-glass bg-glass shadow-md rounded-2xl relative">
                <CardHeader className="py-3.5 bg-muted/10 border-b border-glass/60">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-bold font-display text-foreground">
                      {floor.label}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-background/80 border border-glass/60 text-muted-foreground font-semibold px-2.5 py-0.5 rounded-lg text-xs font-mono-data">
                      {floorRooms.length} rooms
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-5">
                  {floorRooms.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4 font-sans italic">
                      No rooms on this floor
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {floorRooms.map((room) => (
                        <motion.div
                          key={room.id}
                          whileHover={{ scale: 1.03, y: -1 }}
                          className={`flex items-center justify-between gap-3 pl-4 pr-1.5 py-1.5 rounded-xl border-2 transition-smooth shadow-sm ${getRoomTypeColor(room.room_type)}`}
                        >
                          <div className="flex flex-col justify-center">
                            <span className="font-bold text-sm font-mono-data leading-none mb-0.5">{room.room_number}</span>
                            <span className="text-[9px] opacity-75 font-semibold uppercase tracking-wider leading-none">
                              {room.room_type}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRoom(room.id, room.room_number)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <AddRoomDialog 
        open={isAddRoomOpen} 
        onOpenChange={setIsAddRoomOpen}
        onSuccess={fetchAllRooms}
      />
    </div>
  );
};

export default RoomBlockDiagram;
