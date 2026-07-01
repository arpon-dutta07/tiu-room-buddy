import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Plus, X, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
}

interface Room {
  id: string;
  room_number: string;
  floor_number: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = [
  { label: '9 – 10 AM', start: '09:00', end: '10:00' },
  { label: '10 – 11 AM', start: '10:00', end: '11:00' },
  { label: '11 – 12 PM', start: '11:00', end: '12:00' },
  { label: '12 – 1 PM', start: '12:00', end: '13:00' },
  { label: '1 – 2 PM', start: '13:00', end: '14:00' },
  { label: '2 – 3 PM', start: '14:00', end: '15:00' },
  { label: '3 – 4 PM', start: '15:00', end: '16:00' },
  { label: '4 – 5 PM', start: '16:00', end: '17:00' },
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

export const WeeklySchedule = () => {
  const [selectedDay, setSelectedDay] = useState(1); // Default Monday
  const [selectedFloor, setSelectedFloor] = useState(0); // Default Ground Floor
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  
  // All batches list from DB for proper filters
  const [allDbBatches, setAllDbBatches] = useState<any[]>([]);

  // Dialog state
  const [allocateDialog, setAllocateDialog] = useState<{ open: boolean; roomId: string; slotStart: string; slotEnd: string; day: number } | null>(null);
  const [selectedRoutineToAllocate, setSelectedRoutineToAllocate] = useState<string>('');
  const [selectedRoomToAllocate, setSelectedRoomToAllocate] = useState<string>('');
  
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; routine: Routine; room: Room | null } | null>(null);

  const fetchDbBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('stream, batch_name')
      .order('stream')
      .order('batch_name');
    if (data) {
      setAllDbBatches(data);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const roomQuery = supabase
        .from('rooms')
        .select('id, room_number, floor_number')
        .order('room_number');

      let routineQuery = supabase.from('routines').select('*');
      if (filterBatch === 'all') {
        routineQuery = routineQuery.eq('day_of_week', selectedDay);
      } else {
        routineQuery = routineQuery.eq('batch', filterBatch);
      }

      const [{ data: routineData }, { data: roomData }] = await Promise.all([
        routineQuery.order('start_time'),
        roomQuery
      ]);

      setRoutines(routineData || []);
      setRooms(roomData || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbBatches();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDay, filterBatch]);

  // Derived filter options
  const streams = useMemo(() => [...new Set(allDbBatches.map(b => b.stream))], [allDbBatches]);
  const batches = useMemo(() => {
    const filtered = filterStream !== 'all' ? allDbBatches.filter(b => b.stream === filterStream) : allDbBatches;
    return [...new Set(filtered.map(b => b.batch_name))];
  }, [allDbBatches, filterStream]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => r.floor_number === selectedFloor);
  }, [rooms, selectedFloor]);

  // Build grid map for the Floor Room Grid view (Only active when filterBatch === 'all')
  const gridMap = useMemo(() => {
    const map: Record<string, Routine[]> = {};
    if (filterBatch !== 'all') return map; // Batch Weekly view is rendered instead

    for (const routine of routines) {
      if (filterStream !== 'all' && routine.stream !== filterStream) continue;
      if (!routine.allocated_room_id) continue;

      const rStart = routine.start_time.slice(0, 5);
      const rEnd = routine.end_time.slice(0, 5);

      for (const slot of TIME_SLOTS) {
        if (!(rEnd <= slot.start || rStart >= slot.end)) {
          const key = `${slot.start}_${routine.allocated_room_id}`;
          if (!map[key]) map[key] = [];
          map[key].push(routine);
        }
      }
    }
    return map;
  }, [routines, filterStream, filterBatch]);

  // Finds which rooms are free at a specific day/slot
  const getFreeRoomsForSlot = (dayNum: number, slotStart: string, slotEnd: string) => {
    const busyRoomIds = routines
      .filter(r => {
        if (r.day_of_week !== dayNum || !r.allocated_room_id) return false;
        const rStart = r.start_time.slice(0, 5);
        const rEnd = r.end_time.slice(0, 5);
        return !(rEnd <= slotStart || rStart >= slotEnd);
      })
      .map(r => r.allocated_room_id);
    
    return rooms.filter(room => !busyRoomIds.includes(room.id));
  };

  const getUnallocatedRoutines = (slotStart: string, slotEnd: string, dayNum: number) => {
    return routines.filter(r => {
      if (r.allocated_room_id) return false;
      if (r.day_of_week !== dayNum) return false;
      if (filterStream !== 'all' && r.stream !== filterStream) return false;
      if (filterBatch !== 'all' && r.batch !== filterBatch) return false;
      
      const rStart = r.start_time.slice(0, 5);
      const rEnd = r.end_time.slice(0, 5);
      return !(rEnd <= slotStart || rStart >= slotEnd);
    });
  };

  const allocateRoom = async (routineId: string, roomId: string) => {
    const routine = routines.find(r => r.id === routineId)!;
    const rStart = routine.start_time.slice(0, 5);
    const rEnd = routine.end_time.slice(0, 5);
    
    const conflicting = routines.find(r => {
      if (r.id === routineId || r.allocated_room_id !== roomId || r.day_of_week !== routine.day_of_week) {
        return false;
      }
      const otherStart = r.start_time.slice(0, 5);
      const otherEnd = r.end_time.slice(0, 5);
      return !(rEnd <= otherStart || rStart >= otherEnd);
    });

    if (conflicting) {
      toast.error(`Room already allocated to ${conflicting.subject} (${conflicting.batch})`);
      return;
    }

    const { error } = await supabase
      .from('routines')
      .update({ allocated_room_id: roomId })
      .eq('id', routineId);

    if (error) {
      toast.error('Failed to allocate room');
    } else {
      toast.success('Room allocated successfully');
      setAllocateDialog(null);
      setSelectedRoutineToAllocate('');
      setSelectedRoomToAllocate('');
      fetchData();
    }
  };

  const deallocateRoom = async (routineId: string) => {
    const { error } = await supabase
      .from('routines')
      .update({ allocated_room_id: null })
      .eq('id', routineId);

    if (error) {
      toast.error('Failed to deallocate room');
    } else {
      toast.success('Room deallocated successfully');
      setDetailDialog(null);
      fetchData();
    }
  };

  // Stats computation
  const stats = useMemo(() => {
    let allocated = 0;
    let total = 0;
    if (filterBatch === 'all') {
      for (const slot of TIME_SLOTS) {
        for (const room of filteredRooms) {
          total++;
          const key = `${slot.start}_${room.id}`;
          if (gridMap[key]?.length) allocated++;
        }
      }
    } else {
      total = routines.length;
      allocated = routines.filter(r => r.allocated_room_id).length;
    }
    return { total, allocated, free: total - allocated };
  }, [gridMap, filteredRooms, routines, filterBatch]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground animate-pulse font-medium">Loading schedules...</div>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Header Filters & Selection */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-background/50 border border-glass p-5 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Select value={filterStream} onValueChange={(v) => { setFilterStream(v); setFilterBatch('all'); }}>
              <SelectTrigger className="w-full sm:w-44 h-10 bg-background/50 border-glass rounded-xl"><SelectValue placeholder="Select Stream" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {streams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="w-full sm:w-44 h-10 bg-background/50 border-glass rounded-xl"><SelectValue placeholder="Select Batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Floor Selector - Only visible when viewing Room Grid */}
            {filterBatch === 'all' && (
              <Select value={selectedFloor.toString()} onValueChange={(v) => setSelectedFloor(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-44 h-10 bg-background/50 border-glass rounded-xl"><SelectValue placeholder="Select Floor" /></SelectTrigger>
                <SelectContent>
                  {FLOORS.map(f => <SelectItem key={f.value} value={f.value.toString()}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-4 text-xs font-bold text-muted-foreground bg-background/60 border border-glass px-4 py-2.5 rounded-xl w-full sm:w-auto justify-center">
            {filterBatch === 'all' ? (
              <>
                <span>Floor Cells: <strong className="text-foreground font-mono-data">{stats.total}</strong></span>
                <span className="w-px h-3.5 bg-glass" />
                <span>Occupied: <strong className="text-primary font-mono-data">{stats.allocated}</strong></span>
                <span className="w-px h-3.5 bg-glass" />
                <span>Free Slots: <strong className="text-emerald-600 dark:text-emerald-400 font-mono-data">{stats.free}</strong></span>
              </>
            ) : (
              <>
                <span>Total Classes: <strong className="text-foreground font-mono-data">{stats.total}</strong></span>
                <span className="w-px h-3.5 bg-glass" />
                <span>Allocated: <strong className="text-emerald-600 dark:text-emerald-400 font-mono-data">{stats.allocated}</strong></span>
                <span className="w-px h-3.5 bg-glass" />
                <span>Unallocated: <strong className="text-primary font-mono-data">{stats.free}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Display: Batch Timetable OR Room Allocation Grid */}
        {filterBatch !== 'all' ? (
          /* ====================================================
             VIEW A: BATCH Timetable (Weekly Grid View)
             Columns: Monday -> Saturday
             ==================================================== */
          <div className="border border-glass rounded-2xl overflow-auto shadow-inner bg-background/20">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/30 border-b border-glass">
                <tr>
                  <th className="p-3.5 text-left font-bold text-muted-foreground border-r border-glass w-[120px] font-display">Time</th>
                  {DAYS.slice(1, 7).map((day) => (
                    <th key={day} className="p-3.5 text-center font-bold text-foreground border-r border-glass last:border-0 min-w-[140px] font-display">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, sIdx) => (
                  <tr 
                    key={slot.start} 
                    className={cn(
                      "border-b border-glass last:border-0 hover:bg-muted/10 transition-colors duration-150",
                      sIdx % 2 === 0 ? "bg-background/20" : "bg-muted/5"
                    )}
                  >
                    <td className="p-3 font-bold text-muted-foreground border-r border-glass bg-card/60 font-mono-data text-xs">
                      {slot.label}
                    </td>
                    {DAYS.slice(1, 7).map((day, dayIndex) => {
                      const dayNum = dayIndex + 1;
                      const cellRoutines = routines.filter(r => {
                        if (r.day_of_week !== dayNum) return false;
                        const rStart = r.start_time.slice(0, 5);
                        const rEnd = r.end_time.slice(0, 5);
                        return !(rEnd <= slot.start || rStart >= slot.end);
                      });
                      const routine = cellRoutines[0];

                      return (
                        <td key={day} className="p-1.5 text-center border-r border-glass last:border-0 align-middle h-24 min-h-[96px]">
                          {routine ? (
                            <motion.button
                              whileHover={{ scale: 1.03, y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                const roomObj = rooms.find(r => r.id === routine.allocated_room_id) || null;
                                setDetailDialog({ open: true, routine, room: roomObj });
                              }}
                              className={cn(
                                "w-full h-full p-3 text-left rounded-xl border flex flex-col justify-between transition-smooth shadow-sm relative overflow-hidden",
                                routine.allocated_room_id 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:shadow-emerald-500/5'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300 hover:shadow-rose-500/5'
                              )}
                            >
                              <div className="font-extrabold text-xs truncate leading-none mb-1 text-foreground">{routine.subject}</div>
                              <div className="text-[10px] opacity-75 font-semibold truncate text-muted-foreground">{routine.teacher_name}</div>
                              <div className="flex justify-between items-center mt-1.5 w-full">
                                <span className={cn(
                                  "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                  routine.allocated_room_id 
                                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                                    : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                                )}>
                                  {routine.allocated_room_id 
                                    ? rooms.find(r => r.id === routine.allocated_room_id)?.room_number 
                                    : 'No Room'}
                                </span>
                                <span className="text-[9px] font-mono-data text-muted-foreground">
                                  {routine.start_time.slice(0, 5)} - {routine.end_time.slice(0, 5)}
                                </span>
                              </div>
                            </motion.button>
                          ) : (
                            <button
                              onClick={() => setAllocateDialog({ open: true, roomId: '', slotStart: slot.start, slotEnd: slot.end, day: dayNum })}
                              className="w-full h-full flex items-center justify-center border border-dashed border-muted-foreground/20 hover:border-solid hover:bg-emerald-500/5 hover:border-emerald-500/20 text-muted-foreground/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-smooth rounded-xl group"
                            >
                              <Plus className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ====================================================
             VIEW B: ROOM Allocation Matrix (Pivoted Room-centric View)
             Rows: Rooms on Selected Floor
             Columns: Time Slots
             ==================================================== */
          <div className="space-y-4">
            {/* Day selector at top of Room Grid */}
            <div className="flex gap-1.5 p-1 bg-background/60 border border-glass rounded-2xl flex-wrap inline-flex">
              {DAYS.slice(1, 7).map((day, i) => {
                const isActive = selectedDay === i + 1;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(i + 1)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 select-none focus:outline-none",
                      isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeScheduleDayPill"
                        className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-md shadow-primary/10"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                    <span className="relative z-10">{day}</span>
                  </button>
                );
              })}
            </div>

            <div className="border border-glass rounded-2xl overflow-auto max-h-[70vh] shadow-inner bg-background/20">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-glass bg-muted/30">
                    <th className="sticky left-0 z-20 bg-card border-r border-glass p-3.5 text-left font-bold text-muted-foreground border-b min-w-[160px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] font-display">
                      Room
                    </th>
                    {TIME_SLOTS.map(slot => (
                      <th key={slot.start} className="border-r border-glass px-3 py-3 text-center font-bold text-foreground border-b last:border-r-0 min-w-[150px] whitespace-nowrap font-display">
                        {slot.label}
                        <div className="text-[10px] font-mono-data font-normal text-muted-foreground mt-0.5">
                          {slot.start.slice(0, 5)} - {slot.end.slice(0, 5)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room, rIdx) => (
                    <tr 
                      key={room.id} 
                      className={cn(
                        "border-b border-glass last:border-0 hover:bg-muted/10 transition-colors duration-150",
                        rIdx % 2 === 0 ? "bg-background/20" : "bg-muted/5"
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-card border-r border-glass p-3.5 font-bold text-foreground whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        <span className="block font-bold text-sm text-foreground font-mono-data">{room.room_number}</span>
                        <span className="block text-[10px] text-muted-foreground font-semibold capitalize mt-0.5">
                          Floor {room.floor_number} • {room.room_type || 'classroom'}
                        </span>
                      </td>
                      {TIME_SLOTS.map(slot => {
                        const key = `${slot.start}_${room.id}`;
                        const cellRoutines = gridMap[key] || [];
                        const routine = cellRoutines[0];
                        const isConflict = cellRoutines.length > 1;

                        return (
                          <td key={slot.start} className="border-r border-glass last:border-r-0 p-1.5 align-middle h-24 min-h-[96px]">
                            {routine ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.03, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setDetailDialog({ open: true, routine, room })}
                                    className={cn(
                                      "w-full h-full p-2.5 text-left rounded-xl border transition-smooth flex flex-col justify-between hover:shadow-sm relative overflow-hidden",
                                      isConflict
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300 hover:shadow-amber-500/5'
                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:shadow-emerald-500/5'
                                    )}
                                  >
                                    <div className="font-extrabold text-xs truncate leading-none mb-0.5 text-foreground">{routine.subject}</div>
                                    <div className="text-[10px] font-bold opacity-80 truncate text-muted-foreground">{routine.stream} {routine.batch}</div>
                                    <div className="text-[9px] opacity-75 truncate text-muted-foreground mt-0.5">{routine.teacher_name}</div>
                                    {isConflict && (
                                      <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                        ⚠ {cellRoutines.length} Overlaps
                                      </span>
                                    )}
                                  </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[240px] p-3.5 space-y-1.5 shadow-xl bg-glass border border-glass backdrop-blur-md text-foreground rounded-xl">
                                  <p className="font-bold text-sm font-display">{routine.subject}</p>
                                  <p className="text-xs text-muted-foreground">{routine.stream} – {routine.batch}</p>
                                  <p className="text-xs">Teacher: <span className="font-semibold">{routine.teacher_name}</span></p>
                                  <p className="text-xs font-mono-data">Time: <span className="font-medium">{routine.start_time.slice(0, 5)} – {routine.end_time.slice(0, 5)}</span></p>
                                  {isConflict && (
                                    <p className="text-amber-500 font-extrabold text-xs pt-1.5 border-t border-glass mt-1.5">
                                      ⚠ {cellRoutines.length} overlapping classes scheduled here!
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <button
                                onClick={() => setAllocateDialog({ open: true, roomId: room.id, slotStart: slot.start, slotEnd: slot.end, day: selectedDay })}
                                className="w-full h-full flex items-center justify-center border border-dashed border-muted-foreground/20 hover:border-solid hover:bg-emerald-500/5 hover:border-emerald-500/20 text-muted-foreground/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-smooth rounded-xl group"
                              >
                                <Plus className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Allocate Dialog */}
        {allocateDialog && (
          <Dialog open={allocateDialog.open} onOpenChange={(o) => !o && setAllocateDialog(null)}>
            <DialogContent className="max-w-md bg-glass border-glass rounded-3xl shadow-2xl backdrop-blur-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-display">Allocate Room</DialogTitle>
                <DialogDescription className="font-sans">
                  Schedule a class on <strong className="text-foreground">{DAYS[allocateDialog.day]}</strong> at <strong className="text-foreground font-mono-data">{allocateDialog.slotStart.slice(0, 5)} – {allocateDialog.slotEnd.slice(0, 5)}</strong>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                {/* Flow A: Room was selected, choose an unallocated routine */}
                {allocateDialog.roomId ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold mb-2 block font-display">
                      Select Class for Room <strong className="text-primary font-mono-data">{rooms.find(r => r.id === allocateDialog.roomId)?.room_number}</strong>
                    </Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd, allocateDialog.day).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center bg-muted/10 border border-glass rounded-xl italic font-sans">
                          No unallocated routines for this time slot.
                        </p>
                      ) : (
                        getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd, allocateDialog.day).map(r => (
                          <motion.button
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            key={r.id}
                            onClick={() => allocateRoom(r.id, allocateDialog.roomId)}
                            className="w-full text-left p-3.5 rounded-xl border hover:bg-glass/85 transition-all flex items-center justify-between border-glass bg-background/40 hover:border-primary"
                          >
                            <div>
                              <div className="font-extrabold text-sm text-foreground">{r.subject}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 font-medium">{r.stream} – {r.batch} | {r.teacher_name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono-data mt-1.5">{r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}</div>
                            </div>
                            <Check className="h-4 w-4 text-emerald-500 opacity-80" />
                          </motion.button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* Flow B: Batch was selected, choose unallocated routine + room */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="routine-select" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1 block">1. Select Unallocated Class</Label>
                      <Select value={selectedRoutineToAllocate} onValueChange={setSelectedRoutineToAllocate}>
                        <SelectTrigger id="routine-select" className="bg-background/50 border-glass rounded-xl h-11">
                          <SelectValue placeholder="Choose routine..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd, allocateDialog.day).map(r => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.subject} ({r.stream} - {r.batch}) | {r.teacher_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd, allocateDialog.day).length === 0 && (
                        <p className="text-xs text-muted-foreground italic mt-1 font-sans">No unallocated classes for this slot.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room-select" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1 block">2. Select Free Room</Label>
                      <Select 
                        value={selectedRoomToAllocate} 
                        onValueChange={setSelectedRoomToAllocate}
                        disabled={!selectedRoutineToAllocate}
                      >
                        <SelectTrigger id="room-select" className="bg-background/50 border-glass rounded-xl h-11">
                          <SelectValue placeholder="Choose free room..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getFreeRoomsForSlot(allocateDialog.day, allocateDialog.slotStart, allocateDialog.slotEnd).map(room => (
                            <SelectItem key={room.id} value={room.id}>
                              Room {room.room_number} (Floor {room.floor_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      className="w-full bg-primary hover:bg-primary/95 text-white font-semibold shadow-lg shadow-primary/10 active:scale-95 transition-transform h-11 rounded-xl mt-4" 
                      disabled={!selectedRoutineToAllocate || !selectedRoomToAllocate}
                      onClick={() => allocateRoom(selectedRoutineToAllocate, selectedRoomToAllocate)}
                    >
                      Allocate Selected Room
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Detail / Deallocate Dialog */}
        {detailDialog && (
          <Dialog open={detailDialog.open} onOpenChange={(o) => !o && setDetailDialog(null)}>
            <DialogContent className="max-w-sm bg-glass border-glass rounded-3xl shadow-2xl backdrop-blur-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-display text-foreground">
                  Room {detailDialog.room?.room_number || 'Unallocated'}
                </DialogTitle>
                <DialogDescription>Class assignment details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-y border-glass/60 py-3.5">
                  <div className="text-muted-foreground font-bold font-display">Subject</div>
                  <div className="font-extrabold text-foreground text-right">{detailDialog.routine.subject}</div>
                  
                  <div className="text-muted-foreground font-bold font-display">Stream / Batch</div>
                  <div className="text-right font-medium">{detailDialog.routine.stream} — {detailDialog.routine.batch}</div>
                  
                  <div className="text-muted-foreground font-bold font-display">Teacher</div>
                  <div className="text-right font-medium">{detailDialog.routine.teacher_name}</div>
                  
                  <div className="text-muted-foreground font-bold font-display">Day & Time</div>
                  <div className="text-right text-xs font-bold font-mono-data text-primary">
                    {DAYS[detailDialog.routine.day_of_week]} | {detailDialog.routine.start_time.slice(0, 5)} – {detailDialog.routine.end_time.slice(0, 5)}
                  </div>
                </div>
                
                {detailDialog.routine.allocated_room_id && (
                  <Button
                    variant="destructive"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md active:scale-95 transition-transform h-11 rounded-xl"
                    onClick={() => deallocateRoom(detailDialog.routine.id)}
                  >
                    <X className="h-4 w-4 mr-2" /> Deallocate Room
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
};

export default WeeklySchedule;
