import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Avatar, Separator, Input, cn, Progress, Select, Popover, PopoverTrigger, PopoverContent, Calendar } from '@/components/ui/ui-primitives';
import { Clock, ArrowRight, Package, Plus, ArrowLeft, X, CheckCircle, Play, AlertCircle, MoreHorizontal, Factory, RotateCcw, CalendarClock, Check, Calendar as CalendarIcon } from 'lucide-react';
import { ProductionStage } from '@/lib/types';
import { format } from 'date-fns';

// --- Types ---

interface MockPO {
  id: string;
  customer: string;
  product: string;
  sku: string;
  totalQty: number;
  fulfilledQty: number; // Already delivered
  dueDate: string;
}

interface ProductionBatch {
  id: string;
  poId: string;
  customer: string;
  product: string;
  sku: string;
  quantity: number;
  completedQty: number;
  status: 'Planned' | 'Active' | 'Completed' | 'On Hold';
  priority: 'Normal' | 'High' | 'Urgent';
  stages: ProductionStage[];
  startDate: string;
  logs: { time: string; message: string; sub: string }[];
}

// --- Mock Data ---

const MOCK_POS: MockPO[] = [
  { id: 'PO-2024-001', customer: 'Customer A', product: 'Hydraulic Pump X1', sku: 'HYD-PUMP-X1', totalQty: 5000, fulfilledQty: 0, dueDate: '2024-06-15' },
  { id: 'PO-2024-002', customer: 'Customer B', product: 'Hydraulic Pump X1', sku: 'HYD-PUMP-X1', totalQty: 1000, fulfilledQty: 0, dueDate: '2024-04-20' },
  { id: 'PO-2024-003', customer: 'Tech Solutions', product: 'Circuit Board v2', sku: 'ELEC-CIRC-V2', totalQty: 500, fulfilledQty: 100, dueDate: '2024-05-01' },
];

const DEFAULT_STAGES_TEMPLATE: ProductionStage[] = [
    { id: 's1', name: 'Material Cut', status: 'pending', assignee: 'Rob T.' },
    { id: 's2', name: 'Assembly A', status: 'pending', assignee: 'Sarah J.' },
    { id: 's3', name: 'Assembly B', status: 'pending', assignee: 'Unassigned' },
    { id: 's4', name: 'QA Check', status: 'pending', assignee: 'Quality Team' },
    { id: 's5', name: 'Packaging', status: 'pending', assignee: 'Logistics' },
];

const INITIAL_BATCHES: ProductionBatch[] = [
  {
    id: 'BATCH-1001',
    poId: 'PO-2024-003',
    customer: 'Tech Solutions',
    product: 'Circuit Board v2',
    sku: 'ELEC-CIRC-V2',
    quantity: 100,
    completedQty: 45,
    status: 'Active',
    priority: 'High',
    startDate: '2024-03-10',
    stages: [
        { id: 's1', name: 'PCB Etching', status: 'completed', assignee: 'Auto-Machine 1', completedAt: '2024-03-10T14:15:00.000Z' },
        { id: 's2', name: 'Component Mount', status: 'active', assignee: 'Line 2' },
        { id: 's3', name: 'Soldering', status: 'pending', assignee: 'Line 2' },
        { id: 's4', name: 'Firmware Load', status: 'pending', assignee: 'Tech A' },
    ],
    logs: [
        { time: '10:00 AM', message: 'Batch started', sub: 'Auto-Machine 1' },
        { time: '02:15 PM', message: 'PCB Etching completed', sub: 'System' }
    ]
  }
];

