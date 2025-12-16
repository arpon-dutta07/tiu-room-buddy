import { useState, useEffect, useRef, DragEvent } from "react";
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
import { Upload, Download, CheckCircle, XCircle, FileText, X, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

interface FileWithStatus {
  file: File;
  status: 'pending' | 'parsing' | 'success' | 'error';
  data?: RoutineRow[];
  errors?: ValidationError[];
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
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    } else {
      toast({
        title: "Invalid files",
        description: "Please upload CSV files",
        variant: "destructive",
      });
    }
  };

  const addFiles = (newFiles: File[]) => {
    const newFileStatuses: FileWithStatus[] = newFiles.map(f => ({
      file: f,
      status: 'pending' as const
    }));
    
    setFiles(prev => {
      const updated = [...prev, ...newFileStatuses];
      // Start processing queue
      processNextFile(updated, prev.length);
      return updated;
    });
  };

  const processNextFile = (fileList: FileWithStatus[], startIndex: number) => {
    const nextPending = fileList.findIndex((f, i) => i >= startIndex && f.status === 'pending');
    if (nextPending !== -1) {
      parseFileAtIndex(nextPending, fileList);
    }
  };

  const parseFileAtIndex = (index: number, currentFiles: FileWithStatus[]) => {
    const fileItem = currentFiles[index];
    if (!fileItem) return;

    // Update status to parsing
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'parsing' as const } : f));

    Papa.parse(fileItem.file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as RoutineRow[];
        const errors: ValidationError[] = [];
        
        data.forEach((row, rowIndex) => {
          const rowErrors = validateRow(row);
          if (rowErrors.length > 0) {
            errors.push({ row: rowIndex + 1, errors: rowErrors });
          }
        });

        setFiles(prev => {
          const updated = prev.map((f, i) => {
            if (i === index) {
              return {
                ...f,
                status: (errors.length === 0 ? 'success' : 'error') as 'success' | 'error',
                data,
                errors
              };
            }
            return f;
          });
          
          // Process next file in queue
          setTimeout(() => processNextFile(updated, index + 1), 100);
          return updated;
        });

        if (errors.length === 0) {
          toast({
            title: `${fileItem.file.name} parsed`,
            description: `${data.length} routines ready`,
          });
        }
      },
      error: (error) => {
        setFiles(prev => {
          const updated = prev.map((f, i) => 
            i === index ? { ...f, status: 'error' as const, errors: [{ row: 0, errors: [error.message] }] } : f
          );
          setTimeout(() => processNextFile(updated, index + 1), 100);
          return updated;
        });
        toast({
          title: "Parse error",
          description: `${fileItem.file.name}: ${error.message}`,
          variant: "destructive",
        });
      },
    });
  };

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

  const validateRow = (row: RoutineRow): string[] => {
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
    const selectedFiles = Array.from(e.target.files || []);
    const csvFiles = selectedFiles.filter(f => f.name.endsWith(".csv"));
    
    if (csvFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please upload CSV files",
        variant: "destructive",
      });
      return;
    }

    addFiles(csvFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFileIndex === index) {
      setSelectedFileIndex(null);
    } else if (selectedFileIndex !== null && selectedFileIndex > index) {
      setSelectedFileIndex(selectedFileIndex - 1);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFileIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedFile = selectedFileIndex !== null ? files[selectedFileIndex] : null;
  const parsedData = selectedFile?.data || [];
  const validationErrors = selectedFile?.errors || [];

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

      if (selectedFileIndex !== null) {
        removeFile(selectedFileIndex);
      }
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

  const isProcessing = files.some(f => f.status === 'parsing');

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
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-start">
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <div className="flex-1 flex flex-col gap-3">
                {/* Upload Area */}
                <label 
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isDragging ? 'Drop CSV files here' : 'Drag & drop or click to upload CSV files'}
                  </span>
                  <span className="text-xs text-muted-foreground">Multiple files supported</span>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                {/* File Queue */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{files.length} file{files.length > 1 ? 's' : ''}</span>
                      <Button variant="ghost" size="sm" onClick={clearAllFiles} className="h-7 text-xs">
                        Clear all
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {files.map((fileItem, index) => (
                        <div 
                          key={`${fileItem.file.name}-${index}`}
                          className={`flex items-center justify-between gap-3 px-3 py-2 border rounded-lg transition-colors cursor-pointer ${
                            selectedFileIndex === index 
                              ? 'bg-primary/10 border-primary/30' 
                              : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                          onClick={() => fileItem.status !== 'parsing' && setSelectedFileIndex(index)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {fileItem.status === 'parsing' && (
                              <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                            )}
                            {fileItem.status === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                            {fileItem.status === 'error' && (
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                            )}
                            {fileItem.status === 'pending' && (
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">{fileItem.file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(fileItem.file.size)}
                                {fileItem.status === 'success' && fileItem.data && (
                                  <span className="text-green-600 ml-2">• {fileItem.data.length} rows</span>
                                )}
                                {fileItem.status === 'error' && fileItem.errors && (
                                  <span className="text-destructive ml-2">• {fileItem.errors.length} errors</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            disabled={fileItem.status === 'parsing'}
                            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {isProcessing && (
                      <div className="px-1">
                        <Progress value={undefined} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">Processing files...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedBatch && files.length === 0 && (
          <Alert>
            <AlertDescription>
              Please select a batch first before uploading the timetable CSV.
            </AlertDescription>
          </Alert>
        )}

        {validationErrors.length > 0 && selectedFile && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="font-semibold mb-2">Validation Errors in {selectedFile.file.name}:</div>
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

        {parsedData.length > 0 && selectedFile && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validationErrors.length === 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">
                      All {parsedData.length} rows valid in {selectedFile.file.name}
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