import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, BookOpen, Users } from 'lucide-react';

interface Room {
  id: string;
  floor_number: number;
  room_number: string;
  room_type: string;
  status: string;
  allocated_to: string | null;
  subject: string | null;
  batch: string | null;
  teacher_name: string | null;
  occupied_from: string | null;
  occupied_till: string | null;
}

interface RoomGridProps {
  rooms: Room[];
  onFreeRoom?: (roomId: string) => void;
  isAdmin: boolean;
}

const RoomGrid = ({ rooms, onFreeRoom, isAdmin }: RoomGridProps) => {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No rooms found on this floor</p>
      </div>
    );
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className={`transition-all hover:shadow-lg ${
            room.status === 'free'
              ? 'border-success bg-success/5'
              : 'border-destructive bg-destructive/5'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{room.room_number}</CardTitle>
                <CardDescription className="capitalize">{room.room_type}</CardDescription>
              </div>
              <Badge
                variant={room.status === 'free' ? 'default' : 'destructive'}
                className={room.status === 'free' ? 'bg-success hover:bg-success/90' : ''}
              >
                {room.status === 'free' ? 'Free' : 'Occupied'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {room.status === 'occupied' && (
              <div className="space-y-2">
                {room.teacher_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{room.teacher_name}</span>
                  </div>
                )}
                {room.subject && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{room.subject}</span>
                  </div>
                )}
                {room.batch && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{room.batch}</span>
                  </div>
                )}
                {room.occupied_from && room.occupied_till && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatTime(room.occupied_from)} - {formatTime(room.occupied_till)}
                    </span>
                  </div>
                )}
                {isAdmin && onFreeRoom && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onFreeRoom(room.id)}
                    className="w-full mt-2"
                  >
                    Free Room
                  </Button>
                )}
              </div>
            )}
            {room.status === 'free' && (
              <p className="text-sm text-muted-foreground">Available for booking</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RoomGrid;
