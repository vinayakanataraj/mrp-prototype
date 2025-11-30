
import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  cn, DropdownMock
} from '@/components/ui/ui-primitives';
import {
  Search, Plus, Filter, AlertTriangle,
  Package, ArrowUpDown, MoreHorizontal,
  RefreshCw, AlertCircle, CheckCircle2,
  TrendingDown, Pencil, Trash2, ListChecks, X
} from 'lucide-react';
import { InventoryItem } from '@/lib/types';

const MOCK_INVENTORY: (InventoryItem & { category: string, value: number, maxStock: number })[] = [
  { id: 'inv-1', sku: 'STL-SHEET-04', name: 'Steel Sheet 4mm', category: 'Raw Materials', stock: 1240, allocated: 200, unit: 'sheets', status: 'OK', value: 45.00, maxStock: 2000 },
  { id: 'inv-2', sku: 'BOLT-HEX-M8', name: 'M8 Hex Bolt', category: 'Hardware', stock: 450, allocated: 0, unit: 'pcs', status: 'Low', value: 0.15, maxStock: 2000 },
  { id: 'inv-3', sku: 'ELEC-CIRC-V2', name: 'Circuit Board v2', category: 'Electronics', stock: 12, allocated: 10, unit: 'units', status: 'Critical', value: 120.00, maxStock: 100 },
  { id: 'inv-4', sku: 'PKG-BOX-L', name: 'Large Cardboard Box', category: 'Packaging', stock: 4200, allocated: 500, unit: 'pcs', status: 'OK', value: 1.50, maxStock: 5000 },
  { id: 'inv-5', sku: 'PNT-IND-BLK', name: 'Industrial Paint (Black)', category: 'Consumables', stock: 25, allocated: 20, unit: 'L', status: 'Critical', value: 85.00, maxStock: 200 },
  { id: 'inv-6', sku: 'RUB-SEAL-22', name: 'Rubber Seal 22mm', category: 'Hardware', stock: 800, allocated: 150, unit: 'pcs', status: 'OK', value: 2.20, maxStock: 1000 },
  { id: 'inv-7', sku: 'ALU-PROF-20', name: 'Aluminum Profile 2020', category: 'Raw Materials', stock: 150, allocated: 120, unit: 'm', status: 'Low', value: 12.50, maxStock: 500 },
  { id: 'inv-8', sku: 'HYD-VALVE-X', name: 'Hydraulic Valve Type X', category: 'Components', stock: 65, allocated: 5, unit: 'units', status: 'OK', value: 240.00, maxStock: 100 },
];

