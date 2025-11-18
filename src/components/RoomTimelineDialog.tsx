import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Routine {
  id: string;
  start_time: string;
  end_time: string;
  subject: string;
  stream: string;
  batch: string;
  teacher_name: string;
}

interface RoomTimelineDialogProps {
  room: {
    id: string;
    room_number: string;
    floor_number: number;
  } | null;
  day: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_SLOTS = [
  { label: '9-10 AM', start: '09:00', end: '10:00' },
  { label: '10-11 AM', start: '10:00', end: '11:00' },
  { label: '11-12 PM', start: '11:00', end: '12:00' },
  { label: '12-1 PM', start: '12:00', end: '13:00' },
  { label: '1-2 PM', start: '13:00', end: '14:00' },
  { label: '2-3 PM', start: '14:00', end: '15:00' },
  { label: '3-4 PM', start: '15:00', end: '16:00' },
  { label: '4-5 PM', start: '16:00', end: '17:00' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RoomTimelineDialog = ({ room, day, open, onOpenChange }: RoomTimelineDialogProps) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room && open) {
      fetchRoomTimeline();
    }
  }, [room, day, open]);

  const fetchRoomTimeline = async () => {
    if (!room) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('allocated_room_id', room.id)
      .eq('day_of_week', day)
      .order('start_time');

    if (error) {
      toast.error('Failed to fetch room timeline');
      console.error(error);
    } else {
      setRoutines(data || []);
    }
    
    setLoading(false);
  };

  const isSlotOccupied = (slotStart: string, slotEnd: string) => {
    return routines.find((routine) => {
      return !(slotEnd <= routine.start_time || slotStart >= routine.end_time);
    });
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Room {room.room_number} - {DAYS[day]} Schedule
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading timeline...</div>
        ) : (
          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => {
              const occupyingRoutine = isSlotOccupied(slot.start, slot.end);
              
              return (
                <Card
                  key={slot.label}
                  className={cn(
                    'transition-all',
                    occupyingRoutine
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">{slot.label}</div>
                        {occupyingRoutine ? (
                          <div className="space-y-1 text-sm">
                            <div className="font-medium text-red-600 dark:text-red-400">
                              ✓ Booked
                            </div>
                            <div className="text-muted-foreground">
                              <span className="font-medium">{occupyingRoutine.stream} - {occupyingRoutine.batch}</span>
                              <span className="mx-2">•</span>
                              {occupyingRoutine.subject}
                            </div>
                            <div className="text-muted-foreground">
                              Teacher: {occupyingRoutine.teacher_name}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Free
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
