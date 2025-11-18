import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Routine {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  stream: string;
  batch: string;
  teacher_name: string;
  default_room: string | null;
  allocated_room_id: string | null;
  rooms?: {
    room_number: string;
  };
}

interface Room {
  id: string;
  room_number: string;
  status: string;
  allocated_to: string | null;
  subject: string | null;
  batch: string | null;
  teacher_name: string | null;
  occupied_from: string | null;
  occupied_till: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WeeklySchedule = () => {
  const [selectedDay, setSelectedDay] = useState(1); // Default to Monday
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDay]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch routines for selected day with allocated room info
    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .select('*, rooms(room_number)')
      .eq('day_of_week', selectedDay)
      .order('start_time');

    if (routineError) {
      toast.error('Failed to fetch routines');
      console.error('Routine error:', routineError);
    } else {
      console.log(`Found ${routineData?.length || 0} routines for day ${selectedDay}:`, routineData);
      setRoutines(routineData || []);
    }

    // Fetch all rooms
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number');

    if (roomError) {
      toast.error('Failed to fetch rooms');
      console.error('Room error:', roomError);
    } else {
      console.log(`Found ${roomData?.length || 0} rooms:`, roomData);
      setRooms(roomData || []);
    }

    setLoading(false);
  };

  const allocateRoom = async (routine: Routine, roomId: string) => {
    // Check if this room is already allocated for overlapping times on this day
    const { data: conflictingRoutines } = await supabase
      .from('routines')
      .select('*, rooms(room_number)')
      .eq('day_of_week', selectedDay)
      .eq('allocated_room_id', roomId)
      .neq('id', routine.id);

    if (conflictingRoutines && conflictingRoutines.length > 0) {
      // Check for time conflicts
      const hasConflict = conflictingRoutines.some((cr) => {
        const crStart = cr.start_time;
        const crEnd = cr.end_time;
        const routineStart = routine.start_time;
        const routineEnd = routine.end_time;

        // Check if times overlap
        return !(routineEnd <= crStart || routineStart >= crEnd);
      });

      if (hasConflict) {
        const conflictRoom = conflictingRoutines[0].rooms?.room_number;
        toast.error(`Room ${conflictRoom} is already allocated for this time slot`);
        return;
      }
    }

    // Permanently allocate the room to this routine
    const { error } = await supabase
      .from('routines')
      .update({ allocated_room_id: roomId })
      .eq('id', routine.id);

    if (error) {
      toast.error('Failed to allocate room');
      console.error(error);
    } else {
      toast.success(`Room permanently allocated for ${routine.stream} ${routine.batch}`);
      fetchData();
    }
  };

  const isRoomAvailable = (room: Room, routine: Routine) => {
    // Check if any other routine on this day has this room at overlapping times
    const conflictingRoutine = routines.find((r) => {
      if (r.id === routine.id) return false;
      if (r.allocated_room_id !== room.id) return false;

      // Check if times overlap
      return !(routine.end_time <= r.start_time || routine.start_time >= r.end_time);
    });

    return !conflictingRoutine;
  };

  if (loading) {
    return <div className="text-center py-8">Loading schedule...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {DAYS.slice(1, 7).map((day, index) => (
          <Button
            key={day}
            variant={selectedDay === index + 1 ? 'default' : 'outline'}
            onClick={() => setSelectedDay(index + 1)}
          >
            {day}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {routines.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No classes scheduled for {DAYS[selectedDay]}</p>
            </CardContent>
          </Card>
        ) : (
          routines.map((routine) => (
            <Card key={routine.id} className={routine.allocated_room_id ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {routine.start_time} - {routine.end_time} | {routine.subject}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {routine.stream} - {routine.batch} | {routine.teacher_name}
                </p>
                {routine.allocated_room_id && routine.rooms && (
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    ✓ Allocated: Room {routine.rooms.room_number}
                  </p>
                )}
              </CardHeader>
              {!routine.allocated_room_id && (
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-2">Click a room to permanently allocate:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {rooms
                        .filter((room) => isRoomAvailable(room, routine))
                        .map((room) => (
                          <Button
                            key={room.id}
                            variant="outline"
                            size="sm"
                            onClick={() => allocateRoom(routine, room.id)}
                            className="h-auto py-2 flex flex-col items-start"
                          >
                            <span className="font-semibold">{room.room_number}</span>
                            <span className="text-xs opacity-90">✓ Available</span>
                          </Button>
                        ))}
                    </div>
                    {rooms.filter((room) => isRoomAvailable(room, routine)).length === 0 && (
                      <p className="text-sm text-destructive">⚠ No rooms available for this time slot</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WeeklySchedule;