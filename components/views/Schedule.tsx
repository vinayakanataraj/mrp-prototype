
import React, { useState, useMemo } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Badge, Avatar, Separator, 
  Select, Popover, PopoverContent, PopoverTrigger, cn
} from '@/components/ui/ui-primitives';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Filter, Plus, Search, MoreHorizontal, Clock, 
  AlertCircle, CheckCircle2, Factory, Layers
} from 'lucide-react';
import { 
  format, addDays, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, isToday, 
  differenceInDays, addWeeks, subWeeks, 
  startOfMonth, endOfMonth, isWeekend
} from 'date-fns';

// --- Types ---

interface ProductionLine {
  id: string;
  name: string;
  type: 'Assembly' | 'Machining' | 'Packaging' | 'QA';
  status: 'Operational' | 'Maintenance' | 'Offline';
}

interface ScheduleItem {
  id: string;
  batchId: string;
  product: string;
  sku: string;
  lineId: string;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  progress: number;
  status: 'Planned' | 'Active' | 'Completed' | 'Delayed';
  assignees: string[];
}

// --- Mock Data ---

const LINES: ProductionLine[] = [
  { id: 'L1', name: 'CNC Milling Stn 1', type: 'Machining', status: 'Operational' },
  { id: 'L2', name: 'CNC Milling Stn 2', type: 'Machining', status: 'Operational' },
  { id: 'L3', name: 'Assembly Line Alpha', type: 'Assembly', status: 'Operational' },
  { id: 'L4', name: 'Assembly Line Beta', type: 'Assembly', status: 'Maintenance' },
  { id: 'L5', name: 'Paint Booth A', type: 'Assembly', status: 'Operational' },
  { id: 'L6', name: 'Pack & Ship Unit', type: 'Packaging', status: 'Operational' },
];

const TASKS: ScheduleItem[] = [
  { id: 't1', batchId: 'BATCH-1001', product: 'Circuit Board v2', sku: 'ELEC-CIRC', lineId: 'L3', startDate: '2024-03-11', endDate: '2024-03-13', progress: 65, status: 'Active', assignees: ['SJ'] },
  { id: 't2', batchId: 'BATCH-1002', product: 'Hydraulic Pump X1', sku: 'HYD-PUMP', lineId: 'L1', startDate: '2024-03-10', endDate: '2024-03-14', progress: 40, status: 'Delayed', assignees: ['MR', 'RT'] },
  { id: 't3', batchId: 'BATCH-1003', product: 'Steel Housing', sku: 'STL-SHEET', lineId: 'L2', startDate: '2024-03-12', endDate: '2024-03-12', progress: 0, status: 'Planned', assignees: [] },
  { id: 't4', batchId: 'BATCH-1001', product: 'Circuit Board v2', sku: 'ELEC-CIRC', lineId: 'L6', startDate: '2024-03-14', endDate: '2024-03-15', progress: 0, status: 'Planned', assignees: [] },
  { id: 't5', batchId: 'BATCH-0999', product: 'Old Gen Pump', sku: 'PUMP-OLD', lineId: 'L5', startDate: '2024-03-08', endDate: '2024-03-11', progress: 100, status: 'Completed', assignees: ['JD'] },
];