export const ProductionView: React.FC = () => {
  const [batches, setBatches] = useState<ProductionBatch[]>(INITIAL_BATCHES);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBatchPO, setNewBatchPO] = useState<string>('');
  const [newBatchQty, setNewBatchQty] = useState<number>(0);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Timestamp State
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState<string>('12:00');

  // Sync selectedBatch with batches state when batches update
  useEffect(() => {
    if (selectedBatch) {
        const updatedBatch = batches.find(b => b.id === selectedBatch.id);
        if (updatedBatch) setSelectedBatch(updatedBatch);
    }
  }, [batches]);

  // --- Computed Helpers ---

  const getAvailableQty = (poId: string) => {
    const po = MOCK_POS.find(p => p.id === poId);
    if (!po) return 0;
    
    const plannedQty = batches
        .filter(b => b.poId === poId)
        .reduce((acc, b) => acc + b.quantity, 0);
        
    return po.totalQty - po.fulfilledQty - plannedQty;
  };

  const handleCreateBatch = () => {
    setCreateError(null);
    if (!newBatchPO || newBatchQty <= 0) {
        setCreateError("Please select a PO and enter a valid quantity.");
        return;
    }

    const po = MOCK_POS.find(p => p.id === newBatchPO);
    if (!po) return;

    const available = getAvailableQty(newBatchPO);
    if (newBatchQty > available) {
        setCreateError(`Quantity exceeds available unbatched items (${available}).`);
        return;
    }

    const newBatch: ProductionBatch = {
        id: `BATCH-${1000 + batches.length + 1}`,
        poId: po.id,
        customer: po.customer,
        product: po.product,
        sku: po.sku,
        quantity: newBatchQty,
        completedQty: 0,
        status: 'Planned',
        priority: 'Normal',
        startDate: new Date().toISOString().split('T')[0],
        stages: JSON.parse(JSON.stringify(DEFAULT_STAGES_TEMPLATE)),
        logs: [{ time: new Date().toLocaleTimeString(), message: 'Batch created', sub: 'System' }]
    };

    setBatches([...batches, newBatch]);
    setIsCreateOpen(false);
    setNewBatchPO('');
    setNewBatchQty(0);
  };

  const openBatchDetail = (batch: ProductionBatch) => {
      setSelectedBatch(batch);
      setViewMode('detail');
  };

  const handleStageAction = (batchId: string, stageId: string) => {
      setBatches(prev => prev.map(b => {
          if (b.id !== batchId) return b;

          const stageIndex = b.stages.findIndex(s => s.id === stageId);
          if (stageIndex === -1) return b;

          const newStages = [...b.stages];
          const currentStage = newStages[stageIndex];
          
          let newStatus = currentStage.status;
          let completedAt = currentStage.completedAt;

          if (currentStage.status === 'pending') {
              newStatus = 'active';
          } else if (currentStage.status === 'active') {
              newStatus = 'completed';
              completedAt = new Date().toISOString();
          }

          newStages[stageIndex] = { ...currentStage, status: newStatus, completedAt };

          // Auto-activate next stage if we just completed one
          if (newStatus === 'completed' && stageIndex + 1 < newStages.length) {
              newStages[stageIndex + 1] = { ...newStages[stageIndex + 1], status: 'active' };
          }

          // Update main batch status
          let batchStatus = b.status;
          if (b.status === 'Planned' && newStages.some(s => s.status === 'active')) {
              batchStatus = 'Active';
          }
          if (newStages.every(s => s.status === 'completed')) {
              batchStatus = 'Completed';
          }

          // Add log
          const newLogs = [...b.logs];
          if (newStatus === 'completed') {
              newLogs.unshift({
                  time: new Date().toLocaleTimeString(),
                  message: `Stage "${currentStage.name}" completed`,
                  sub: 'User Action'
              });
          }

          return { ...b, stages: newStages, status: batchStatus, logs: newLogs };
      }));
  };

  const handleRevertStage = (batchId: string, stageId: string) => {
      setBatches(prev => prev.map(b => {
          if (b.id !== batchId) return b;

          const stageIndex = b.stages.findIndex(s => s.id === stageId);
          if (stageIndex === -1) return b;

          const newStages = [...b.stages];
          
          // Revert target stage to active
          newStages[stageIndex] = {
              ...newStages[stageIndex],
              status: 'active',
              completedAt: undefined
          };

          // If there was a next stage that became active, revert it to pending
          if (stageIndex + 1 < newStages.length && newStages[stageIndex + 1].status === 'active') {
              newStages[stageIndex + 1] = {
                  ...newStages[stageIndex + 1],
                  status: 'pending'
              };
          }

          // Update Batch Status if needed (if we revert from Completed, it becomes Active)
          let batchStatus = b.status;
          if (batchStatus === 'Completed') {
              batchStatus = 'Active';
          }

          // Add log
          const newLogs = [...b.logs, {
              time: new Date().toLocaleTimeString(),
              message: `Stage "${newStages[stageIndex].name}" marked incomplete`,
              sub: 'User Correction'
          }];

          return { ...b, stages: newStages, status: batchStatus, logs: newLogs };
      }));
  };

  const startEditingTimestamp = (stage: ProductionStage) => {
      if (stage.completedAt) {
        const d = new Date(stage.completedAt);
        setEditDate(d);
        setEditTime(format(d, 'HH:mm'));
      } else {
        const now = new Date();
        setEditDate(now);
        setEditTime(format(now, 'HH:mm'));
      }
      setEditingStageId(stage.id);
  };

  const saveTimestamp = (batchId: string) => {
      if (!editingStageId || !editDate) return;
      
      const [hours, minutes] = editTime.split(':').map(Number);
      const finalDate = new Date(editDate);
      finalDate.setHours(hours);
      finalDate.setMinutes(minutes);
      
      const isoString = finalDate.toISOString();

      setBatches(prev => prev.map(b => {
          if (b.id !== batchId) return b;
          return {
              ...b,
              stages: b.stages.map(s => s.id === editingStageId ? { ...s, completedAt: isoString } : s)
          };
      }));
      setEditingStageId(null);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Planned': return 'bg-secondary text-secondary-foreground';
          case 'Active': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
          case 'Completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
          default: return 'bg-muted text-muted-foreground';
      }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Production</h1>
              <p className="text-muted-foreground mt-1">Manage active batches and manufacturing lines.</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Batch
            </Button>
          </div>

          {/* Active Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map(batch => {
                const progress = Math.round((batch.stages.filter(s => s.status === 'completed').length / batch.stages.length) * 100);
                return (
                    <Card key={batch.id} className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => openBatchDetail(batch)}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    {batch.id}
                                    <Badge variant="outline" className={cn("font-normal text-xs", getStatusColor(batch.status))}>
                                        {batch.status}
                                    </Badge>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">{batch.product}</p>
                            </div>
                            <Avatar initials={batch.customer.substring(0,2)} className="h-8 w-8 text-[10px]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Linked PO</span>
                                    <span className="font-medium">{batch.poId}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Batch Size</span>
                                    <span className="font-medium">{batch.quantity} units</span>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    Started {batch.startDate}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            
            {/* Empty State Placeholder if needed */}
            {batches.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                     <Factory className="w-12 h-12 mb-4 opacity-20" />
                     <p>No active production batches.</p>
                     <Button variant="link" onClick={() => setIsCreateOpen(true)}>Create one now</Button>
                 </div>
            )}
          </div>
        </>
      ) : (
        /* --- BATCH DETAIL VIEW --- */
        selectedBatch && (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">{selectedBatch.id}</h2>
                            <Badge variant="outline" className={getStatusColor(selectedBatch.status)}>{selectedBatch.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            {selectedBatch.product} • {selectedBatch.quantity} units • for {selectedBatch.customer}
                        </p>
                    </div>
                    <div className="ml-auto">
                        <Button variant="outline">
                            <X className="w-4 h-4 mr-2" /> Cancel Batch
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
                    <div className="col-span-2 space-y-6 overflow-y-auto pr-2">
                        {/* Stages Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Production Stages</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {selectedBatch.stages.map((stage, idx) => {
                                        const isNext = stage.status === 'pending' && (idx === 0 || selectedBatch.stages[idx-1].status === 'completed');
                                        
                                        // Identify the last completed stage to show the undo button
                                        const completedIndices = selectedBatch.stages.map((s, i) => s.status === 'completed' ? i : -1).filter(i => i !== -1);
                                        const lastCompletedIndex = completedIndices.length > 0 ? Math.max(...completedIndices) : -1;
                                        const isLastCompleted = idx === lastCompletedIndex;

                                        return (
                                            <div key={stage.id} className={cn("p-4 flex items-center gap-4 transition-colors", stage.status === 'active' && "bg-blue-50/50 dark:bg-blue-900/10")}>
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                                    stage.status === 'completed' ? "bg-green-100 text-green-700" :
                                                    stage.status === 'active' ? "bg-blue-100 text-blue-700 animate-pulse" :
                                                    "bg-muted text-muted-foreground"
                                                )}>
                                                    {stage.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={cn("font-medium text-sm", stage.status === 'completed' && "text-muted-foreground")}>
                                                        {stage.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">Assignee: {stage.assignee}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {stage.status === 'active' && (
                                                        <Button size="sm" onClick={() => handleStageAction(selectedBatch.id, stage.id)}>
                                                            Complete Stage
                                                        </Button>
                                                    )}
                                                    {isNext && (
                                                        <Button size="sm" variant="outline" onClick={() => handleStageAction(selectedBatch.id, stage.id)}>
                                                            <Play className="w-3 h-3 mr-2" /> Start
                                                        </Button>
                                                    )}
                                                    {stage.status === 'completed' && (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-2">
                                                                {editingStageId === stage.id ? (
                                                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                                                                        <Popover>
                                                                          <PopoverTrigger asChild>
                                                                             <Button
                                                                                variant="outline"
                                                                                className={cn(
                                                                                  "h-7 px-2 text-xs font-normal justify-start text-left w-[150px]",
                                                                                  !editDate && "text-muted-foreground"
                                                                                )}
                                                                              >
                                                                                <CalendarIcon className="mr-2 h-3 w-3" />
                                                                                {editDate ? format(editDate, "PPP") : <span>Pick a date</span>}
                                                                              </Button>
                                                                          </PopoverTrigger>
                                                                          <PopoverContent className="min-w-[280px] p-0 bg-popover border rounded-md shadow-lg">
                                                                            <Calendar
                                                                              mode="single"
                                                                              selected={editDate}
                                                                              onSelect={setEditDate}
                                                                              className="rounded-md border-0"
                                                                            />
                                                                            <div className="p-3 border-t flex items-center justify-between">
                                                                                 <span className="text-xs text-muted-foreground">Time</span>
                                                                                 <input 
                                                                                    type="time" 
                                                                                    className="h-7 text-xs border rounded px-2 bg-background"
                                                                                    value={editTime}
                                                                                    onChange={(e) => setEditTime(e.target.value)}
                                                                                 />
                                                                            </div>
                                                                          </PopoverContent>
                                                                        </Popover>
                                                                         
                                                                         <Button size="icon" className="h-7 w-7" onClick={() => saveTimestamp(selectedBatch.id)}>
                                                                             <Check className="w-3 h-3" />
                                                                         </Button>
                                                                         <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={() => setEditingStageId(null)}>
                                                                             <X className="w-3 h-3" />
                                                                         </Button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span 
                                                                            className="text-xs font-medium text-green-600 flex items-center cursor-pointer hover:underline decoration-dotted underline-offset-2"
                                                                            title="Click to edit timestamp"
                                                                            onClick={() => startEditingTimestamp(stage)}
                                                                        >
                                                                            Completed {stage.completedAt ? format(new Date(stage.completedAt), 'hh:mm a') : ''}
                                                                            <CalendarClock className="w-3 h-3 ml-1.5 opacity-50" />
                                                                        </span>
                                                                        {isLastCompleted && (
                                                                            <Button 
                                                                                variant="ghost" 
                                                                                size="sm" 
                                                                                className="h-6 px-2 text-xs text-muted-foreground hover:text-red-600"
                                                                                onClick={() => handleRevertStage(selectedBatch.id, stage.id)}
                                                                                title="Mark as incomplete"
                                                                            >
                                                                                <RotateCcw className="w-3 h-3 mr-1" /> Undo
                                                                            </Button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {editingStageId === stage.id && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Batch Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Linked PO</span>
                                    <Badge variant="secondary">{selectedBatch.poId}</Badge>
                                </div>
                                <Separator />
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">Progress</span>
                                    <div className="flex items-center gap-2">
                                        <Progress value={(selectedBatch.stages.filter(s=>s.status==='completed').length / selectedBatch.stages.length)*100} className="h-2" />
                                        <span className="text-xs font-medium">
                                            {Math.round((selectedBatch.stages.filter(s=>s.status==='completed').length / selectedBatch.stages.length)*100)}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Activity Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 relative pl-2 border-l ml-2">
                                    {selectedBatch.logs.map((log, i) => (
                                        <div key={i} className="relative pl-4">
                                            <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-muted-foreground ring-4 ring-background" />
                                            <p className="text-xs text-muted-foreground mb-0.5">{log.time}</p>
                                            <p className="text-sm font-medium">{log.message}</p>
                                            <p className="text-xs text-muted-foreground">{log.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
      )}

      {/* Create Batch Modal */}
      {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-lg bg-background shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <CardHeader className="border-b pb-4">
                      <CardTitle>Create Production Batch</CardTitle>
                      <p className="text-sm text-muted-foreground">Split a Purchase Order into manageable production batches.</p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                      {createError && (
                          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2" /> {createError}
                          </div>
                      )}

                      <div className="space-y-2">
                          <label className="text-sm font-medium">Select Purchase Order</label>
                          <Select 
                              value={newBatchPO} 
                              onChange={(val) => { setNewBatchPO(val); setNewBatchQty(0); setCreateError(null); }}
                              options={MOCK_POS.map(po => {
                                  const avail = getAvailableQty(po.id);
                                  return {
                                      label: `${po.id} - ${po.customer} (${avail} rem.)`,
                                      value: po.id
                                  };
                              })}
                              placeholder="Choose a pending order..."
                          />
                      </div>

                      {newBatchPO && (
                          <div className="p-4 bg-muted/30 rounded-md border">
                              <div className="flex justify-between text-sm mb-2">
                                  <span className="text-muted-foreground">Product:</span>
                                  <span className="font-medium">{MOCK_POS.find(p => p.id === newBatchPO)?.product}</span>
                              </div>
                              <div className="flex justify-between text-sm mb-2">
                                  <span className="text-muted-foreground">SKU:</span>
                                  <span className="font-mono text-xs">{MOCK_POS.find(p => p.id === newBatchPO)?.sku}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Available to Batch:</span>
                                  <Badge variant="outline" className="bg-background">{getAvailableQty(newBatchPO)} units</Badge>
                              </div>
                          </div>
                      )}

                      <div className="space-y-2">
                          <label className="text-sm font-medium">Batch Quantity</label>
                          <div className="flex items-center gap-2">
                              <Input 
                                  type="number" 
                                  min="1"
                                  max={newBatchPO ? getAvailableQty(newBatchPO) : 0}
                                  value={newBatchQty || ''} 
                                  onChange={(e) => setNewBatchQty(parseInt(e.target.value))}
                              />
                              <span className="text-sm text-muted-foreground w-12">units</span>
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreateBatch} disabled={!newBatchPO || newBatchQty <= 0}>Create Batch</Button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}
    </div>
  );
};
