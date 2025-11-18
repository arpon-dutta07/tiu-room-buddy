import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Batch {
  stream: string;
  batches: string[];
}

export const BatchManagement = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [newStream, setNewStream] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('routines')
      .select('stream, batch');

    if (error) {
      toast.error('Failed to fetch batches');
      console.error(error);
    } else {
      // Group by stream
      const grouped = data.reduce((acc: Record<string, Set<string>>, item) => {
        if (!acc[item.stream]) {
          acc[item.stream] = new Set();
        }
        acc[item.stream].add(item.batch);
        return acc;
      }, {});

      const batchList = Object.entries(grouped).map(([stream, batchSet]) => ({
        stream,
        batches: Array.from(batchSet),
      }));

      setBatches(batchList);
    }
    
    setLoading(false);
  };

  const handleAddStream = () => {
    if (!newStream.trim() || !newBatch.trim()) {
      toast.error('Please enter both stream and batch name');
      return;
    }

    const existingStream = batches.find((b) => b.stream === newStream);
    if (existingStream) {
      if (existingStream.batches.includes(newBatch)) {
        toast.error('This batch already exists');
        return;
      }
      setBatches(
        batches.map((b) =>
          b.stream === newStream
            ? { ...b, batches: [...b.batches, newBatch] }
            : b
        )
      );
    } else {
      setBatches([...batches, { stream: newStream, batches: [newBatch] }]);
    }

    toast.success(`Added ${newBatch} to ${newStream}`);
    setNewStream('');
    setNewBatch('');
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Batch Management</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Batch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stream">Stream</Label>
                  <Input
                    id="stream"
                    placeholder="e.g., B.Tech, B.Sc, BBA"
                    value={newStream}
                    onChange={(e) => setNewStream(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch Name</Label>
                  <Input
                    id="batch"
                    placeholder="e.g., AI4B, CSE1, BBA2"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddStream} className="w-full">
                  Add Batch
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No batches found. Add some routines to see batches here.
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              <Card key={batch.stream}>
                <CardHeader>
                  <CardTitle className="text-lg">{batch.stream}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {batch.batches.map((b) => (
                      <div
                        key={b}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium"
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
