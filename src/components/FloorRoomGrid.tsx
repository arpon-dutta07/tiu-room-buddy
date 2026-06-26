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
  
  // Day-wide data lists
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [allRoutines, setAllRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [selectedRoomForAllocation, setSelectedRoomForAllocation] = useState<Room | null>(null);

  const fetchDayData = async () => {
    setLoading(true);
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number');

      if (roomsError) throw roomsError;

      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('day_of_week', selectedDay);

      if (routinesError) throw routinesError;

      setAllRooms(roomsData || []);
      setAllRoutines(routinesData || []);
    } catch (err) {
      toast.error('Failed to load room availability');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayData();
  }, [selectedDay]);

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  const checkRoutineOverlap = (routine: any, slot: any) => {
    const rStart = timeToMinutes(routine.start_time);
    const rEnd = timeToMinutes(routine.end_time);
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);
    return rStart < slotEnd && rEnd > slotStart;
  };

  const getFloorSlotStats = (floorNum: number, slot: any) => {
    const floorRooms = allRooms.filter((r) => r.floor_number === floorNum);
    const total = floorRooms.length;
    if (total === 0) return { total: 0, occupied: 0, free: 0 };

    let occupied = 0;
    floorRooms.forEach((room) => {
      const isOccupied = allRoutines.some(
        (routine) => routine.allocated_room_id === room.id && checkRoutineOverlap(routine, slot)
      );
      if (isOccupied) occupied++;
    });

    return { total, occupied, free: total - occupied };
  };

  const getRoomsWithAvailability = () => {
    const floorRooms = allRooms.filter((r) => r.floor_number === selectedFloor);
    return floorRooms.map((room) => {
      const occupyingRoutine = allRoutines.find(
        (routine) => routine.allocated_room_id === room.id && checkRoutineOverlap(routine, selectedTimeSlot)
      );

      return {
        ...room,
        isOccupied: !!occupyingRoutine,
        allocated_to: occupyingRoutine ? `${occupyingRoutine.stream} - ${occupyingRoutine.batch}` : null,
        subject: occupyingRoutine?.subject || null,
        batch: occupyingRoutine?.batch || null,
        teacher_name: occupyingRoutine?.teacher_name || null,
      };
    });
  };

  const roomsToRender = getRoomsWithAvailability();

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Day</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, index) => (
                <Button
                  key={day}
                  variant={selectedDay === index + 1 ? 'default' : 'outline'}
                  onClick={() => setSelectedDay(index + 1)}
                  size="sm"
                  className="px-4 py-2 font-medium"
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floor & Time Availability Matrix */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">Master Availability Matrix ({DAYS[selectedDay - 1]})</CardTitle>
          <p className="text-xs text-muted-foreground">
            Click on any cell to view detailed room status below. Colors represent floor occupancies.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">Loading availability grid...</div>
          ) : allRooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No rooms defined in system. Please add rooms.</div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-semibold sticky left-0 bg-background border-r min-w-[120px]">Floor</th>
                    {TIME_SLOTS.map((slot) => (
                      <th key={slot.id} className="p-3 text-center font-semibold min-w-[95px]">{slot.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FLOORS.map((floor) => (
                    <tr key={floor.value} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3 font-medium sticky left-0 bg-background border-r font-semibold">
                        {floor.label}
                      </td>
                      {TIME_SLOTS.map((slot) => {
                        const stats = getFloorSlotStats(floor.value, slot);
                        const isSelected = selectedFloor === floor.value && selectedTimeSlot.id === slot.id;
                        
                        let colorClass = 'bg-muted/40 text-muted-foreground border-transparent cursor-not-allowed';
                        if (stats.total > 0) {
                          if (stats.occupied === 0) {
                            colorClass = isSelected
                              ? 'bg-green-500/25 text-green-900 dark:text-green-300 ring-2 ring-primary border-primary scale-[1.03] font-bold shadow'
                              : 'bg-green-500/10 hover:bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/20 hover:scale-[1.02]';
                          } else if (stats.free === 0) {
                            colorClass = isSelected
                              ? 'bg-red-500/25 text-red-900 dark:text-red-300 ring-2 ring-primary border-primary scale-[1.03] font-bold shadow'
                              : 'bg-red-500/10 hover:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20 hover:scale-[1.02]';
                          } else {
                            colorClass = isSelected
                              ? 'bg-amber-500/25 text-amber-900 dark:text-amber-300 ring-2 ring-primary border-primary scale-[1.03] font-bold shadow'
                              : 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:scale-[1.02]';
                          }
                        }

                        return (
                          <td key={slot.id} className="p-2 text-center">
                            {stats.total > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedFloor(floor.value);
                                  setSelectedTimeSlot(slot);
                                }}
                                className={cn(
                                  "w-full px-2 py-1.5 rounded text-xs font-semibold transition-all duration-150 select-none",
                                  colorClass
                                )}
                              >
                                {stats.free}/{stats.total} Free
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Detail Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-xl">
              {FLOORS.find((f) => f.value === selectedFloor)?.label} — {selectedTimeSlot.label} ({DAYS[selectedDay - 1]})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Rooms status for the selected matrix cell. Green is free, red is occupied.
            </p>
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-green-500 rounded border border-green-600"></div>
              <span>Free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-red-500 rounded border border-red-600"></div>
              <span>Occupied</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading room status...</div>
          ) : roomsToRender.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
              No rooms defined on this floor. Use the "Manage Rooms" tab to add some.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {roomsToRender.map((room) => (
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
                    'h-24 flex flex-col items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.03] border-2 shadow-sm font-semibold',
                    room.isOccupied
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                      : 'bg-green-500 hover:bg-green-600 text-white border-green-600'
                  )}
                >
                  <span className="text-lg font-bold leading-none">{room.room_number}</span>
                  <span className="text-[10px] opacity-90 uppercase tracking-wider font-semibold">
                    {room.isOccupied ? 'Occupied' : 'Free'}
                  </span>
                  {room.isOccupied && room.subject && (
                    <span className="text-[11px] font-bold truncate w-full px-2 mt-0.5 leading-none">
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
          onSuccess={fetchDayData}
        />
      )}
    </div>
  );
};
