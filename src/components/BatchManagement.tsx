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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('batches')
      .select('stream, batch_name')
      .order('stream')
      .order('batch_name');

    if (error) {
      toast.error('Failed to fetch batches');
      console.error(error);
    } else {
      // Group by stream
      const grouped = data.reduce((acc: Record<string, string[]>, item) => {
        if (!acc[item.stream]) {
          acc[item.stream] = [];
        }
        acc[item.stream].push(item.batch_name);
        return acc;
      }, {});

      const batchList = Object.entries(grouped).map(([stream, batchNames]) => ({
        stream,
        batches: batchNames,
      }));

      setBatches(batchList);
    }
    
    setLoading(false);
  };

  const handleAddBatch = async () => {
    if (!newStream.trim() || !newBatch.trim()) {
      toast.error('Please enter both stream and batch name');
      return;
    }

    const { error } = await supabase
      .from('batches')
      .insert({ stream: newStream.trim(), batch_name: newBatch.trim() });

    if (error) {
      if (error.code === '23505') {
        toast.error('This batch already exists');
      } else {
        toast.error('Failed to add batch');
      }
      return;
    }

    toast.success(`Added ${newBatch} to ${newStream}`);
    setNewStream('');
    setNewBatch('');
    setDialogOpen(false);
    fetchBatches();
  };

  const handleDeleteBatch = async (stream: string, batchName: string) => {
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('stream', stream)
      .eq('batch_name', batchName);

    if (error) {
      toast.error('Failed to delete batch');
      return;
    }

    toast.success(`Deleted ${batchName}`);
    fetchBatches();
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
                    placeholder="e.g., CSE 1A, Physics 2A"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddBatch} className="w-full">
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
            No batches found. Add some to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              <Card key={batch.stream}>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">{batch.stream}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {batch.batches.map((b) => (
                      <div
                        key={b}
                        className="group flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium"
                      >
                        {b}
                        <button
                          onClick={() => handleDeleteBatch(batch.stream, b)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
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