export const ScheduleView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2024-03-11')); // Mock "Today"
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedTask, setSelectedTask] = useState<ScheduleItem | null>(null);

  // --- Date Math ---
  const startDate = viewMode === 'week' ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfMonth(currentDate);
  const endDate = viewMode === 'week' ? endOfWeek(currentDate, { weekStartsOn: 1 }) : endOfMonth(currentDate);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = days.length;

  // --- Handlers ---
  const handlePrev = () => setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : addDays(startOfMonth(prev), -1));
  const handleNext = () => setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addDays(endOfMonth(prev), 1));
  const handleToday = () => setCurrentDate(new Date('2024-03-11')); // Reset to mock today

  // --- Layout Helpers ---
  const CELL_WIDTH = viewMode === 'week' ? 120 : 40; // px per day

  const getTaskStyle = (task: ScheduleItem) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // Clamp to view
    let effectiveStart = taskStart < startDate ? startDate : taskStart;
    let effectiveEnd = taskEnd > endDate ? endDate : taskEnd;

    // Don't render if out of view
    if (taskEnd < startDate || taskStart > endDate) return { display: 'none' };

    const offsetDays = differenceInDays(effectiveStart, startDate);
    const durationDays = differenceInDays(effectiveEnd, effectiveStart) + 1;

    return {
      left: `${offsetDays * CELL_WIDTH}px`,
      width: `${durationDays * CELL_WIDTH}px`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-500 border-blue-600 text-white';
      case 'Completed': return 'bg-green-500 border-green-600 text-white';
      case 'Delayed': return 'bg-red-500 border-red-600 text-white';
      default: return 'bg-slate-400 border-slate-500 text-white';
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Schedule</h1>
          <p className="text-muted-foreground mt-1">Resource allocation and timeline management.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
              <Button 
                variant={viewMode === 'week' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button 
                variant={viewMode === 'month' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
           </div>
           <Separator orientation="vertical" className="h-8 mx-2" />
           <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="min-w-[140px] font-medium" onClick={handleToday}>
                <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                {viewMode === 'week' 
                  ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')
                }
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
           </div>
           <Button className="ml-2">
             <Plus className="w-4 h-4 mr-2" /> Assign Job
           </Button>
        </div>
      </div>

      {/* --- KPI Summary (Optional) --- */}
      <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-muted/20 border-none shadow-none">
             <CardContent className="p-4 flex items-center justify-between">
                <div>
                   <p className="text-xs text-muted-foreground font-medium uppercase">Active Jobs</p>
                   <p className="text-2xl font-bold mt-1">12</p>
                </div>
                <Factory className="w-8 h-8 text-blue-500/20" />
             </CardContent>
          </Card>
           <Card className="bg-muted/20 border-none shadow-none">
             <CardContent className="p-4 flex items-center justify-between">
                <div>
                   <p className="text-xs text-muted-foreground font-medium uppercase">Delayed</p>
                   <p className="text-2xl font-bold mt-1 text-red-600">3</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500/20" />
             </CardContent>
          </Card>
          <Card className="bg-muted/20 border-none shadow-none">
             <CardContent className="p-4 flex items-center justify-between">
                <div>
                   <p className="text-xs text-muted-foreground font-medium uppercase">Utilization</p>
                   <p className="text-2xl font-bold mt-1 text-green-600">84%</p>
                </div>
                <Layers className="w-8 h-8 text-green-500/20" />
             </CardContent>
          </Card>
          <Card className="bg-muted/20 border-none shadow-none">
             <CardContent className="p-4 flex items-center justify-between">
                <div>
                   <p className="text-xs text-muted-foreground font-medium uppercase">Unscheduled</p>
                   <p className="text-2xl font-bold mt-1">5</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500/20" />
             </CardContent>
          </Card>
      </div>

      {/* --- Gantt Chart Container --- */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border/60">
        
        {/* Gantt Header (Dates) */}
        <div className="flex border-b divide-x">
          {/* Resources Header */}
          <div className="w-64 shrink-0 p-4 bg-muted/30 font-semibold text-sm flex items-center justify-between">
            <span>Resources</span>
            <Filter className="w-4 h-4 text-muted-foreground cursor-pointer" />
          </div>
          
          {/* Timeline Dates */}
          <div className="flex-1 overflow-hidden relative">
            <div className="flex" style={{ width: `${totalDays * CELL_WIDTH}px` }}>
              {days.map((day) => {
                 const isWknd = isWeekend(day);
                 const today = isSameDay(day, new Date('2024-03-11')); // Mock Today
                 return (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "h-12 border-r flex flex-col items-center justify-center text-sm shrink-0",
                        today ? "bg-blue-50/50 dark:bg-blue-900/20" : isWknd ? "bg-muted/20" : ""
                      )}
                      style={{ width: `${CELL_WIDTH}px` }}
                    >
                      <span className={cn("text-xs font-medium", today ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={cn("font-bold", today && "text-blue-600 dark:text-blue-400")}>
                        {format(day, 'd')}
                      </span>
                    </div>
                 );
              })}
            </div>
          </div>
        </div>

        {/* Gantt Body (Rows) */}
        <div className="flex-1 overflow-auto flex divide-x">
           
           {/* Left Sidebar (Rows) */}
           <div className="w-64 shrink-0 divide-y bg-background z-10 sticky left-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
             {LINES.map((line) => (
               <div key={line.id} className="h-20 p-4 flex flex-col justify-center hover:bg-muted/10 transition-colors group">
                  <div className="flex justify-between items-start">
                     <span className="font-medium text-sm truncate pr-2">{line.name}</span>
                     <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer" />
                  </div>
                  <div className="flex items-center mt-1.5 gap-2">
                     <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">{line.type}</Badge>
                     {line.status === 'Maintenance' && (
                        <span className="flex h-2 w-2 rounded-full bg-orange-500" title="Maintenance" />
                     )}
                  </div>
               </div>
             ))}
           </div>

           {/* Right Timeline Grid & Tasks */}
           <div className="flex-1 overflow-x-auto overflow-y-hidden relative bg-slate-50/30 dark:bg-slate-900/10">
              <div 
                 className="relative h-full"
                 style={{ width: `${totalDays * CELL_WIDTH}px` }}
              >
                  {/* Vertical Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                      {days.map((day) => {
                          const isWknd = isWeekend(day);
                          const today = isSameDay(day, new Date('2024-03-11'));
                          return (
                            <div 
                                key={day.toISOString()} 
                                className={cn(
                                    "border-r h-full",
                                    today ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : isWknd ? "bg-muted/20" : ""
                                )}
                                style={{ width: `${CELL_WIDTH}px` }}
                            />
                          );
                      })}
                  </div>

                  {/* Task Rows */}
                  <div className="absolute inset-0 divide-y flex flex-col">
                      {LINES.map((line) => (
                          <div key={line.id} className="h-20 relative w-full group hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                              {/* Tasks for this line */}
                              {TASKS.filter(t => t.lineId === line.id).map(task => {
                                  const style = getTaskStyle(task);
                                  // Skip if style says none
                                  if (style.display === 'none') return null;

                                  return (
                                    <Popover 
                                        key={task.id}
                                        className={cn(
                                            "absolute top-3 bottom-3 rounded-md shadow-sm border text-[10px] p-2 flex flex-col justify-between cursor-pointer hover:brightness-110 transition-all z-10 overflow-hidden",
                                            getStatusColor(task.status)
                                        )}
                                        style={style}
                                    >
                                        <PopoverTrigger asChild>
                                            <div className="h-full w-full">
                                                <div className="font-semibold truncate w-full">{task.batchId}</div>
                                                <div className="truncate opacity-90">{task.product}</div>
                                                
                                                {/* Progress Bar inside Task */}
                                                <div className="h-1 bg-black/20 mt-1 rounded-full overflow-hidden w-full">
                                                    <div className="h-full bg-white/80" style={{ width: `${task.progress}%` }} />
                                                </div>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0 shadow-xl border-border">
                                            <div className="p-3 border-b bg-muted/20">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-sm">{task.batchId}</h4>
                                                    <Badge variant="outline" className={cn("text-[10px]", 
                                                        task.status === 'Delayed' ? 'text-red-500 border-red-200' : 
                                                        task.status === 'Active' ? 'text-blue-500 border-blue-200' : ''
                                                    )}>
                                                        {task.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{task.product}</p>
                                            </div>
                                            <div className="p-3 space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Start Date:</span>
                                                    <span className="font-medium">{task.startDate}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">End Date:</span>
                                                    <span className="font-medium">{task.endDate}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Progress:</span>
                                                    <span className="font-medium">{task.progress}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Assignees:</span>
                                                    <div className="flex -space-x-1">
                                                        {task.assignees.map((initial, i) => (
                                                            <Avatar key={i} initials={initial} className="w-5 h-5 text-[8px] border bg-background" />
                                                        ))}
                                                        {task.assignees.length === 0 && <span className="text-muted-foreground italic">Unassigned</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2 border-t flex justify-end gap-2 bg-muted/10">
                                                <Button variant="ghost" size="sm" className="h-6 text-xs">Reschedule</Button>
                                                <Button size="sm" className="h-6 text-xs">View Details</Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                  );
                              })}
                          </div>
                      ))}
                  </div>

                  {/* "Current Time" Line */}
                  <div 
                    className="absolute top-0 bottom-0 border-l-2 border-red-500 z-20 pointer-events-none"
                    style={{ 
                        left: `${(differenceInDays(new Date('2024-03-11'), startDate) * CELL_WIDTH) + (CELL_WIDTH/2)}px`,
                        display: (new Date('2024-03-11') < startDate || new Date('2024-03-11') > endDate) ? 'none' : 'block'
                    }}
                  >
                    <div className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-sm absolute -top-1 -left-6 w-12 text-center font-bold">
                        TODAY
                    </div>
                  </div>

              </div>
           </div>
        </div>
      </Card>
    </div>
  );
};