export const InventoryView: React.FC = () => {
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Context Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Edit/Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryItem & { category: string, value: number, maxStock: number }>>({
    sku: '',
    name: '',
    category: '',
    stock: 0,
    allocated: 0,
    unit: 'pcs',
    status: 'OK',
    value: 0,
    maxStock: 100
  });

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<(InventoryItem & { category: string, value: number, maxStock: number }) | null>(null);

  // Bulk Edit State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkEditItems, setBulkEditItems] = useState<(InventoryItem & { category: string, value: number, maxStock: number, newStock: number })[]>([]);
  const [bulkSearch, setBulkSearch] = useState('');
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  const filteredData = inventory.filter(item => {
      const matchesFilter = filter === 'All' || item.status === filter;
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  const lowStockCount = inventory.filter(i => i.status !== 'OK').length;
  const totalValue = inventory.reduce((acc, item) => acc + (item.stock * item.value), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'Critical': return 'bg-destructive text-destructive-foreground border-transparent hover:bg-destructive/90';
        case 'Low': return 'text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-900/30 dark:bg-orange-900/20';
        case 'OK': return 'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-900/30 dark:bg-green-900/20';
        default: return 'text-muted-foreground';
    }
  };

  const getComputedStatus = (stock: number, max: number): 'OK' | 'Low' | 'Critical' => {
    if (!max || max <= 0) return 'OK';
    const ratio = stock / max;
    if (ratio <= 0.2) return 'Critical';
    if (ratio <= 0.3) return 'Low';
    return 'OK';
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    const stockVal = Number(newItem.stock) || 0;
    const maxVal = Number(newItem.maxStock) || 100;
    const computedStatus = getComputedStatus(stockVal, maxVal);

    const itemData = {
        sku: newItem.sku || 'UNK-000',
        name: newItem.name || 'Unnamed Item',
        category: newItem.category || 'General',
        stock: stockVal,
        allocated: Number(newItem.allocated) || 0,
        unit: newItem.unit || 'pcs',
        status: computedStatus,
        value: Number(newItem.value) || 0,
        maxStock: maxVal
    };

    if (isEditMode && editingId) {
        setInventory(prev => prev.map(item => 
            item.id === editingId ? { ...item, ...itemData } : item
        ));
    } else {
        const newItemWithId: any = {
            ...itemData,
            id: `inv-${Date.now()}`,
        };
        setInventory([...inventory, newItemWithId]);
    }

    closeAddModal();
  };

  const openAddModal = () => {
      setIsEditMode(false);
      setEditingId(null);
      setNewItem({
        sku: '', name: '', category: '', stock: 0, allocated: 0, unit: 'pcs', status: 'OK', value: 0, maxStock: 100
      });
      setIsAddModalOpen(true);
  };

  const openEditModal = (item: any) => {
      setNewItem({
          sku: item.sku,
          name: item.name,
          category: item.category,
          stock: item.stock,
          allocated: item.allocated,
          unit: item.unit,
          status: item.status,
          value: item.value,
          maxStock: item.maxStock
      });
      setEditingId(item.id);
      setIsEditMode(true);
      setIsAddModalOpen(true);
      setOpenMenuId(null);
  };

  const closeAddModal = () => {
      setIsAddModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setNewItem({
        sku: '', name: '', category: '', stock: 0, allocated: 0, unit: 'pcs', status: 'OK', value: 0, maxStock: 100
      });
  };

  const openDeleteModal = (item: any) => {
      setItemToDelete(item);
      setOpenMenuId(null);
  };

  const confirmDelete = () => {
      if (itemToDelete) {
          setInventory(prev => prev.filter(i => i.id !== itemToDelete.id));
          setItemToDelete(null);
      }
  };

  // Bulk Edit Functions
  const openBulkEdit = () => {
      setBulkEditItems([]);
      setBulkSearch('');
      setIsBulkOpen(true);
  };

  const addToBulkList = (item: typeof MOCK_INVENTORY[0]) => {
      if (!bulkEditItems.find(i => i.id === item.id)) {
          setBulkEditItems(prev => [...prev, { ...item, newStock: item.stock }]);
      }
      setBulkSearch('');
      setShowBulkDropdown(false);
  };

  const addAllToBulkList = () => {
      const newItems = inventory.filter(i => !bulkEditItems.find(b => b.id === i.id));
      const mappedItems = newItems.map(i => ({ ...i, newStock: i.stock }));
      setBulkEditItems(prev => [...prev, ...mappedItems]);
      setBulkSearch('');
      setShowBulkDropdown(false);
  };

  const updateBulkItemStock = (id: string, val: number) => {
      setBulkEditItems(prev => prev.map(item => 
          item.id === id ? { ...item, newStock: val } : item
      ));
  };

  const removeBulkItem = (id: string) => {
      setBulkEditItems(prev => prev.filter(item => item.id !== id));
  };

  const saveBulkChanges = () => {
      // Final validation check
      if (bulkEditItems.some(i => i.newStock > i.maxStock)) return;

      setInventory(prev => prev.map(item => {
          const bulkItem = bulkEditItems.find(b => b.id === item.id);
          if (bulkItem) {
            return { 
                ...item, 
                stock: bulkItem.newStock,
                status: getComputedStatus(bulkItem.newStock, item.maxStock)
            };
          }
          return item;
      }));
      setIsBulkOpen(false);
  };

  const bulkDropdownOptions = inventory.filter(
      item => 
        !bulkEditItems.find(b => b.id === item.id) &&
        (item.name.toLowerCase().includes(bulkSearch.toLowerCase()) || 
         item.sku.toLowerCase().includes(bulkSearch.toLowerCase()))
  );

  const hasBulkErrors = bulkEditItems.some(i => i.newStock > i.maxStock);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col relative">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1">Real-time stock levels across Austin Plant A.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={openBulkEdit}>
                <ListChecks className="w-4 h-4 mr-2" /> Bulk Edit
            </Button>
            <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Valuation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1 text-green-500" /> -2.5% from last month
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                    {lowStockCount}
                    {lowStockCount > 0 && <span className="flex h-2 w-2 rounded-full bg-destructive animate-pulse"></span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Items below reorder point
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Turnover Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">4.2x</div>
                <p className="text-xs text-muted-foreground mt-1">
                    Annualized inventory turnover
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search SKU, name, or category..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMock
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    trigger={
                         <Button variant="outline" size="icon" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <Filter className={cn("w-4 h-4", filter !== 'All' && "text-primary")} />
                        </Button>
                    }
                >
                    <div className="p-1">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Filter by Status</div>
                        {['All', 'OK', 'Low', 'Critical'].map(status => (
                             <button 
                                key={status}
                                onClick={() => { setFilter(status); setIsFilterOpen(false); }}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    filter === status && "bg-accent text-accent-foreground"
                                )}
                             >
                                {status}
                             </button>
                        ))}
                    </div>
                </DropdownMock>
            </div>
            <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
        </div>

        <div className="flex-1 overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[140px]">SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No items found matching your criteria.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((item) => (
                            <TableRow key={item.id} className="group hover:bg-muted/50">
                                <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                                    {item.sku}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-muted-foreground md:hidden">{item.category}</div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                    {item.category}
                                </TableCell>
                                <TableCell className="w-[250px]">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {item.stock} / {item.maxStock} {item.unit}
                                            </span>
                                            {item.allocated > 0 && (
                                                <span className="text-blue-500 font-medium text-[10px] bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
                                                    {item.allocated} alloc
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all",
                                                    item.status === 'Critical' ? "bg-destructive" : 
                                                    item.status === 'Low' ? "bg-orange-500" : "bg-green-500"
                                                )}
                                                style={{ width: `${Math.min(100, (item.stock / item.maxStock) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("font-normal", getStatusColor(item.status))}>
                                        {item.status === 'Critical' && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {item.status === 'Low' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                        {item.status === 'OK' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono">
                                    ${(item.stock * item.value).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <DropdownMock
                                        isOpen={openMenuId === item.id}
                                        onClose={() => setOpenMenuId(null)}
                                        trigger={
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8"
                                                onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        }
                                    >
                                        <button 
                                            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                            onClick={() => openEditModal(item)}
                                        >
                                            <Pencil className="w-3 h-3 mr-2" /> Edit
                                        </button>
                                        <button 
                                            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-red-600 dark:text-red-400 transition-colors"
                                            onClick={() => openDeleteModal(item)}
                                        >
                                            <Trash2 className="w-3 h-3 mr-2" /> Delete
                                        </button>
                                    </DropdownMock>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </Card>

      {/* Bulk Edit Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-4xl bg-background shadow-lg animate-in fade-in zoom-in-95 duration-200 border-border max-h-[90vh] flex flex-col">
                <CardHeader className="border-b px-6 py-4">
                    <CardTitle>Bulk Edit Inventory</CardTitle>
                    <p className="text-sm text-muted-foreground">Search and add items to edit their stock levels.</p>
                </CardHeader>
                <CardContent className="p-6 flex-1 overflow-hidden flex flex-col">
                    <div className="flex gap-2 mb-4 relative z-20">
                         <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search to add item..." 
                                className="pl-8"
                                value={bulkSearch}
                                onChange={(e) => {
                                    setBulkSearch(e.target.value);
                                    setShowBulkDropdown(true);
                                }}
                                onFocus={() => setShowBulkDropdown(true)}
                            />
                            {showBulkDropdown && bulkSearch && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowBulkDropdown(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-30 max-h-60 overflow-auto">
                                        {bulkDropdownOptions.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">No matching items found or already added.</div>
                                        ) : (
                                            bulkDropdownOptions.map(item => (
                                                <button
                                                    key={item.id}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex justify-between items-center"
                                                    onClick={() => addToBulkList(item)}
                                                >
                                                    <span>{item.name} <span className="text-muted-foreground text-xs ml-2">({item.sku})</span></span>
                                                    <Plus className="w-3 h-3 text-muted-foreground" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                         </div>
                         <Button variant="secondary" onClick={addAllToBulkList} disabled={bulkDropdownOptions.length === 0 && inventory.every(i => bulkEditItems.find(b => b.id === i.id))}>
                            Add All Remaining
                         </Button>
                    </div>

                    <div className="border rounded-md flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="w-[150px]">Current Stock</TableHead>
                                    <TableHead>Max Capacity</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bulkEditItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            List is empty. Search above to add items.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bulkEditItems.map(item => {
                                        const isError = item.newStock > item.maxStock;
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Input 
                                                            type="number" 
                                                            className={cn("h-8", isError && "border-destructive focus-visible:ring-destructive")}
                                                            value={item.newStock}
                                                            onChange={(e) => updateBulkItemStock(item.id, Number(e.target.value))}
                                                        />
                                                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                                                    </div>
                                                    {isError && (
                                                        <span className="text-[10px] text-destructive flex items-center mt-1">
                                                            <AlertCircle className="w-3 h-3 mr-1"/> Exceeds Max ({item.maxStock})
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{item.maxStock}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 dark:hover:text-red-400" onClick={() => removeBulkItem(item.id)}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 mt-2 border-t">
                        <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                        <Button onClick={saveBulkChanges} disabled={bulkEditItems.length === 0 || hasBulkErrors}>
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl bg-background shadow-lg animate-in fade-in zoom-in-95 duration-200 border-border">
                <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                    <CardTitle>{isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSaveItem} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SKU</label>
                                <Input 
                                    placeholder="e.g. P-1001" 
                                    value={newItem.sku} 
                                    onChange={e => setNewItem({...newItem, sku: e.target.value})} 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input 
                                    placeholder="Item Name" 
                                    value={newItem.name} 
                                    onChange={e => setNewItem({...newItem, name: e.target.value})} 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Input 
                                    placeholder="Category" 
                                    value={newItem.category} 
                                    onChange={e => setNewItem({...newItem, category: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Unit</label>
                                <Input 
                                    placeholder="pcs, kg, m..." 
                                    value={newItem.unit} 
                                    onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Stock</label>
                                <Input 
                                    type="number" 
                                    value={newItem.stock} 
                                    onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})} 
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Max Stock</label>
                                <Input 
                                    type="number" 
                                    value={newItem.maxStock} 
                                    onChange={e => setNewItem({...newItem, maxStock: Number(e.target.value)})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Allocated</label>
                                <Input 
                                    type="number" 
                                    value={newItem.allocated} 
                                    onChange={e => setNewItem({...newItem, allocated: Number(e.target.value)})} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Unit Value ($)</label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    value={newItem.value} 
                                    onChange={e => setNewItem({...newItem, value: Number(e.target.value)})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50">
                                    {(() => {
                                        const status = getComputedStatus(Number(newItem.stock || 0), Number(newItem.maxStock || 100));
                                        return (
                                            <Badge variant="outline" className={cn("font-normal", getStatusColor(status))}>
                                                {status === 'Critical' && <AlertCircle className="w-3 h-3 mr-1" />}
                                                {status === 'Low' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {status === 'OK' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                {status}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={closeAddModal}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {isEditMode ? 'Save Changes' : 'Add Item'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-background shadow-lg animate-in fade-in zoom-in-95 duration-200 border-border">
                 <CardHeader>
                    <CardTitle>Delete Item</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p className="text-sm text-muted-foreground mb-6">
                        Are you sure you want to delete <span className="font-medium text-foreground">{itemToDelete.name}</span>?
                        This action cannot be undone.
                     </p>
                     <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                     </div>
                 </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
};
