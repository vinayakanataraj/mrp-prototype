
import React, { useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Input, Badge, Separator, Avatar,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Progress, cn, Select, Textarea
} from '@/components/ui/ui-primitives';
import { 
  Search, Plus, Filter, ArrowLeft, 
  CheckCircle2, AlertTriangle, XCircle, 
  ClipboardCheck, Camera, History, 
  MoreHorizontal, Printer, ChevronDown
} from 'lucide-react';
import { ProductDefinition, InspectionChecklistItem } from '@/lib/types';

// --- Types ---

interface InspectionItem {
  id: string;
  label: string;
  category: 'Visual' | 'Dimensional' | 'Functional' | 'Packaging' | string;
  status: 'pass' | 'fail' | 'na' | 'pending';
  notes?: string;
}

interface Inspection {
  id: string;
  batchId: string;
  product: string;
  sku: string;
  inspector: string;
  date: string;
  status: 'Pass' | 'Fail' | 'Conditional';
  score: number;
  items: InspectionItem[];
  overallNotes?: string;
  images?: number; // mock count of attached images
}

// --- Mock Data ---

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: 'INS-2024-884',
    batchId: 'BATCH-1001',
    product: 'Circuit Board v2',
    sku: 'ELEC-CIRC-V2',
    inspector: 'Sarah J.',
    date: '2024-03-12',
    status: 'Pass',
    score: 98,
    items: [],
    images: 2
  },
  {
    id: 'INS-2024-883',
    batchId: 'BATCH-0998',
    product: 'Hydraulic Pump X1',
    sku: 'HYD-PUMP-X1',
    inspector: 'Mike R.',
    date: '2024-03-11',
    status: 'Fail',
    score: 65,
    items: [],
    images: 4
  },
  {
    id: 'INS-2024-882',
    batchId: 'BATCH-0995',
    product: 'Steel Housing',
    sku: 'STL-SHEET-04',
    inspector: 'Sarah J.',
    date: '2024-03-10',
    status: 'Pass',
    score: 100,
    items: [],
    images: 0
  },
  {
    id: 'INS-2024-881',
    batchId: 'BATCH-0992',
    product: 'Circuit Board v2',
    sku: 'ELEC-CIRC-V2',
    inspector: 'Auto-Vision',
    date: '2024-03-09',
    status: 'Conditional',
    score: 85,
    items: [],
    images: 1
  }
];

const DEFAULT_CHECKLIST: InspectionItem[] = [
  { id: 'c1', label: 'General visual inspection', category: 'Visual', status: 'pending' },
  { id: 'c2', label: 'Packaging integrity check', category: 'Packaging', status: 'pending' },
];

interface QualityViewProps {
    products: ProductDefinition[];
}

