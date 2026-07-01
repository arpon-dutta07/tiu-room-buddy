import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface TeacherBookRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultFloor?: number;
  defaultDay?: number;
  defaultSlot?: string;
}

interface Conflict {
  type: 'teacher' | 'batch';
  message: string;
  room: string;
}

const FLOORS_LIST = [
  { value: 0, label: 'Ground Floor' },
  { value: 1, label: '1st Floor' },
  { value: 2, label: '2nd Floor' },
  { value: 3, label: '3rd Floor' },
  { value: 4, label: '4th Floor' },
  { value: 5, label: '5th Floor' },
  { value: 6, label: '6th Floor' },
  { value: 7, label: '7th Floor' },
];

const DAYS_LIST = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

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

export const TeacherBookRoomDialog = ({
  open,
  onOpenChange,
  onSuccess,
  defaultFloor = 0,
  defaultDay = 1,
  defaultSlot = '1',
}: TeacherBookRoomDialogProps) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  
  // Selection States
  const [selectedFloor, setSelectedFloor] = useState(defaultFloor.toString());
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedDay, setSelectedDay] = useState(defaultDay.toString());
  const [selectedSlotId, setSelectedSlotId] = useState(defaultSlot);
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [isInstant, setIsInstant] = useState(false);
  const [instantDuration, setInstantDuration] = useState('30');
  
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRooms();
      fetchBatches();
      
      // Load pre-selected dashboard values
      setSelectedFloor(defaultFloor.toString());
      setSelectedDay(defaultDay.toString());
      setSelectedSlotId(defaultSlot);
      
      // Reset input fields
      setSelectedRoomId('');
      setSubject('');
      setTeacherName('');
      setSelectedStream('');
      setSelectedBatch('');
      setIsInstant(false);
      setInstantDuration('30');
      setConflicts([]);
    }
  }, [open, defaultFloor, defaultDay, defaultSlot]);

  // Check conflicts when room, day, slot, batch, or teacher changes
  useEffect(() => {
    if (open && (selectedRoomId || selectedBatch || teacherName)) {
      checkConflicts();
    }
  }, [selectedRoomId, selectedDay, selectedSlotId, selectedBatch, teacherName, selectedStream]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number');

    if (error) {
      console.error('Error fetching rooms:', error);
    } else {
      setRooms(data || []);
    }
  };

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('routines')
      .select('stream, batch')
      .order('stream')
      .order('batch');

    if (error) {
      console.error('Error fetching batches:', error);
    } else {
      const uniqueStreams = [...new Set(data?.map((r) => r.stream) || [])];
      setStreams(uniqueStreams);
      setBatches(data || []);
    }
  };

  const checkConflicts = async () => {
    const dayNum = parseInt(selectedDay, 10);
    const slot = TIME_SLOTS.find(s => s.id === parseInt(selectedSlotId, 10));
    
    if (!slot || (!selectedBatch && !teacherName.trim())) {
      setConflicts([]);
      return;
    }

    setIsCheckingConflicts(true);
    const newConflicts: Conflict[] = [];

    try {
      // Check batch conflict
      if (selectedBatch && selectedStream) {
        const { data: batchConflicts } = await supabase
          .from('routines')
          .select('*, rooms:allocated_room_id(room_number)')
          .eq('stream', selectedStream)
          .eq('batch', selectedBatch)
          .eq('day_of_week', dayNum)
          .not('allocated_room_id', 'is', null)
          .gte('end_time', slot.start)
          .lte('start_time', slot.end);

        if (batchConflicts && batchConflicts.length > 0) {
          const conflict = batchConflicts[0];
          const roomNum = (conflict.rooms as any)?.room_number || 'another room';
          newConflicts.push({
            type: 'batch',
            message: `${selectedStream} ${selectedBatch} is already scheduled for "${conflict.subject}" in Room ${roomNum}`,
            room: roomNum,
          });
        }
      }

      // Check teacher conflict
      if (teacherName.trim()) {
        const { data: teacherConflicts } = await supabase
          .from('routines')
          .select('*, rooms:allocated_room_id(room_number)')
          .ilike('teacher_name', teacherName.trim())
          .eq('day_of_week', dayNum)
          .not('allocated_room_id', 'is', null)
          .gte('end_time', slot.start)
          .lte('start_time', slot.end);

        if (teacherConflicts && teacherConflicts.length > 0) {
          const conflict = teacherConflicts[0];
          const roomNum = (conflict.rooms as any)?.room_number || 'another room';
          newConflicts.push({
            type: 'teacher',
            message: `${teacherName} is already teaching "${conflict.subject}" to ${conflict.stream} ${conflict.batch} in Room ${roomNum}`,
            room: roomNum,
          });
        }
      }

      // Check room conflict
      if (selectedRoomId) {
        const { data: roomConflicts } = await supabase
          .from('routines')
          .select('subject, stream, batch')
          .eq('allocated_room_id', selectedRoomId)
          .eq('day_of_week', dayNum)
          .gte('end_time', slot.start)
          .lte('start_time', slot.end);

        if (roomConflicts && roomConflicts.length > 0) {
          const conflict = roomConflicts[0];
          newConflicts.push({
            type: 'batch',
            message: `Room is already occupied by ${conflict.stream} ${conflict.batch} for "${conflict.subject}"`,
            room: selectedRoomId,
          });
        }
      }

      setConflicts(newConflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoomId) {
      toast.error('Please select a room to allocate');
      return;
    }

    if (conflicts.length > 0) {
      const proceed = window.confirm(
        `Warning: There are scheduling conflicts:\n\n${conflicts.map(c => `• ${c.message}`).join('\n')}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    setIsLoading(true);

    const dayNum = parseInt(selectedDay, 10);
    const slot = TIME_SLOTS.find(s => s.id === parseInt(selectedSlotId, 10))!;

    // Calculate expiry timestamp if special instant booking is selected
    let expiresAt: string | null = null;
    if (isInstant) {
      const now = new Date();
      if (instantDuration === 'slot') {
        const [hours, minutes] = slot.end.split(':').map(Number);
        const expiryDate = new Date();
        expiryDate.setHours(hours, minutes, 0, 0);
        if (expiryDate <= now) {
          expiryDate.setDate(expiryDate.getDate() + 1);
        }
        expiresAt = expiryDate.toISOString();
      } else {
        const mins = parseInt(instantDuration, 10) || 30;
        const expiryDate = new Date(now.getTime() + mins * 60000);
        expiresAt = expiryDate.toISOString();
      }
    }

    try {
      // Check if routine exists without room allocation
      const { data: existingData, error: searchError } = await supabase
        .from('routines')
        .select('*')
        .eq('stream', selectedStream)
        .eq('batch', selectedBatch)
        .eq('subject', subject)
        .eq('day_of_week', dayNum)
        .eq('start_time', slot.start)
        .eq('end_time', slot.end)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingData) {
        // Update existing routine with room
        const { error } = await supabase
          .from('routines')
          .update({
            allocated_room_id: selectedRoomId,
            teacher_name: teacherName,
            is_instant: isInstant,
            booking_expires_at: expiresAt,
          })
          .eq('id', existingData.id);

        if (error) throw error;
        toast.success('Room allocated successfully');
      } else {
        // Create new routine
        const { error } = await supabase.from('routines').insert({
          stream: selectedStream,
          batch: selectedBatch,
          subject,
          teacher_name: teacherName,
          day_of_week: dayNum,
          start_time: slot.start,
          end_time: slot.end,
          allocated_room_id: selectedRoomId,
          is_instant: isInstant,
          booking_expires_at: expiresAt,
        });

        if (error) throw error;
        toast.success('New special routine created and room allocated');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to book room');
      console.error('Booking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRoomId('');
    setSubject('');
    setTeacherName('');
    setSelectedStream('');
    setSelectedBatch('');
    setIsInstant(false);
    setInstantDuration('30');
    setConflicts([]);
  };

  const filteredBatches = batches.filter((b) => b.stream === selectedStream);
  const uniqueBatches = [...new Set(filteredBatches.map((b) => b.batch))];
  const activeSlot = TIME_SLOTS.find(s => s.id === parseInt(selectedSlotId, 10));

  // Filter rooms based on the selected floor
  const filteredRooms = rooms.filter(r => r.floor_number === parseInt(selectedFloor, 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-glass border-glass rounded-3xl shadow-2xl backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display">Book a Room</DialogTitle>
          <DialogDescription className="font-sans">
            Choose options below to book a room.
          </DialogDescription>
        </DialogHeader>

        {conflicts.length > 0 && (
          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
            {conflicts.map((conflict, index) => (
              <Alert key={index} variant="destructive" className="py-2 bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4 animate-bounce" />
                <AlertDescription className="text-xs ml-2">
                  <strong>Conflict:</strong> {conflict.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Floor & Room Selector Group */}
          <div className="grid grid-cols-2 gap-3">
            {/* Floor Selection */}
            <div className="space-y-2">
              <Label htmlFor="floor-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Floor</Label>
              <Select value={selectedFloor} onValueChange={(v) => { setSelectedFloor(v); setSelectedRoomId(''); }} required>
                <SelectTrigger id="floor-select" className="bg-background/50 border-glass rounded-xl h-11">
                  <SelectValue placeholder="Choose floor" />
                </SelectTrigger>
                <SelectContent>
                  {FLOORS_LIST.map((f) => (
                    <SelectItem key={f.value} value={f.value.toString()}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <Label htmlFor="room-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Select Room</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId} required>
                <SelectTrigger id="room-select" className="bg-background/50 border-glass rounded-xl h-11">
                  <SelectValue placeholder={filteredRooms.length > 0 ? "Choose room..." : "No rooms on this floor"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.room_number} ({room.room_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Day Selection */}
            <div className="space-y-2">
              <Label htmlFor="day-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3. Select Day</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay} required>
                <SelectTrigger id="day-select" className="bg-background/50 border-glass rounded-xl h-11">
                  <SelectValue placeholder="Choose day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_LIST.map((day) => (
                    <SelectItem key={day.id} value={day.id.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2">
              <Label htmlFor="slot-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">4. Select Slot</Label>
              <Select value={selectedSlotId} onValueChange={setSelectedSlotId} required>
                <SelectTrigger id="slot-select" className="bg-background/50 border-glass rounded-xl h-11">
                  <SelectValue placeholder="Choose slot" />
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Stream Selection */}
            <div className="space-y-2">
              <Label htmlFor="stream-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stream</Label>
              <Select value={selectedStream} onValueChange={setSelectedStream} required>
                <SelectTrigger id="stream-select" className="bg-background/50 border-glass rounded-xl h-11">
                  <SelectValue placeholder="Stream..." />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream} value={stream}>
                      {stream}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Selection */}
            <div className="space-y-2">
              <Label htmlFor="batch-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Batch</Label>
              <Select
                value={selectedBatch}
                onValueChange={setSelectedBatch}
                disabled={!selectedStream}
                required
              >
                <SelectTrigger id="batch-select" className="bg-background/50 border-glass rounded-xl h-11">
                  <SelectValue placeholder="Batch..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueBatches.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Subject Input */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Machine Learning"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="bg-background/50 border-glass focus-visible:ring-primary focus-visible:border-transparent rounded-xl h-11"
              />
            </div>

            {/* Teacher Name Input */}
            <div className="space-y-2">
              <Label htmlFor="teacher" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teacher Name</Label>
              <Input
                id="teacher"
                placeholder="e.g., Dr. Raja"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
                className="bg-background/50 border-glass focus-visible:ring-primary focus-visible:border-transparent rounded-xl h-11"
              />
            </div>
          </div>

          {/* Instant Booking Toggle */}
          <div className="flex items-center space-x-2 bg-muted/20 p-3.5 border border-glass rounded-xl mt-1">
            <input
              type="checkbox"
              id="is-instant"
              checked={isInstant}
              onChange={(e) => setIsInstant(e.target.checked)}
              className="h-4 w-4 rounded border-glass text-primary focus:ring-primary bg-background/50 accent-primary"
            />
            <div className="flex-1">
              <Label htmlFor="is-instant" className="font-bold cursor-pointer text-sm">Special Instant Booking</Label>
              <p className="text-[10px] text-muted-foreground font-sans">Apply release countdown timer to free this room automatically.</p>
            </div>
          </div>

          {isInstant && (
            <div className="space-y-2 p-3.5 border border-glass rounded-xl bg-background/30 animate-fade-in">
              <Label htmlFor="duration" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Release Timer / Duration</Label>
              <Select value={instantDuration} onValueChange={setInstantDuration}>
                <SelectTrigger id="duration" className="bg-background/50 border-glass rounded-xl h-10">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="45">45 Minutes</SelectItem>
                  <SelectItem value="60">60 Minutes</SelectItem>
                  <SelectItem value="slot">Until end of slot ({activeSlot?.end})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold shadow-lg shadow-primary/10 active:scale-95 transition-transform h-11 rounded-xl mt-4" 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : conflicts.length > 0 ? 'Book Anyway' : 'Book Room'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
