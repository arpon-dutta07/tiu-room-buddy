import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuickAllocateDialog } from './QuickAllocateDialog';
import { TeacherBookRoomDialog } from './TeacherBookRoomDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

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
  isInstant?: boolean;
  bookingExpiresAt?: string | null;
}

interface FloorRoomGridProps {
  onRoomClick: (room: Room) => void;
  isAdmin?: boolean;
}

const CountdownTimer = ({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        onExpire();
        return 'Expired';
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${mins}m ${secs}s left`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <span className="text-[9px] font-mono font-bold tracking-tight text-amber-600 dark:text-amber-300 animate-pulse block mt-0.5">
      ⚡ {timeLeft}
    </span>
  );
};

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
  
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [allRoutines, setAllRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [selectedRoomForAllocation, setSelectedRoomForAllocation] = useState<Room | null>(null);
  const [bookRoomDialogOpen, setBookRoomDialogOpen] = useState(false);

  const fetchDayData = async () => {
    setLoading(true);
    try {
      // 1. Clean up expired special/instant special bookings before displaying
      const now = new Date();
      const { data: instantRoutines } = await supabase
        .from('routines')
        .select('*')
        .eq('is_instant', true);

      if (instantRoutines) {
        for (const r of instantRoutines) {
          if (r.booking_expires_at && new Date(r.booking_expires_at) < now) {
            await supabase
              .from('routines')
              .update({ allocated_room_id: null, is_instant: false })
              .eq('id', r.id);
          }
        }
      }

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
        isInstant: occupyingRoutine?.is_instant || false,
        bookingExpiresAt: occupyingRoutine?.booking_expires_at || null,
      };
    });
  };

  const roomsToRender = getRoomsWithAvailability();

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <Card className="bg-glass border-glass shadow-lg rounded-3xl relative overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2 flex-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Select Day</label>
            <div className="flex gap-1.5 p-1 bg-background/60 border border-glass rounded-2xl flex-wrap">
              {DAYS.map((day, index) => {
                const isActive = selectedDay === index + 1;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(index + 1)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 select-none focus:outline-none",
                      isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeDayPill"
                        className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-md shadow-primary/10"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                    <span className="relative z-10">{day}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setBookRoomDialogOpen(true)}
              className="bg-primary hover:bg-primary/95 text-white font-semibold shadow-lg shadow-primary/10 active:scale-95 transition-transform h-11 rounded-xl px-6 self-start md:self-center w-full md:w-auto mt-2 md:mt-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book a Room
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Floor & Time Availability Matrix */}
      <Card className="border-glass bg-glass shadow-lg rounded-3xl overflow-hidden relative">
        <CardHeader className="bg-muted/10 border-b border-glass pb-4">
          <CardTitle className="text-xl font-bold font-display">
            Master Availability Matrix ({DAYS[selectedDay - 1]})
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Click on any cell to view detailed room status below. Colors represent floor occupancies.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse font-medium">Loading availability grid...</div>
          ) : allRooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-background/30 rounded-2xl">No rooms defined in system. Please add rooms.</div>
          ) : (
            <div className="overflow-x-auto border border-glass rounded-2xl shadow-inner bg-background/20">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-glass">
                    <th className="p-3 text-left font-bold sticky left-0 bg-card border-r border-glass min-w-[125px] font-display">Floor</th>
                    {TIME_SLOTS.map((slot) => (
                      <th key={slot.id} className="p-3 text-center font-bold min-w-[100px] font-display">{slot.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FLOORS.map((floor, fIdx) => (
                    <motion.tr 
                      key={floor.value} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: fIdx * 0.04 }}
                      className={cn(
                        "border-b border-glass last:border-0 hover:bg-muted/15 transition-colors duration-150",
                        fIdx % 2 === 0 ? "bg-background/20" : "bg-muted/5"
                      )}
                    >
                      <td className="p-3 font-bold sticky left-0 bg-card border-r border-glass font-display text-foreground">
                        {floor.label}
                      </td>
                      {TIME_SLOTS.map((slot) => {
                        const stats = getFloorSlotStats(floor.value, slot);
                        const isSelected = selectedFloor === floor.value && selectedTimeSlot.id === slot.id;
                        
                        let colorClass = 'bg-muted/40 text-muted-foreground border-transparent cursor-not-allowed';
                        if (stats.total > 0) {
                          if (stats.occupied === 0) {
                            colorClass = 'status-high';
                          } else if (stats.free === 0) {
                            colorClass = 'status-low';
                          } else {
                            colorClass = 'status-mid';
                          }
                        }

                        return (
                          <td key={slot.id} className="p-2 text-center">
                            {stats.total > 0 ? (
                              <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                  setSelectedFloor(floor.value);
                                  setSelectedTimeSlot(slot);
                                }}
                                className={cn(
                                  "w-full px-2 py-2 rounded-xl text-xs font-bold transition-all select-none border border-transparent shadow-sm font-mono-data hover:shadow-md",
                                  colorClass,
                                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg z-10 scale-[1.03]"
                                )}
                              >
                                {stats.free}/{stats.total} Free
                              </motion.button>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">-</span>
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Detail Grid */}
      <Card className="border-glass bg-glass shadow-lg rounded-3xl overflow-hidden relative">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-glass bg-muted/10">
          <div>
            <CardTitle className="text-xl font-bold font-display text-foreground">
              {FLOORS.find((f) => f.value === selectedFloor)?.label} — {selectedTimeSlot.label} ({DAYS[selectedDay - 1]})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Rooms status for the selected matrix cell. Green is free, red is occupied.
            </p>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full"></div>
              <span className="text-emerald-700 dark:text-emerald-400">Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-rose-500/20 border border-rose-500/30 rounded-full"></div>
              <span className="text-rose-700 dark:text-rose-400">Occupied</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse font-medium">Loading room status...</div>
          ) : roomsToRender.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 border border-glass rounded-2xl">
              No rooms defined on this floor. Use the "Manage Rooms" tab to add some.
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.03 }}
            >
              {roomsToRender.map((room) => (
                <motion.button
                  key={room.id}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (isAdmin) {
                      setSelectedRoomForAllocation(room);
                      setAllocateDialogOpen(true);
                    } else {
                      onRoomClick(room);
                    }
                  }}
                  className={cn(
                    'h-24 flex flex-col items-center justify-center gap-1 transition-smooth border rounded-2xl shadow-sm font-semibold relative overflow-hidden',
                    room.isOccupied
                      ? room.isInstant
                        ? 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/5 animate-[pulse_1.8s_infinite]'
                        : 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:shadow-rose-500/5'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:shadow-emerald-500/5'
                  )}
                >
                  <span className="text-xl font-bold font-mono-data tracking-tight leading-none mb-1">{room.room_number}</span>
                  <span className={cn(
                    "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full",
                    room.isOccupied 
                      ? room.isInstant
                        ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                        : "bg-rose-500/20 text-rose-800 dark:text-rose-300"
                      : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                  )}>
                    {room.isOccupied ? room.isInstant ? 'Special' : 'Occupied' : 'Free'}
                  </span>
                  {room.isOccupied && room.isInstant && room.bookingExpiresAt && (
                    <CountdownTimer expiresAt={room.bookingExpiresAt} onExpire={fetchDayData} />
                  )}
                  {room.isOccupied && !room.isInstant && room.subject && (
                    <span className="text-[10px] font-medium text-muted-foreground truncate w-full px-3 mt-1 text-center">
                      {room.subject}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
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

      {isAdmin && (
        <TeacherBookRoomDialog
          open={bookRoomDialogOpen}
          onOpenChange={setBookRoomDialogOpen}
          onSuccess={fetchDayData}
          defaultFloor={selectedFloor}
          defaultDay={selectedDay}
          defaultSlot={selectedTimeSlot.id.toString()}
        />
      )}
    </div>
  );
};