export const QualityView: React.FC<QualityViewProps> = ({ products }) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create'>('list');
  const [inspections, setInspections] = useState<Inspection[]>(MOCK_INSPECTIONS);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  
  // Create State
  const [newInspection, setNewInspection] = useState<Partial<Inspection>>({
    items: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST))
  });
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState('All');

  // --- Helpers ---

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pass': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Pass</Badge>;
      case 'Fail': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Fail</Badge>;
      case 'Conditional': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50"><AlertTriangle className="w-3 h-3 mr-1"/> Review</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateScore = (items: InspectionItem[]) => {
    if (items.length === 0) return 0;
    const passed = items.filter(i => i.status === 'pass').length;
    const na = items.filter(i => i.status === 'na').length;
    const total = items.length - na;
    return total === 0 ? 0 : Math.round((passed / total) * 100);
  };

  const handleCreateStart = () => {
    setNewInspection({
      id: `INS-2024-${885 + inspections.length}`,
      date: new Date().toISOString().split('T')[0],
      inspector: 'Current User',
      status: 'Pass', // default
      items: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)),
      batchId: '',
      product: ''
    });
    setViewMode('create');
  };

  const handleBatchSelect = (batchId: string) => {
      // Mock logic to determine product from batch
      // In a real app, this would be a lookup against the batches table
      let productSku = '';
      let productName = '';
      
      if (batchId === 'BATCH-1001') {
          productSku = 'ELEC-CIRC-V2';
          productName = 'Circuit Board v2';
      } else if (batchId === 'BATCH-1002') {
          productSku = 'HYD-PUMP-X1';
          productName = 'Hydraulic Pump X1';
      } else {
          productName = 'Unknown Product';
      }

      // Find the product definition
      const productDef = products.find(p => p.sku === productSku);
      let newItems = DEFAULT_CHECKLIST;

      if (productDef && productDef.checklist && productDef.checklist.length > 0) {
          // Map Master Data checklist items to Inspection items
          newItems = productDef.checklist.map(chk => ({
              id: chk.id,
              label: chk.label,
              category: chk.category,
              status: 'pending'
          }));
      }

      setNewInspection({ 
          ...newInspection, 
          batchId, 
          product: productName,
          sku: productSku,
          items: newItems,
          score: 0 
      });
  };

  const handleCheckItem = (itemId: string, status: 'pass' | 'fail' | 'na') => {
    if (!newInspection.items) return;
    
    const updatedItems = newInspection.items.map(item => 
      item.id === itemId ? { ...item, status } : item
    );
    
    setNewInspection({
      ...newInspection,
      items: updatedItems,
      score: calculateScore(updatedItems)
    });
  };

  const handleNoteChange = (itemId: string, note: string) => {
    if (!newInspection.items) return;
    setNewInspection({
      ...newInspection,
      items: newInspection.items.map(item => item.id === itemId ? { ...item, notes: note } : item)
    });
  };

  const handleSubmitInspection = () => {
    const finalInspection = {
      ...newInspection,
      batchId: newInspection.batchId || 'BATCH-XXXX',
      product: newInspection.product || 'Unknown Product',
      sku: newInspection.sku || 'SKU-XXXX',
      status: (newInspection.score || 0) < 100 ? (newInspection.score || 0) < 70 ? 'Fail' : 'Conditional' : 'Pass'
    } as Inspection;

    setInspections([finalInspection, ...inspections]);
    setViewMode('list');
  };

  const openInspection = (insp: Inspection) => {
    setSelectedInspection(insp);
    setViewMode('detail');
  };

  // Group items by category for the checklist view
  const groupItems = (items: InspectionItem[]) => {
    const groups: Record<string, InspectionItem[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quality Inspections</h1>
              <p className="text-muted-foreground mt-1">Monitor product quality and record defect data.</p>
            </div>
            <Button onClick={handleCreateStart}>
              <Plus className="w-4 h-4 mr-2" />
              New Inspection
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First Pass Yield</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Defects Found</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">3 critical, 9 minor this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <History className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">Conditional passes requiring approval</p>
              </CardContent>
            </Card>
          </div>

          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search batch, product, or ID..." className="pl-8" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setFilterStatus(filterStatus === 'All' ? 'Pass' : 'All')}>
                   <Filter className="w-4 h-4 mr-2" /> {filterStatus === 'All' ? 'Filter' : filterStatus}
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inspection ID</TableHead>
                    <TableHead>Batch / Product</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.filter(i => filterStatus === 'All' || i.status === filterStatus).map((insp) => (
                    <TableRow key={insp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openInspection(insp)}>
                      <TableCell className="font-medium">{insp.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{insp.product}</span>
                            <span className="text-xs text-muted-foreground">{insp.batchId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{insp.date}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Avatar initials={insp.inspector.substring(0,2)} className="w-6 h-6 text-[10px]" />
                        {insp.inspector}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Progress value={insp.score} className="w-16 h-2" />
                            <span className="text-xs font-medium">{insp.score}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(insp.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* --- CREATE / DETAIL VIEW --- */}
      {(viewMode === 'create' || viewMode === 'detail') && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
           {/* Header */}
           <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => { setViewMode('list'); setSelectedInspection(null); }}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {viewMode === 'create' ? 'New Inspection' : selectedInspection?.id}
                            </h2>
                            {viewMode === 'detail' && selectedInspection && getStatusBadge(selectedInspection.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {viewMode === 'create' ? 'Complete the checklist below.' : `${selectedInspection?.product} • Examined by ${selectedInspection?.inspector}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {viewMode === 'create' ? (
                        <>
                            <Button variant="ghost" onClick={() => setViewMode('list')}>Cancel</Button>
                            <Button onClick={handleSubmitInspection}>
                                <ClipboardCheck className="w-4 h-4 mr-2" /> Submit Inspection
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline">
                            <Printer className="w-4 h-4 mr-2" /> Export Report
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Main Checklist Area */}
                <div className="col-span-8 flex flex-col h-full overflow-hidden">
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 pb-4">
                            <CardTitle className="text-base flex items-center justify-between">
                                Inspection Checklist
                                <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
                                    <span>Score: <strong className="text-foreground">{viewMode === 'create' ? newInspection.score : selectedInspection?.score}%</strong></span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0">
                            {viewMode === 'create' ? (
                                // --- EDITABLE CHECKLIST ---
                                newInspection.items && newInspection.items.length > 0 ? (
                                    Object.entries(groupItems(newInspection.items)).map(([category, items]) => (
                                        <div key={category} className="border-b last:border-0">
                                            <div className="bg-muted/10 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {category}
                                            </div>
                                            <div className="divide-y">
                                                {items.map(item => (
                                                    <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4">
                                                        <div className="flex-1 pt-1">
                                                            <p className="font-medium text-sm">{item.label}</p>
                                                            {item.status === 'fail' && (
                                                                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                                                    <Input 
                                                                        placeholder="Describe defect..." 
                                                                        className="h-8 text-xs bg-red-50 border-red-200"
                                                                        value={item.notes || ''}
                                                                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex bg-muted rounded-lg p-1 shrink-0">
                                                            <button 
                                                                onClick={() => handleCheckItem(item.id, 'pass')}
                                                                className={cn(
                                                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                                                    item.status === 'pass' ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground hover:bg-background/50"
                                                                )}
                                                            >
                                                                Pass
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCheckItem(item.id, 'fail')}
                                                                className={cn(
                                                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                                                    item.status === 'fail' ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:bg-background/50"
                                                                )}
                                                            >
                                                                Fail
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCheckItem(item.id, 'na')}
                                                                className={cn(
                                                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                                                    item.status === 'na' ? "bg-gray-500 text-white shadow-sm" : "text-muted-foreground hover:bg-background/50"
                                                                )}
                                                            >
                                                                N/A
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>No checklist items found for this product.</p>
                                        <p className="text-xs mt-1">Please define a checklist in Master Data.</p>
                                    </div>
                                )
                            ) : (
                                // --- READ ONLY DETAIL VIEW ---
                                <div className="p-8 text-center text-muted-foreground">
                                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>Detailed checklist view not populated for mock history items.</p>
                                    <Button variant="link" onClick={() => setViewMode('create')}>Try creating a new inspection</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar: Context */}
                <div className="col-span-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Inspection Context</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {viewMode === 'create' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Production Batch</label>
                                        <Select 
                                            options={[
                                                { label: 'BATCH-1001 (Circuit Board)', value: 'BATCH-1001' },
                                                { label: 'BATCH-1002 (Pump Housing)', value: 'BATCH-1002' }
                                            ]}
                                            value={newInspection.batchId}
                                            onChange={handleBatchSelect}
                                            placeholder="Select Batch..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Product</label>
                                        <Input value={newInspection.product} disabled className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Inspector</label>
                                        <Input value={newInspection.inspector} disabled className="bg-muted" />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-muted-foreground">Batch ID</span>
                                        <span className="text-sm font-medium">{selectedInspection?.batchId}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-sm text-muted-foreground">Product</span>
                                        <span className="text-sm font-medium">{selectedInspection?.product}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Date</span>
                                        <span className="text-sm font-medium">{selectedInspection?.date}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Media & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {viewMode === 'create' ? (
                                <>
                                    <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent/50 transition-colors">
                                        <Camera className="w-6 h-6 mb-2 text-muted-foreground" />
                                        <span className="text-xs font-medium text-muted-foreground">Click to upload photos</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Overall Summary</label>
                                        <Textarea 
                                            placeholder="Additional comments..." 
                                            className="min-h-[100px]"
                                            value={newInspection.overallNotes}
                                            onChange={(e) => setNewInspection({...newInspection, overallNotes: e.target.value})}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1,2].map(i => (
                                            <div key={i} className="aspect-square bg-muted rounded-md flex items-center justify-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                                <Camera className="w-6 h-6 text-muted-foreground opacity-50" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground italic mt-2">
                                        "Minor scratch observed on lower bezel. Passed based on cosmetic standard A2."
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
