import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickAllocateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: any;
  day: number;
  timeSlot: { id: number; label: string; start: string; end: string };
  onSuccess: () => void;
}

export const QuickAllocateDialog = ({
  open,
  onOpenChange,
  room,
  day,
  timeSlot,
  onSuccess,
}: QuickAllocateDialogProps) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingRoutine, setExistingRoutine] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchBatches();
      fetchExistingRoutine();
    }
  }, [open, room, day, timeSlot]);

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

  const fetchExistingRoutine = async () => {
    if (!room?.isOccupied) {
      setExistingRoutine(null);
      setSubject('');
      setTeacherName('');
      setSelectedStream('');
      setSelectedBatch('');
      return;
    }

    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('allocated_room_id', room.id)
      .eq('day_of_week', day)
      .gte('end_time', timeSlot.start)
      .lte('start_time', timeSlot.end)
      .maybeSingle();

    if (error) {
      console.error('Error fetching existing routine:', error);
    } else if (data) {
      setExistingRoutine(data);
      setSubject(data.subject);
      setTeacherName(data.teacher_name);
      setSelectedStream(data.stream);
      setSelectedBatch(data.batch);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (existingRoutine) {
        // Update existing routine
        const { error } = await supabase
          .from('routines')
          .update({
            stream: selectedStream,
            batch: selectedBatch,
            subject,
            teacher_name: teacherName,
          })
          .eq('id', existingRoutine.id);

        if (error) throw error;
        toast.success('Room allocation updated successfully');
      } else {
        // Check if routine exists without room allocation
        const { data: existingData, error: searchError } = await supabase
          .from('routines')
          .select('*')
          .eq('stream', selectedStream)
          .eq('batch', selectedBatch)
          .eq('subject', subject)
          .eq('day_of_week', day)
          .eq('start_time', timeSlot.start)
          .eq('end_time', timeSlot.end)
          .maybeSingle();

        if (searchError) throw searchError;

        if (existingData) {
          // Update existing routine with room
          const { error } = await supabase
            .from('routines')
            .update({
              allocated_room_id: room.id,
              teacher_name: teacherName,
            })
            .eq('id', existingData.id);

          if (error) throw error;
          toast.success('Room allocated to existing routine');
        } else {
          // Create new routine
          const { error } = await supabase.from('routines').insert({
            stream: selectedStream,
            batch: selectedBatch,
            subject,
            teacher_name: teacherName,
            day_of_week: day,
            start_time: timeSlot.start,
            end_time: timeSlot.end,
            allocated_room_id: room.id,
          });

          if (error) throw error;
          toast.success('New routine created and room allocated');
        }
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to allocate room');
      console.error('Allocation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeRoom = async () => {
    if (!existingRoutine) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('routines')
        .update({ allocated_room_id: null })
        .eq('id', existingRoutine.id);

      if (error) throw error;

      toast.success('Room freed successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to free room');
      console.error('Free room error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setTeacherName('');
    setSelectedStream('');
    setSelectedBatch('');
    setExistingRoutine(null);
  };

  const filteredBatches = batches.filter((b) => b.stream === selectedStream);
  const uniqueBatches = [...new Set(filteredBatches.map((b) => b.batch))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRoutine ? 'Edit Room Allocation' : 'Allocate Room'} - {room?.room_number}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Day: {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]} |
            Time: {timeSlot?.label}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stream">Stream</Label>
            <Select value={selectedStream} onValueChange={setSelectedStream} required>
              <SelectTrigger id="stream">
                <SelectValue placeholder="Select stream" />
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

          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Select
              value={selectedBatch}
              onValueChange={setSelectedBatch}
              disabled={!selectedStream}
              required
            >
              <SelectTrigger id="batch">
                <SelectValue placeholder="Select batch" />
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

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Machine Learning"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher Name</Label>
            <Input
              id="teacher"
              placeholder="Enter teacher name"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Processing...' : existingRoutine ? 'Update' : 'Allocate'}
            </Button>
            {existingRoutine && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleFreeRoom}
                disabled={isLoading}
              >
                Free Room
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
