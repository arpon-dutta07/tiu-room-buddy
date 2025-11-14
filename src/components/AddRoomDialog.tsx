import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddRoomDialog = ({ open, onOpenChange, onSuccess }: AddRoomDialogProps) => {
  const [floorNumber, setFloorNumber] = useState('1');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<'classroom' | 'lab' | 'conference'>('classroom');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from('rooms').insert({
      floor_number: parseInt(floorNumber),
      room_number: roomNumber,
      room_type: roomType,
      status: 'free',
    });

    if (error) {
      toast.error('Failed to add room: ' + error.message);
      console.error(error);
    } else {
      toast.success('Room added successfully');
      setRoomNumber('');
      setFloorNumber('1');
      setRoomType('classroom');
      onSuccess();
      onOpenChange(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="floor">Floor Number</Label>
            <Select value={floorNumber} onValueChange={setFloorNumber}>
              <SelectTrigger id="floor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Ground Floor</SelectItem>
                <SelectItem value="1">1st Floor</SelectItem>
                <SelectItem value="2">2nd Floor</SelectItem>
                <SelectItem value="3">3rd Floor</SelectItem>
                <SelectItem value="4">4th Floor</SelectItem>
                <SelectItem value="5">5th Floor</SelectItem>
                <SelectItem value="6">6th Floor</SelectItem>
                <SelectItem value="7">7th Floor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number</Label>
            <Input
              id="roomNumber"
              placeholder="e.g., LT101, BScLab-G1"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={roomType} onValueChange={(value: any) => setRoomType(value)}>
              <SelectTrigger id="roomType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classroom">Classroom</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="conference">Conference Room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Room'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoomDialog;
