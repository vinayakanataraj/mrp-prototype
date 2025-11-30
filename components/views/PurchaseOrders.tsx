import React, { useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Input, Badge, Separator, Avatar,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Progress, cn 
} from '@/components/ui/ui-primitives';
import { 
  Search, Plus, Filter, ArrowLeft, 
  CheckCircle2, AlertTriangle, ArrowRight, 
  PackageOpen, FileText, MoreHorizontal 
} from 'lucide-react';
import { Order } from '@/lib/types';

// Mock Data
const MOCK_ORDERS: Order[] = [
  { id: 'PO-2024-001', customer: 'Acme Corp', product: 'Hydraulic Pump X1', status: 'Pending', progress: 10, dueDate: '2024-04-15' },
  { id: 'PO-2024-002', customer: 'Stark Ind', product: 'Arc Frame v2', status: 'Allocated', progress: 35, dueDate: '2024-04-20' },
  { id: 'PO-2024-003', customer: 'Wayne Ent', product: 'Comp. Graphene', status: 'Production', progress: 60, dueDate: '2024-04-22' },
  { id: 'PO-2024-004', customer: 'Cyberdyne', product: 'Neural Chipset', status: 'QA', progress: 90, dueDate: '2024-04-10' },
  { id: 'PO-2024-005', customer: 'Massive Dynamic', product: 'Sensor Array', status: 'Done', progress: 100, dueDate: '2024-04-01' },
];

// Mock BOM Data for Detail View
const BOM_ITEMS = [
  { id: 'm1', name: 'Steel Housing', required: 200, available: 500, unit: 'pcs' },
  { id: 'm2', name: 'Rubber Seals', required: 400, available: 350, unit: 'pcs' }, // Shortage
  { id: 'm3', name: 'Pump Piston', required: 200, available: 200, unit: 'pcs' },
  { id: 'm4', name: 'Packaging Box', required: 50, available: 1000, unit: 'pcs' },
];

export const PurchaseOrdersView: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('list');
    setTimeout(() => setSelectedOrder(null), 300); // Clear after transition
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500';
      case 'Allocated': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Production': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
      case 'QA': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Done': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
              <p className="text-muted-foreground mt-1">Manage incoming orders and allocate resources.</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Customer or PO#..." className="pl-8" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Data Table */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">PO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Due Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ORDERS.map((order) => (
                    <TableRow 
                      key={order.id} 
                      className="cursor-pointer group"
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell className="font-medium text-xs">{order.id}</TableCell>
                      <TableCell className="font-medium">{order.customer}</TableCell>
                      <TableCell>{order.product}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-1 rounded-full text-[10px] font-semibold border", getStatusColor(order.status))}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="flex items-center gap-2">
                          <Progress value={order.progress} className="h-2" />
                          <span className="text-[10px] text-muted-foreground w-8">{order.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{order.dueDate}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        /* --- DETAIL VIEW --- */
        selectedOrder && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            {/* Detail Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                 <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{selectedOrder.id}</h2>
                    <Badge variant="outline" className={cn("ml-2", getStatusColor(selectedOrder.status))}>
                        {selectedOrder.status}
                    </Badge>
                 </div>
                 <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
                    <Avatar initials={selectedOrder.customer.substring(0,2)} className="w-5 h-5 text-[10px]" />
                    {selectedOrder.customer} • Due {selectedOrder.dueDate}
                 </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Invoice
                </Button>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Left Column: Overview & BOM */}
                <div className="col-span-2 space-y-6 overflow-y-auto pr-2">
                    
                    {/* Status Workflow */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Order Progress</span>
                                <span className="text-sm text-muted-foreground">{selectedOrder.progress}%</span>
                            </div>
                            <Progress value={selectedOrder.progress} className="h-2 mb-6" />
                            
                            <div className="grid grid-cols-5 gap-2 text-center">
                                {['Reception', 'Allocated', 'Production', 'QA', 'Shipping'].map((step, idx) => {
                                    // Simple mock logic for active step based on progress
                                    const isActive = (selectedOrder.progress / 20) >= idx;
                                    return (
                                        <div key={step} className="flex flex-col items-center gap-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                                                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <span className={cn("text-[10px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{step}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resource Allocation Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>Bill of Materials & Allocation</span>
                                <Badge variant="outline" className="font-normal">
                                    Target: 50 Units
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>In Stock</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {BOM_ITEMS.map(item => {
                                        const isShortage = item.available < item.required;
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>{item.required} <span className="text-xs text-muted-foreground">{item.unit}</span></TableCell>
                                                <TableCell>{item.available} <span className="text-xs text-muted-foreground">{item.unit}</span></TableCell>
                                                <TableCell>
                                                    {isShortage ? (
                                                        <Badge variant="destructive" className="hover:bg-destructive/80">
                                                            <AlertTriangle className="w-3 h-3 mr-1" /> Shortage (-{item.required - item.available})
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                            
                            <div className="mt-6 p-4 bg-muted/30 rounded-lg border flex items-center justify-between">
                                <div className="text-sm">
                                    <p className="font-semibold">Allocation Status</p>
                                    <p className="text-muted-foreground">1 item requires vendor purchase order.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">Generate Vendor POs</Button>
                                    <Button size="sm" disabled>Allocate & Release</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Metadata & Activity */}
                <div className="col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Line Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-start gap-3">
                                 <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                    <PackageOpen className="w-6 h-6 text-muted-foreground" />
                                 </div>
                                 <div>
                                     <p className="font-medium text-sm">{selectedOrder.product}</p>
                                     <p className="text-xs text-muted-foreground">SKU: HYD-PUMP-X1</p>
                                     <p className="text-sm mt-1">Qty: 50</p>
                                 </div>
                             </div>
                             <Separator />
                             <div className="flex justify-between text-sm font-medium">
                                 <span>Total Value</span>
                                 <span>$12,500.00</span>
                             </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-200 dark:border-yellow-900/50">
                                <p className="text-xs text-yellow-800 dark:text-yellow-500">
                                    <strong>Customer Note:</strong> Please ensure double packaging for sea freight.
                                </p>
                            </div>
                            <Input className="mt-4 h-20 text-xs" placeholder="Add internal note..." />
                        </CardContent>
                    </Card>
                </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
