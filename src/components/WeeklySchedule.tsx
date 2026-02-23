import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Plus, X, CheckCircle2 } from 'lucide-react';

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

const WeeklySchedule = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');

  // Dialog state
  const [allocateDialog, setAllocateDialog] = useState<{ open: boolean; roomId: string; slotStart: string; slotEnd: string } | null>(null);
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; routine: Routine; room: Room } | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDay]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: routineData }, { data: roomData }] = await Promise.all([
      supabase.from('routines').select('*').eq('day_of_week', selectedDay).order('start_time'),
      supabase.from('rooms').select('id, room_number, floor_number').order('room_number'),
    ]);
    setRoutines(routineData || []);
    setRooms(roomData || []);
    setLoading(false);
  };

  // Unique streams & batches for filters
  const streams = useMemo(() => [...new Set(routines.map(r => r.stream))], [routines]);
  const batches = useMemo(() => {
    const filtered = filterStream !== 'all' ? routines.filter(r => r.stream === filterStream) : routines;
    return [...new Set(filtered.map(r => r.batch))];
  }, [routines, filterStream]);

  // Build grid map: key = `${slotStart}_${roomId}` -> Routine[]
  const gridMap = useMemo(() => {
    const map: Record<string, Routine[]> = {};
    for (const routine of routines) {
      if (filterStream !== 'all' && routine.stream !== filterStream) continue;
      if (filterBatch !== 'all' && routine.batch !== filterBatch) continue;
      if (!routine.allocated_room_id) continue;

      for (const slot of TIME_SLOTS) {
        // Check overlap
        if (!(routine.end_time <= slot.start || routine.start_time >= slot.end)) {
          const key = `${slot.start}_${routine.allocated_room_id}`;
          if (!map[key]) map[key] = [];
          map[key].push(routine);
        }
      }
    }
    return map;
  }, [routines, filterStream, filterBatch]);

  // Unallocated routines for a given time slot
  const getUnallocatedRoutines = (slotStart: string, slotEnd: string) => {
    return routines.filter(r => {
      if (r.allocated_room_id) return false;
      if (filterStream !== 'all' && r.stream !== filterStream) return false;
      if (filterBatch !== 'all' && r.batch !== filterBatch) return false;
      return !(r.end_time <= slotStart || r.start_time >= slotEnd);
    });
  };

  // Stats
  const stats = useMemo(() => {
    let allocated = 0;
    let total = 0;
    for (const slot of TIME_SLOTS) {
      for (const room of rooms) {
        total++;
        const key = `${slot.start}_${room.id}`;
        if (gridMap[key]?.length) allocated++;
      }
    }
    return { total, allocated, free: total - allocated };
  }, [gridMap, rooms]);

  const allocateRoom = async (routineId: string, roomId: string) => {
    const routine = routines.find(r => r.id === routineId)!;
    // Check conflict
    const conflicting = routines.find(r =>
      r.id !== routineId &&
      r.allocated_room_id === roomId &&
      !(routine.end_time <= r.start_time || routine.start_time >= r.end_time)
    );
    if (conflicting) {
      toast.error('Room already allocated for overlapping time');
      return;
    }
    const { error } = await supabase.from('routines').update({ allocated_room_id: roomId }).eq('id', routineId);
    if (error) {
      toast.error('Failed to allocate room');
    } else {
      toast.success('Room allocated');
      setAllocateDialog(null);
      fetchData();
    }
  };

  const deallocateRoom = async (routineId: string) => {
    const { error } = await supabase.from('routines').update({ allocated_room_id: null }).eq('id', routineId);
    if (error) {
      toast.error('Failed to deallocate');
    } else {
      toast.success('Room deallocated');
      setDetailDialog(null);
      fetchData();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading schedule...</div>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Day Selector - segmented control */}
        <div className="inline-flex rounded-lg bg-muted p-1 gap-0.5">
          {DAYS.slice(1, 7).map((day, i) => (
            <button
              key={day}
              onClick={() => setSelectedDay(i + 1)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                selectedDay === i + 1
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Filter bar + Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterStream} onValueChange={(v) => { setFilterStream(v); setFilterBatch('all'); }}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Stream" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              {streams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterBatch} onValueChange={setFilterBatch}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-4 text-sm">
            <span className="text-muted-foreground">Total: <strong className="text-foreground">{stats.total}</strong></span>
            <span className="text-muted-foreground">Allocated: <strong className="text-destructive">{stats.allocated}</strong></span>
            <span className="text-muted-foreground">Free: <strong className="text-success">{stats.free}</strong></span>
          </div>
        </div>

        {/* Grid */}
        <div className="border rounded-lg overflow-auto max-h-[65vh]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr>
                <th className="sticky left-0 z-20 bg-card border-b border-r px-3 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">
                  Time
                </th>
                {rooms.map(room => (
                  <th key={room.id} className="border-b border-r px-2 py-2 text-center font-semibold text-foreground min-w-[120px] whitespace-nowrap">
                    {room.room_number}
                    <div className="text-[10px] font-normal text-muted-foreground">Floor {room.floor_number}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(slot => (
                <tr key={slot.start}>
                  <td className="sticky left-0 z-10 bg-card border-b border-r px-3 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {slot.label}
                  </td>
                  {rooms.map(room => {
                    const key = `${slot.start}_${room.id}`;
                    const cellRoutines = gridMap[key] || [];
                    const isConflict = cellRoutines.length > 1;
                    const routine = cellRoutines[0];

                    if (routine) {
                      return (
                        <td key={room.id} className="border-b border-r p-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setDetailDialog({ open: true, routine, room })}
                                className={`w-full h-full px-2 py-2 text-left transition-colors cursor-pointer ${
                                  isConflict
                                    ? 'bg-warning/20 hover:bg-warning/30 text-warning-foreground'
                                    : 'bg-destructive/10 hover:bg-destructive/20'
                                }`}
                              >
                                <div className="font-semibold text-xs truncate">{routine.subject}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{routine.stream} {routine.batch}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{routine.teacher_name}</div>
                                {isConflict && <div className="text-[10px] font-bold text-warning mt-0.5">⚠ Conflict</div>}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-semibold">{routine.subject}</p>
                              <p>{routine.stream} – {routine.batch}</p>
                              <p>{routine.teacher_name}</p>
                              <p>{routine.start_time} – {routine.end_time}</p>
                              {isConflict && <p className="text-warning font-bold">{cellRoutines.length} overlapping classes</p>}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    }

                    // Free cell
                    return (
                      <td key={room.id} className="border-b border-r p-0">
                        <button
                          onClick={() => setAllocateDialog({ open: true, roomId: room.id, slotStart: slot.start, slotEnd: slot.end })}
                          className="w-full h-full px-2 py-3 flex items-center justify-center bg-success/5 hover:bg-success/15 transition-colors cursor-pointer group"
                        >
                          <Plus className="h-4 w-4 text-success opacity-30 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Allocate Dialog */}
        {allocateDialog && (
          <Dialog open={allocateDialog.open} onOpenChange={(o) => !o && setAllocateDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Allocate Room</DialogTitle>
                <DialogDescription>
                  Select a class to assign to {rooms.find(r => r.id === allocateDialog.roomId)?.room_number} at {allocateDialog.slotStart}–{allocateDialog.slotEnd}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No unallocated classes for this time slot</p>
                ) : (
                  getUnallocatedRoutines(allocateDialog.slotStart, allocateDialog.slotEnd).map(r => (
                    <button
                      key={r.id}
                      onClick={() => allocateRoom(r.id, allocateDialog.roomId)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent/10 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-sm">{r.subject}</div>
                        <div className="text-xs text-muted-foreground">{r.stream} – {r.batch} | {r.teacher_name}</div>
                        <div className="text-xs text-muted-foreground">{r.start_time} – {r.end_time}</div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-success opacity-50" />
                    </button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Detail / Deallocate Dialog */}
        {detailDialog && (
          <Dialog open={detailDialog.open} onOpenChange={(o) => !o && setDetailDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Room {detailDialog.room.room_number}</DialogTitle>
                <DialogDescription>Allocation details</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Subject</div>
                  <div className="font-medium">{detailDialog.routine.subject}</div>
                  <div className="text-muted-foreground">Stream</div>
                  <div>{detailDialog.routine.stream}</div>
                  <div className="text-muted-foreground">Batch</div>
                  <div>{detailDialog.routine.batch}</div>
                  <div className="text-muted-foreground">Teacher</div>
                  <div>{detailDialog.routine.teacher_name}</div>
                  <div className="text-muted-foreground">Time</div>
                  <div>{detailDialog.routine.start_time} – {detailDialog.routine.end_time}</div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => deallocateRoom(detailDialog.routine.id)}
                >
                  <X className="h-4 w-4 mr-2" /> Deallocate Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
};

export default WeeklySchedule;
