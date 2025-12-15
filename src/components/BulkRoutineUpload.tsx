import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { Upload, Download, CheckCircle, XCircle } from "lucide-react";

interface RoutineRow {
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher: string;
  default_room?: string;
}

interface ValidationError {
  row: number;
  errors: string[];
}

interface Batch {
  id: string;
  batch_name: string;
  stream: string;
}

const dayMap: { [key: string]: number } = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function BulkRoutineUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<RoutineRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .order("stream")
      .order("batch_name");

    if (!error && data) {
      setBatches(data);
    }
  };

  const downloadTemplate = () => {
    const template = `day,start_time,end_time,subject,teacher,default_room
Monday,09:00,10:00,Machine Learning,Dr. Smith,101
Monday,10:00,11:00,Data Structures,Prof. Johnson,102
Tuesday,11:00,12:00,Physics Lab,Dr. Kumar,Lab-G1`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable_template${selectedBatch ? `_${selectedBatch.batch_name}` : ""}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateTime = (time: string): boolean => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const validateRow = (row: RoutineRow, index: number): string[] => {
    const errors: string[] = [];

    if (!row.day?.trim()) errors.push("Day is required");
    else if (!dayMap[row.day.toLowerCase()]) {
      errors.push("Day must be Monday-Saturday");
    }
    if (!row.start_time?.trim()) errors.push("Start time is required");
    else if (!validateTime(row.start_time)) {
      errors.push("Invalid start time format (use HH:MM)");
    }
    if (!row.end_time?.trim()) errors.push("End time is required");
    else if (!validateTime(row.end_time)) {
      errors.push("Invalid end time format (use HH:MM)");
    }
    if (!row.subject?.trim()) errors.push("Subject is required");
    if (!row.teacher?.trim()) errors.push("Teacher is required");

    return errors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as RoutineRow[];
        setParsedData(data);

        const errors: ValidationError[] = [];
        data.forEach((row, index) => {
          const rowErrors = validateRow(row, index);
          if (rowErrors.length > 0) {
            errors.push({ row: index + 1, errors: rowErrors });
          }
        });

        setValidationErrors(errors);

        if (errors.length === 0) {
          toast({
            title: "CSV parsed successfully",
            description: `${data.length} routines ready to upload`,
          });
        } else {
          toast({
            title: "Validation errors found",
            description: `${errors.length} rows have errors`,
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        toast({
          title: "Parse error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const uploadRoutines = async () => {
    if (!selectedBatch) {
      toast({
        title: "No batch selected",
        description: "Please select a batch first",
        variant: "destructive",
      });
      return;
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Cannot upload",
        description: "Please fix validation errors first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const routinesToInsert = parsedData.map((row) => ({
        batch: selectedBatch.batch_name,
        stream: selectedBatch.stream,
        day_of_week: dayMap[row.day.toLowerCase()],
        start_time: row.start_time.trim(),
        end_time: row.end_time.trim(),
        subject: row.subject.trim(),
        teacher_name: row.teacher.trim(),
        default_room: row.default_room?.trim() || null,
      }));

      const { error } = await supabase.from("routines").insert(routinesToInsert);

      if (error) throw error;

      toast({
        title: "Upload successful",
        description: `${routinesToInsert.length} routines uploaded for ${selectedBatch.batch_name}`,
      });

      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Group batches by stream
  const batchesByStream = batches.reduce((acc, batch) => {
    if (!acc[batch.stream]) acc[batch.stream] = [];
    acc[batch.stream].push(batch);
    return acc;
  }, {} as Record<string, Batch[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Routine Upload</CardTitle>
        <CardDescription>
          Select a batch and upload its weekly timetable using CSV format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Batch Selection - Grouped by Stream */}
        <div className="space-y-3">
          <Label>Select Batch</Label>
          {selectedBatch && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <Badge variant="secondary">{selectedBatch.stream}</Badge>
              <span className="font-semibold">{selectedBatch.batch_name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => setSelectedBatch(null)}
              >
                Change
              </Button>
            </div>
          )}
          
          {!selectedBatch && (
            <Accordion type="single" collapsible className="border rounded-lg">
              {Object.entries(batchesByStream).map(([stream, streamBatches]) => (
                <AccordionItem key={stream} value={stream}>
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stream}</span>
                      <Badge variant="outline" className="text-xs">
                        {streamBatches.length} batches
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {streamBatches.map((batch) => (
                        <Button
                          key={batch.id}
                          variant="outline"
                          size="sm"
                          className="justify-start h-9"
                          onClick={() => setSelectedBatch(batch)}
                        >
                          {batch.batch_name}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {selectedBatch && (
          <div className="flex gap-4">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>
        )}

        {!selectedBatch && parsedData.length === 0 && (
          <Alert>
            <AlertDescription>
              Please select a batch first before uploading the timetable CSV.
            </AlertDescription>
          </Alert>
        )}

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="font-semibold mb-2">Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error) => (
                  <li key={error.row}>
                    Row {error.row}: {error.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {parsedData.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validationErrors.length === 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">
                      All {parsedData.length} rows valid
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-destructive">
                      {validationErrors.length} rows with errors
                    </span>
                  </>
                )}
              </div>
              <Button
                onClick={uploadRoutines}
                disabled={uploading || validationErrors.length > 0 || !selectedBatch}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Routines"}
              </Button>
            </div>

            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => {
                    const hasError = validationErrors.some((e) => e.row === index + 1);
                    return (
                      <TableRow
                        key={index}
                        className={hasError ? "bg-destructive/10" : ""}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.day}</TableCell>
                        <TableCell>
                          {row.start_time} - {row.end_time}
                        </TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.teacher}</TableCell>
                        <TableCell>{row.default_room || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
