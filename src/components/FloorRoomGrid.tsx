import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuickAllocateDialog } from './QuickAllocateDialog';

interface Room {
  id: string;
  room_number: string;
  floor_number: number;
  status: string;
  isOccupied?: boolean;
  allocated_to?: string | null;
  subject?: string | null;
  batch?: string | null;
  teacher_name?: string | null;
}

interface FloorRoomGridProps {
  onRoomClick: (room: Room) => void;
  isAdmin?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { id: 1, label: '9-10 AM', start: '09:00', end: '10:00' },
  { id: 2, label: '10-11 AM', start: '10:00', end: '11:00' },
  { id: 3, label: '11-12 PM', start: '11:00', end: '12:00' },
  { id: 4, label: '12-1 PM', start: '12:00', end: '13:00' },
  { id: 5, label: '1-2 PM', start: '13:00', end: '14:00' },
  { id: 6, label: '2-3 PM', start: '14:00', end: '15:00' },
  { id: 7, label: '3-4 PM', start: '15:00', end: '16:00' },
  { id: 8, label: '4-5 PM', start: '16:00', end: '17:00' },
];

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

export const FloorRoomGrid = ({ onRoomClick, isAdmin = false }: FloorRoomGridProps) => {
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [selectedRoomForAllocation, setSelectedRoomForAllocation] = useState<Room | null>(null);

  useEffect(() => {
    fetchRoomAvailability();
  }, [selectedDay, selectedTimeSlot, selectedFloor]);

  const fetchRoomAvailability = async () => {
    setLoading(true);
    
    // Fetch all rooms on the selected floor
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('floor_number', selectedFloor)
      .order('room_number');

    if (roomsError) {
      toast.error('Failed to fetch rooms');
      console.error(roomsError);
      setLoading(false);
      return;
    }

    // Fetch all routines for the selected day and time slot
    const { data: routinesData, error: routinesError } = await supabase
      .from('routines')
      .select('*, rooms(room_number)')
      .eq('day_of_week', selectedDay)
      .gte('end_time', selectedTimeSlot.start)
      .lte('start_time', selectedTimeSlot.end);

    if (routinesError) {
      toast.error('Failed to fetch schedules');
      console.error(routinesError);
      setLoading(false);
      return;
    }

    // Map rooms with their occupation status
    const roomsWithStatus = roomsData.map((room) => {
      const occupyingRoutine = routinesData?.find((routine) => routine.allocated_room_id === room.id);
      
      return {
        ...room,
        isOccupied: !!occupyingRoutine,
        allocated_to: occupyingRoutine?.stream + ' - ' + occupyingRoutine?.batch || null,
        subject: occupyingRoutine?.subject || null,
        batch: occupyingRoutine?.batch || null,
        teacher_name: occupyingRoutine?.teacher_name || null,
      };
    });

    setRooms(roomsWithStatus);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Room Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Day Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Day</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, index) => (
                <Button
                  key={day}
                  variant={selectedDay === index + 1 ? 'default' : 'outline'}
                  onClick={() => setSelectedDay(index + 1)}
                  size="sm"
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Time Slot</label>
            <Select
              value={selectedTimeSlot.id.toString()}
              onValueChange={(value) => {
                const slot = TIME_SLOTS.find((s) => s.id.toString() === value);
                if (slot) setSelectedTimeSlot(slot);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id.toString()}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Floor Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Floor</label>
            <Select
              value={selectedFloor.toString()}
              onValueChange={(value) => setSelectedFloor(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLOORS.map((floor) => (
                  <SelectItem key={floor.value} value={floor.value.toString()}>
                    {floor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            {FLOORS.find((f) => f.value === selectedFloor)?.label} - {DAYS[selectedDay - 1]} - {selectedTimeSlot.label}
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Occupied</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rooms found on this floor
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {rooms.map((room) => (
                <Button
                  key={room.id}
                  variant="outline"
                  onClick={() => {
                    if (isAdmin) {
                      setSelectedRoomForAllocation(room);
                      setAllocateDialogOpen(true);
                    } else {
                      onRoomClick(room);
                    }
                  }}
                  className={cn(
                    'h-24 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105',
                    room.isOccupied
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                      : 'bg-green-500 hover:bg-green-600 text-white border-green-600'
                  )}
                >
                  <span className="text-lg font-bold">{room.room_number}</span>
                  <span className="text-xs">
                    {room.isOccupied ? 'Occupied' : 'Free'}
                  </span>
                  {room.isOccupied && room.subject && (
                    <span className="text-xs font-semibold truncate w-full px-1">
                      {room.subject}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && selectedRoomForAllocation && (
        <QuickAllocateDialog
          open={allocateDialogOpen}
          onOpenChange={setAllocateDialogOpen}
          room={selectedRoomForAllocation}
          day={selectedDay}
          timeSlot={selectedTimeSlot}
          onSuccess={fetchRoomAvailability}
        />
      )}
    </div>
  );
};
