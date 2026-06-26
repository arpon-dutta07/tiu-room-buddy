import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Plus, X, Calendar, Landmark, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
    // A room is free if no routine is scheduled in it on this day that overlaps with this slot
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
    
    // Safety check: is the room already booked at this time?
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
      // For batch weekly view: count classes in the schedule
      total = routines.length;
      allocated = routines.filter(r => r.allocated_room_id).length;
    }
    return { total, allocated, free: total - allocated };
  }, [gridMap, filteredRooms, routines, filterBatch]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground animate-pulse">Loading schedules...</div>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header Filters & Selection */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterStream} onValueChange={(v) => { setFilterStream(v); setFilterBatch('all'); }}>
              <SelectTrigger className="w-44 h-10"><SelectValue placeholder="Select Stream" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {streams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger className="w-44 h-10"><SelectValue placeholder="Select Batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Floor Selector - Only visible when viewing Room Grid */}
            {filterBatch === 'all' && (
              <Select value={selectedFloor.toString()} onValueChange={(v) => setSelectedFloor(parseInt(v))}>
                <SelectTrigger className="w-44 h-10"><SelectValue placeholder="Select Floor" /></SelectTrigger>
                <SelectContent>
                  {FLOORS.map(f => <SelectItem key={f.value} value={f.value.toString()}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-4 text-xs font-semibold text-muted-foreground bg-background px-3 py-2 rounded border">
            {filterBatch === 'all' ? (
              <>
                <span>Floor Cells: <strong className="text-foreground">{stats.total}</strong></span>
                <span>Occupied: <strong className="text-destructive">{stats.allocated}</strong></span>
                <span>Free Slots: <strong className="text-green-600">{stats.free}</strong></span>
              </>
            ) : (
              <>
                <span>Total Classes: <strong className="text-foreground">{stats.total}</strong></span>
                <span>Allocated Room: <strong className="text-green-600">{stats.allocated}</strong></span>
                <span>Unallocated: <strong className="text-destructive">{stats.free}</strong></span>
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
          <div className="border rounded-lg overflow-auto shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold text-muted-foreground border-r w-[120px]">Time</th>
                  {DAYS.slice(1, 7).map((day, i) => (
                    <th key={day} className="p-3 text-center font-semibold text-foreground border-r last:border-0 min-w-[130px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot.start} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="p-3 font-medium text-muted-foreground border-r bg-muted/20">
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
                        <td key={day} className="p-1 text-center border-r last:border-0 align-middle h-20 min-h-[80px]">
                          {routine ? (
                            <button
                              onClick={() => {
                                const roomObj = rooms.find(r => r.id === routine.allocated_room_id) || null;
                                setDetailDialog({ open: true, routine, room: roomObj });
                              }}
                              className={`w-full h-full p-2.5 text-left rounded-md border flex flex-col justify-between transition-all hover:shadow-sm ${
                                routine.allocated_room_id 
                                  ? 'bg-green-500/10 border-green-500/20 text-green-950 dark:text-green-300 hover:bg-green-500/15'
                                  : 'bg-destructive/10 border-destructive/20 text-destructive dark:text-red-300 hover:bg-destructive/15'
                              }`}
                            >
                              <div className="font-bold text-xs truncate leading-none mb-1">{routine.subject}</div>
                              <div className="text-[10px] opacity-80 font-medium truncate">{routine.teacher_name}</div>
                              <div className="flex justify-between items-center mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  routine.allocated_room_id 
                                    ? 'bg-green-500/20 text-green-700 dark:bg-green-500/40 dark:text-green-200' 
                                    : 'bg-destructive/20 text-destructive dark:bg-destructive/40 dark:text-red-200'
                                }`}>
                                  {routine.allocated_room_id 
                                    ? rooms.find(r => r.id === routine.allocated_room_id)?.room_number 
                                    : 'No Room'}
                                </span>
                                <span className="text-[9px] text-muted-foreground">{routine.start_time.slice(0, 5)} - {routine.end_time.slice(0, 5)}</span>
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={() => setAllocateDialog({ open: true, roomId: '', slotStart: slot.start, slotEnd: slot.end, day: dayNum })}
                              className="w-full h-full flex items-center justify-center border border-dashed hover:border-solid hover:bg-muted/30 rounded-md text-muted-foreground/40 hover:text-muted-foreground/80 transition-all group"
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
            <div className="inline-flex rounded-lg bg-muted p-1 gap-0.5 border">
              {DAYS.slice(1, 7).map((day, i) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(i + 1)}
                  className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${
                    selectedDay === i + 1
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="border rounded-lg overflow-auto max-h-[70vh] shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b bg-muted/30">
                    <th className="sticky left-0 z-20 bg-card border-r p-3 text-left font-semibold text-muted-foreground min-w-[150px] border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Room
                    </th>
                    {TIME_SLOTS.map(slot => (
                      <th key={slot.start} className="border-r px-3 py-3 text-center font-bold text-foreground min-w-[140px] whitespace-nowrap border-b last:border-r-0">
                        {slot.label}
                        <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                          {slot.start.slice(0, 5)} - {slot.end.slice(0, 5)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map(room => (
                    <tr key={room.id} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                      <td className="sticky left-0 z-10 bg-card border-r p-3 font-semibold text-foreground whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <span className="block font-bold text-sm text-foreground">{room.room_number}</span>
                        <span className="block text-[10px] text-muted-foreground font-normal capitalize">
                          Floor {room.floor_number} • {room.room_type || 'classroom'}
                        </span>
                      </td>
                      {TIME_SLOTS.map(slot => {
                        const key = `${slot.start}_${room.id}`;
                        const cellRoutines = gridMap[key] || [];
                        const routine = cellRoutines[0];
                        const isConflict = cellRoutines.length > 1;

                        return (
                          <td key={slot.start} className="border-r last:border-r-0 p-1.5 align-middle h-20 min-h-[80px]">
                            {routine ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setDetailDialog({ open: true, routine, room })}
                                    className={`w-full h-full p-2 text-left rounded border transition-all flex flex-col justify-between hover:shadow-sm ${
                                      isConflict
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-950 dark:text-amber-300 hover:bg-amber-500/15'
                                        : 'bg-green-500/10 border-green-500/20 text-green-950 dark:text-green-300 hover:bg-green-500/15'
                                    }`}
                                  >
                                    <div className="font-bold text-xs truncate leading-none mb-1 text-foreground">{routine.subject}</div>
                                    <div className="text-[10px] font-medium opacity-85 truncate text-muted-foreground">{routine.stream} {routine.batch}</div>
                                    <div className="text-[10px] opacity-80 truncate text-muted-foreground">{routine.teacher_name}</div>
                                    {isConflict && (
                                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                        ⚠ {cellRoutines.length} Overlaps
                                      </span>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[240px] p-3 space-y-1.5 shadow-md">
                                  <p className="font-bold text-sm">{routine.subject}</p>
                                  <p className="text-xs text-muted-foreground">{routine.stream} – {routine.batch}</p>
                                  <p className="text-xs">Teacher: <span className="font-medium">{routine.teacher_name}</span></p>
                                  <p className="text-xs">Time: <span className="font-medium">{routine.start_time.slice(0, 5)} – {routine.end_time.slice(0, 5)}</span></p>
                                  {isConflict && (
                                    <p className="text-amber-500 font-bold text-xs pt-1 border-t mt-1">
                                      ⚠ {cellRoutines.length} overlapping classes scheduled here!
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <button
                                onClick={() => setAllocateDialog({ open: true, roomId: room.id, slotStart: slot.start, slotEnd: slot.end, day: selectedDay })}
                                className="w-full h-full flex items-center justify-center border border-dashed border-muted-foreground/20 hover:border-solid hover:bg-green-500/5 hover:border-green-500/20 text-muted-foreground/30 hover:text-green-600 dark:hover:text-green-400 transition-all rounded group"
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Allocate Room</DialogTitle>
                <DialogDescription>
                  Schedule a class on **{DAYS[allocateDialog.day]}** at **{allocateDialog.slotStart.slice(0, 5)} – {allocateDialog.slotEnd.slice(0, 5)}**
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                {/* Flow A: Room was selected, choose an unallocated routine */}
                {allocateDialog.roomId ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold mb-1 block">
                      Select Class for Room **{rooms.find(r => r.id === allocateDialog.roomId)?.room_number}**
                    </Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd, allocateDialog.day).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center bg-muted/20 rounded-md">
                          No unallocated routines for this time slot.
                        </p>
                      ) : (
                        getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd, allocateDialog.day).map(r => (
                          <button
                            key={r.id}
                            onClick={() => allocateRoom(r.id, allocateDialog.roomId)}
                            className="w-full text-left p-3 rounded-lg border hover:bg-accent/15 transition-all flex items-center justify-between border-muted-foreground/20 hover:border-primary"
                          >
                            <div>
                              <div className="font-semibold text-sm text-foreground">{r.subject}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{r.stream} – {r.batch} | {r.teacher_name}</div>
                              <div className="text-[10px] text-muted-foreground font-medium mt-1">{r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}</div>
                            </div>
                            <Check className="h-4 w-4 text-green-500 opacity-60" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* Flow B: Batch was selected, choose unallocated routine + room */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="routine-select">1. Select Unallocated Class</Label>
                      <Select value={selectedRoutineToAllocate} onValueChange={setSelectedRoutineToAllocate}>
                        <SelectTrigger id="routine-select">
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
                        <p className="text-xs text-muted-foreground">No unallocated classes for this slot.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room-select">2. Select Free Room</Label>
                      <Select 
                        value={selectedRoomToAllocate} 
                        onValueChange={setSelectedRoomToAllocate}
                        disabled={!selectedRoutineToAllocate}
                      >
                        <SelectTrigger id="room-select">
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
                      className="w-full mt-2" 
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
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Room {detailDialog.room?.room_number || 'Unallocated'}</DialogTitle>
                <DialogDescription>Class assignment details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-sm border-y py-3">
                  <div className="text-muted-foreground font-medium">Subject</div>
                  <div className="font-bold text-foreground text-right">{detailDialog.routine.subject}</div>
                  
                  <div className="text-muted-foreground font-medium">Stream / Batch</div>
                  <div className="text-right">{detailDialog.routine.stream} — {detailDialog.routine.batch}</div>
                  
                  <div className="text-muted-foreground font-medium">Teacher</div>
                  <div className="text-right">{detailDialog.routine.teacher_name}</div>
                  
                  <div className="text-muted-foreground font-medium">Day & Time</div>
                  <div className="text-right text-xs font-semibold">
                    {DAYS[detailDialog.routine.day_of_week]} | {detailDialog.routine.start_time.slice(0, 5)} – {detailDialog.routine.end_time.slice(0, 5)}
                  </div>
                </div>
                
                {detailDialog.routine.allocated_room_id && (
                  <Button
                    variant="destructive"
                    className="w-full"
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
