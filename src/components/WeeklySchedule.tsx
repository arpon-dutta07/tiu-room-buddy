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
    
    // Fetch routines for selected day
    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .select('*')
      .eq('day_of_week', selectedDay)
      .order('start_time');

    if (routineError) {
      toast.error('Failed to fetch routines');
      console.error(routineError);
    } else {
      setRoutines(routineData || []);
    }

    // Fetch all rooms
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number');

    if (roomError) {
      toast.error('Failed to fetch rooms');
      console.error(roomError);
    } else {
      setRooms(roomData || []);
    }

    setLoading(false);
  };

  const allocateRoom = async (routine: Routine, roomId: string) => {
    const today = new Date();
    const dayOffset = selectedDay - today.getDay();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);

    const [startHour, startMinute] = routine.start_time.split(':');
    const [endHour, endMinute] = routine.end_time.split(':');

    const occupiedFrom = new Date(targetDate);
    occupiedFrom.setHours(parseInt(startHour), parseInt(startMinute), 0);

    const occupiedTill = new Date(targetDate);
    occupiedTill.setHours(parseInt(endHour), parseInt(endMinute), 0);

    const { error } = await supabase
      .from('rooms')
      .update({
        status: 'occupied',
        allocated_to: `${routine.stream} - ${routine.batch}`,
        subject: routine.subject,
        batch: routine.batch,
        teacher_name: routine.teacher_name,
        occupied_from: occupiedFrom.toISOString(),
        occupied_till: occupiedTill.toISOString(),
      })
      .eq('id', roomId);

    if (error) {
      toast.error('Failed to allocate room');
      console.error(error);
    } else {
      toast.success(`Room allocated for ${routine.stream} ${routine.batch}`);
      fetchData();
    }
  };

  const isRoomAvailable = (room: Room, routine: Routine) => {
    if (room.status === 'free') return true;

    if (room.occupied_from && room.occupied_till) {
      const routineStart = new Date();
      const [startHour, startMinute] = routine.start_time.split(':');
      routineStart.setHours(parseInt(startHour), parseInt(startMinute), 0);

      const routineEnd = new Date();
      const [endHour, endMinute] = routine.end_time.split(':');
      routineEnd.setHours(parseInt(endHour), parseInt(endMinute), 0);

      const occupiedFrom = new Date(room.occupied_from);
      const occupiedTill = new Date(room.occupied_till);

      // Check if routine time doesn't overlap with current occupation
      return routineEnd <= occupiedFrom || routineStart >= occupiedTill;
    }

    return false;
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
            <Card key={routine.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {routine.start_time} - {routine.end_time} | {routine.subject}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {routine.stream} - {routine.batch} | {routine.teacher_name}
                  {routine.default_room && ` | Preferred: Room ${routine.default_room}`}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Available Rooms:</p>
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
                          <span className="text-xs text-muted-foreground">
                            {room.status === 'free' ? 'Free' : 'Available later'}
                          </span>
                        </Button>
                      ))}
                  </div>
                  {rooms.filter((room) => isRoomAvailable(room, routine)).length === 0 && (
                    <p className="text-sm text-muted-foreground">No rooms available for this time slot</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WeeklySchedule;