
import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  cn, Separator, Select, Popover, PopoverContent, PopoverTrigger, Combobox
} from '@/components/ui/ui-primitives';
import {
  Search, Plus, ArrowLeft, Save, Copy, Trash2, 
  Layers, Box, GripVertical, ChevronDown, ChevronUp,
  FileText, Settings2, Tag, Check, ClipboardList, Download
} from 'lucide-react';
import { ProductDefinition, BOMItemDefinition, ProcessStageDefinition, InspectionChecklistItem } from '@/lib/types';

// Mock Inventory for Dropdowns
const MOCK_INVENTORY_OPTIONS = [
  { id: 'inv-1', name: 'Steel Sheet 4mm', unit: 'sheets' },
  { id: 'inv-2', name: 'M8 Hex Bolt', unit: 'pcs' },
  { id: 'inv-3', name: 'Circuit Board v2', unit: 'units' },
  { id: 'inv-4', name: 'Packaging Box', unit: 'pcs' },
  { id: 'inv-5', name: 'Industrial Paint (Black)', unit: 'L' },
  { id: 'inv-6', name: 'Rubber Seal 22mm', unit: 'pcs' },
  { id: 'inv-7', name: 'Aluminum Profile 2020', unit: 'm' },
];

interface MasterDataProps {
    products: ProductDefinition[];
    setProducts: React.Dispatch<React.SetStateAction<ProductDefinition[]>>;
}

export const MasterDataView: React.FC<MasterDataProps> = ({ products, setProducts }) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeProduct, setActiveProduct] = useState<ProductDefinition | null>(null);
  const [activeTab, setActiveTab] = useState<'bom' | 'process' | 'checklist'>('bom');
  const [specsCopied, setSpecsCopied] = useState(false);
  
  // Import state
  const [importOpen, setImportOpen] = useState(false);

  // Compute available categories dynamically
  const getAvailableCategories = React.useCallback((excludeId?: string) => {
    const cats = new Set<string>(['Visual', 'Dimensional', 'Functional', 'Packaging']);
    // Add categories from all existing products
    products.forEach(p => p.checklist?.forEach(c => c.category && cats.add(c.category)));
    // Add categories from current editing session
    activeProduct?.checklist?.forEach(c => {
        // Exclude the current item's category to prevent partial typing from appearing as a separate option
        // while the user is still typing it.
        if (c.category && c.id !== excludeId) {
            cats.add(c.category);
        }
    });
    
    return Array.from(cats).sort();
  }, [products, activeProduct]);

  const handleProductClick = (prod: ProductDefinition) => {
    // Deep copy to avoid direct mutation during edit
    setActiveProduct(JSON.parse(JSON.stringify(prod)));
    setViewMode('detail');
    setActiveTab('bom');
  };

  const handleCreate = () => {
    const newProd: ProductDefinition = {
      id: `prod-${Date.now()}`,
      sku: 'NEW-PROD',
      name: 'New Product',
      description: '',
      version: '1.0',
      lastModified: new Date().toISOString().split('T')[0],
      bom: [],
      stages: [],
      checklist: [],
      customFields: []
    };
    setActiveProduct(newProd);
    setViewMode('detail');
    setActiveTab('bom');
  };

  const handleBack = () => {
    setViewMode('list');
    setActiveProduct(null);
  };

  const handleSave = () => {
    if (!activeProduct) return;
    
    setProducts(prev => {
      const exists = prev.find(p => p.id === activeProduct.id);
      if (exists) {
        return prev.map(p => p.id === activeProduct.id ? activeProduct : p);
      }
      return [...prev, activeProduct];
    });
    handleBack();
  };

  const handleCopySpecs = () => {
    if (!activeProduct) return;

    const lines = [
      `Product Name: ${activeProduct.name}`,
      `SKU: ${activeProduct.sku}`,
      `Description: ${activeProduct.description || 'N/A'}`,
      ''
    ];

    if (activeProduct.customFields && activeProduct.customFields.length > 0) {
      activeProduct.customFields.forEach(field => {
        if (field.key && field.value) {
            lines.push(`${field.key}: ${field.value}`);
        }
      });
    } else {
        lines.push('No custom specifications defined.');
    }

    const textData = lines.join('\n');
    
    navigator.clipboard.writeText(textData).then(() => {
      setSpecsCopied(true);
      setTimeout(() => setSpecsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy specs:', err);
    });
  };

  // --- BOM Handlers ---
  const addBOMItem = () => {
    if (!activeProduct) return;
    
    // Smart default: find first unused inventory item
    const usedIds = new Set(activeProduct.bom.map(b => b.inventoryItemId));
    const nextAvailable = MOCK_INVENTORY_OPTIONS.find(opt => !usedIds.has(opt.id)) || MOCK_INVENTORY_OPTIONS[0];

    const newItem: BOMItemDefinition = {
      id: `bom-${Date.now()}`,
      inventoryItemId: nextAvailable.id,
      inventoryItemName: nextAvailable.name,
      quantity: 1,
      unit: nextAvailable.unit
    };
    setActiveProduct({
      ...activeProduct,
      bom: [...activeProduct.bom, newItem]
    });
  };

  const updateBOMItem = (id: string, field: keyof BOMItemDefinition, value: any) => {
    if (!activeProduct) return;
    const updatedBOM = activeProduct.bom.map(item => {
      if (item.id === id) {
        if (field === 'inventoryItemId') {
            // Update name and unit when item changes
            const invOption = MOCK_INVENTORY_OPTIONS.find(opt => opt.id === value);
            return { 
                ...item, 
                inventoryItemId: value,
                inventoryItemName: invOption?.name || '',
                unit: invOption?.unit || ''
            };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setActiveProduct({ ...activeProduct, bom: updatedBOM });
  };

  const removeBOMItem = (id: string) => {
    if (!activeProduct) return;
    setActiveProduct({
      ...activeProduct,
      bom: activeProduct.bom.filter(item => item.id !== id)
    });
  };

  // --- Stage Handlers ---
  const addStage = () => {
    if (!activeProduct) return;
    const newStage: ProcessStageDefinition = {
      id: `st-${Date.now()}`,
      name: 'New Stage',
      description: '',
      order: activeProduct.stages.length + 1,
      parameters: []
    };
    setActiveProduct({
      ...activeProduct,
      stages: [...activeProduct.stages, newStage]
    });
  };

  const updateStage = (stageId: string, field: keyof ProcessStageDefinition, value: any) => {
      if (!activeProduct) return;
      setActiveProduct({
          ...activeProduct,
          stages: activeProduct.stages.map(s => s.id === stageId ? { ...s, [field]: value } : s)
      });
  };

  const removeStage = (stageId: string) => {
      if (!activeProduct) return;
      setActiveProduct({
          ...activeProduct,
          stages: activeProduct.stages.filter(s => s.id !== stageId)
      });
  };

  const addParameter = (stageId: string) => {
      if (!activeProduct) return;
      setActiveProduct({
          ...activeProduct,
          stages: activeProduct.stages.map(s => {
              if (s.id === stageId) {
                  return {
                      ...s,
                      parameters: [...s.parameters, { id: `p-${Date.now()}`, name: 'Param', targetValue: '' }]
                  };
              }
              return s;
          })
      });
  };

  const updateParameter = (stageId: string, paramId: string, field: 'name' | 'targetValue', value: string) => {
    if (!activeProduct) return;
    setActiveProduct({
        ...activeProduct,
        stages: activeProduct.stages.map(s => {
            if (s.id === stageId) {
                return {
                    ...s,
                    parameters: s.parameters.map(p => p.id === paramId ? { ...p, [field]: value } : p)
                };
            }
            return s;
        })
    });
  };

  const removeParameter = (stageId: string, paramId: string) => {
    if (!activeProduct) return;
    setActiveProduct({
        ...activeProduct,
        stages: activeProduct.stages.map(s => {
            if (s.id === stageId) {
                return { ...s, parameters: s.parameters.filter(p => p.id !== paramId) };
            }
            return s;
        })
    });
  };

  // --- Checklist Handlers ---

  const addChecklistItem = () => {
      if (!activeProduct) return;
      const newItem: InspectionChecklistItem = {
          id: `chk-${Date.now()}`,
          label: '',
          category: 'Visual'
      };
      setActiveProduct({
          ...activeProduct,
          checklist: [...(activeProduct.checklist || []), newItem]
      });
  };

  const updateChecklistItem = (id: string, field: keyof InspectionChecklistItem, value: any) => {
      if (!activeProduct) return;
      const list = activeProduct.checklist || [];
      setActiveProduct({
          ...activeProduct,
          checklist: list.map(i => i.id === id ? { ...i, [field]: value } : i)
      });
  };

  const removeChecklistItem = (id: string) => {
      if (!activeProduct) return;
      const list = activeProduct.checklist || [];
      setActiveProduct({
          ...activeProduct,
          checklist: list.filter(i => i.id !== id)
      });
  };

  const importChecklistFromProduct = (sourceProductId: string) => {
      if (!activeProduct) return;
      const sourceProduct = products.find(p => p.id === sourceProductId);
      if (!sourceProduct || !sourceProduct.checklist) return;

      // Deep copy the checklist items with new IDs
      const newItems = sourceProduct.checklist.map(item => ({
          ...item,
          id: `chk-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }));

      setActiveProduct({
          ...activeProduct,
          checklist: [...(activeProduct.checklist || []), ...newItems]
      });
      setImportOpen(false);
  };


  // --- Custom Fields Handlers ---
  const addCustomField = () => {
    if (!activeProduct) return;
    setActiveProduct({
      ...activeProduct,
      customFields: [...(activeProduct.customFields || []), { key: '', value: '' }]
    });
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    if (!activeProduct) return;
    const newFields = [...(activeProduct.customFields || [])];
    newFields[index] = { ...newFields[index], [field]: value };
    setActiveProduct({ ...activeProduct, customFields: newFields });
  };

  const removeCustomField = (index: number) => {
    if (!activeProduct) return;
    const newFields = [...(activeProduct.customFields || [])];
    newFields.splice(index, 1);
    setActiveProduct({ ...activeProduct, customFields: newFields });
  };


  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Product Master Data</h1>
              <p className="text-muted-foreground mt-1">Define products, BOMs, and manufacturing processes.</p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </div>

          {/* List View */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b">
                <div className="relative max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-8" />
                </div>
            </div>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>BOM Items</TableHead>
                    <TableHead>Stages</TableHead>
                    <TableHead>Checklist Items</TableHead>
                    <TableHead className="text-right">Last Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((prod) => (
                    <TableRow 
                      key={prod.id} 
                      className="cursor-pointer group hover:bg-muted/50"
                      onClick={() => handleProductClick(prod)}
                    >
                      <TableCell className="font-mono font-medium">{prod.sku}</TableCell>
                      <TableCell className="font-medium">{prod.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal">{prod.version}</Badge></TableCell>
                      <TableCell>{prod.bom.length}</TableCell>
                      <TableCell>{prod.stages.length}</TableCell>
                      <TableCell>{prod.checklist?.length || 0}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{prod.lastModified}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        /* --- DETAIL VIEW --- */
        activeProduct && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <Input 
                                className="text-2xl font-bold h-auto py-1 px-2 -ml-2 border-transparent hover:border-input focus:border-input w-[400px]" 
                                value={activeProduct.name}
                                onChange={(e) => setActiveProduct({...activeProduct, name: e.target.value})}
                            />
                            <Badge className="h-6">v{activeProduct.version}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {activeProduct.sku}
                            </span>
                            <span className="text-sm text-muted-foreground">Last modified: {activeProduct.lastModified}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleBack}>Cancel</Button>
                    <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Main Content Area */}
                <div className="col-span-8 flex flex-col h-full min-h-0">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 mb-4 border-b pb-1">
                        <button 
                            onClick={() => setActiveTab('bom')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2",
                                activeTab === 'bom' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Box className="w-4 h-4 inline-block mr-2 mb-0.5" />
                            Bill of Materials
                        </button>
                        <button 
                            onClick={() => setActiveTab('process')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2",
                                activeTab === 'process' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Layers className="w-4 h-4 inline-block mr-2 mb-0.5" />
                            Production Stages
                        </button>
                        <button 
                            onClick={() => setActiveTab('checklist')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2",
                                activeTab === 'checklist' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ClipboardList className="w-4 h-4 inline-block mr-2 mb-0.5" />
                            Quality Checklist
                        </button>
                    </div>

                    <Card className="flex-1 overflow-hidden flex flex-col border-t-0 rounded-tl-none">
                        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                            {activeTab === 'bom' ? (
                                <div className="flex flex-col h-full">
                                    <div className="p-4 bg-muted/20 flex justify-between items-center border-b">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {activeProduct.bom.length} items required
                                        </span>
                                        <Button size="sm" onClick={addBOMItem} variant="secondary">
                                            <Plus className="w-3 h-3 mr-2" /> Add Material
                                        </Button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[40%]">Item</TableHead>
                                                    <TableHead className="w-[20%]">Quantity</TableHead>
                                                    <TableHead className="w-[20%]">Unit</TableHead>
                                                    <TableHead className="w-[10%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activeProduct.bom.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                                            No materials defined. Click "Add Material" to start.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    activeProduct.bom.map((item) => {
                                                        const usedInOtherRows = new Set(
                                                            activeProduct.bom
                                                              .filter(b => b.id !== item.id)
                                                              .map(b => b.inventoryItemId)
                                                        );
                                                        
                                                        const rowOptions = MOCK_INVENTORY_OPTIONS
                                                            .filter(opt => !usedInOtherRows.has(opt.id))
                                                            .map(opt => ({ label: opt.name, value: opt.id }));

                                                        return (
                                                            <TableRow key={item.id}>
                                                                <TableCell>
                                                                    <Select 
                                                                        value={item.inventoryItemId}
                                                                        onChange={(val) => updateBOMItem(item.id, 'inventoryItemId', val)}
                                                                        options={rowOptions}
                                                                        className="w-full"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input 
                                                                        type="number" 
                                                                        className="h-9" 
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateBOMItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground text-sm">
                                                                    {item.unit}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 dark:hover:text-red-400" onClick={() => removeBOMItem(item.id)}>
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : activeTab === 'process' ? (
                                <div className="flex flex-col h-full bg-muted/10">
                                    <div className="p-4 border-b bg-background flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Sequential Manufacturing Process
                                        </span>
                                        <Button size="sm" onClick={addStage} variant="secondary">
                                            <Plus className="w-3 h-3 mr-2" /> Add Stage
                                        </Button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-6 space-y-4">
                                        {activeProduct.stages.map((stage, index) => (
                                            <div key={stage.id} className="flex gap-4 group">
                                                <div className="flex flex-col items-center pt-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    {index !== activeProduct.stages.length - 1 && (
                                                        <div className="w-0.5 h-full bg-border my-2"></div>
                                                    )}
                                                </div>
                                                <Card className="flex-1">
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="grid gap-2 flex-1 mr-4">
                                                                <Input 
                                                                    className="font-semibold h-8" 
                                                                    value={stage.name}
                                                                    onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                                                                    placeholder="Stage Name"
                                                                />
                                                                <Input 
                                                                    className="text-xs text-muted-foreground h-7" 
                                                                    value={stage.description}
                                                                    onChange={(e) => updateStage(stage.id, 'description', e.target.value)}
                                                                    placeholder="Description..."
                                                                />
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 dark:hover:text-red-400" onClick={() => removeStage(stage.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="bg-muted/30 rounded-md p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center">
                                                                    <Settings2 className="w-3 h-3 mr-1" /> Parameters
                                                                </span>
                                                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addParameter(stage.id)}>
                                                                    <Plus className="w-3 h-3 mr-1" /> Add Param
                                                                </Button>
                                                            </div>
                                                            
                                                            {stage.parameters.length === 0 ? (
                                                                <div className="text-xs text-muted-foreground italic px-2">No parameters defined.</div>
                                                            ) : (
                                                                <div className="grid gap-2">
                                                                    {stage.parameters.map(param => (
                                                                        <div key={param.id} className="flex items-center gap-2">
                                                                            <Input 
                                                                                className="h-7 text-xs w-1/3" 
                                                                                placeholder="Name (e.g. Temp)"
                                                                                value={param.name}
                                                                                onChange={(e) => updateParameter(stage.id, param.id, 'name', e.target.value)}
                                                                            />
                                                                            <span className="text-muted-foreground text-xs">:</span>
                                                                            <Input 
                                                                                className="h-7 text-xs flex-1" 
                                                                                placeholder="Target (e.g. 200°C)"
                                                                                value={param.targetValue}
                                                                                onChange={(e) => updateParameter(stage.id, param.id, 'targetValue', e.target.value)}
                                                                            />
                                                                            <button className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 p-1" onClick={() => removeParameter(stage.id, param.id)}>
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </div>
                                        ))}
                                        {activeProduct.stages.length === 0 && (
                                            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                                                <p className="text-muted-foreground mb-2">No manufacturing stages defined.</p>
                                                <Button variant="outline" onClick={addStage}>Start Process Definition</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // --- CHECKLIST TAB ---
                                <div className="flex flex-col h-full">
                                    <div className="p-4 bg-muted/20 flex justify-between items-center border-b">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {activeProduct.checklist?.length || 0} checklist items
                                            </span>
                                            {/* Import Dropdown */}
                                            <Popover open={importOpen} onOpenChange={setImportOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                                                        <Download className="w-3 h-3 mr-1" /> Import from...
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72 p-0" align="start">
                                                    <div className="p-2">
                                                        <h4 className="font-medium text-xs mb-2 text-muted-foreground px-2">Select Product to Import From</h4>
                                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                                            {products
                                                                .filter(p => p.id !== activeProduct.id && p.checklist && p.checklist.length > 0)
                                                                .map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => importChecklistFromProduct(p.id)}
                                                                    className="w-full text-left px-2 py-1.5 hover:bg-accent rounded-sm text-sm"
                                                                >
                                                                    <div className="font-medium">{p.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{p.checklist?.length} items</div>
                                                                </button>
                                                            ))}
                                                            {products.filter(p => p.id !== activeProduct.id && p.checklist && p.checklist.length > 0).length === 0 && (
                                                                <div className="text-xs text-muted-foreground px-2 py-1">No other products with checklists available.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <Button size="sm" onClick={addChecklistItem} variant="secondary">
                                            <Plus className="w-3 h-3 mr-2" /> Add Item
                                        </Button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60%]">Checklist Requirement</TableHead>
                                                    <TableHead className="w-[30%]">Category</TableHead>
                                                    <TableHead className="w-[10%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(!activeProduct.checklist || activeProduct.checklist.length === 0) ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">
                                                            No checklist items defined.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    activeProduct.checklist.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                <Input 
                                                                    value={item.label}
                                                                    onChange={(e) => updateChecklistItem(item.id, 'label', e.target.value)}
                                                                    placeholder="e.g. Check for scratches"
                                                                    className="h-9"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Combobox 
                                                                    value={item.category}
                                                                    onChange={(val) => updateChecklistItem(item.id, 'category', val)}
                                                                    options={getAvailableCategories(item.id)}
                                                                    className="w-full"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 dark:hover:text-red-400" onClick={() => removeChecklistItem(item.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar: Metadata */}
                <div className="col-span-4 space-y-6 overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">General Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SKU Code</label>
                                <Input 
                                    value={activeProduct.sku}
                                    onChange={(e) => setActiveProduct({...activeProduct, sku: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <textarea 
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={activeProduct.description}
                                    onChange={(e) => setActiveProduct({...activeProduct, description: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Version</label>
                                <Input 
                                    value={activeProduct.version}
                                    onChange={(e) => setActiveProduct({...activeProduct, version: e.target.value})}
                                />
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center">
                                        <Tag className="w-3 h-3 mr-2" />
                                        Custom Fields
                                    </label>
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addCustomField}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Field
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {(activeProduct.customFields || []).map((field, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <Input 
                                                className="h-8 text-xs w-1/2" 
                                                placeholder="Label"
                                                value={field.key}
                                                onChange={(e) => updateCustomField(idx, 'key', e.target.value)}
                                            />
                                            <Input 
                                                className="h-8 text-xs flex-1" 
                                                placeholder="Value"
                                                value={field.value}
                                                onChange={(e) => updateCustomField(idx, 'value', e.target.value)}
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 shrink-0 hover:text-red-600 dark:hover:text-red-400"
                                                onClick={() => removeCustomField(idx)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!activeProduct.customFields || activeProduct.customFields.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic px-1">No custom fields added.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                                <Copy className="w-4 h-4 mr-2" /> Duplicate Product
                            </Button>
                             <Button 
                                variant="outline" 
                                className={cn("w-full justify-start transition-all", specsCopied && "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900")}
                                onClick={handleCopySpecs}
                            >
                                {specsCopied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" /> Copied Specs!
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4 mr-2" /> Copy Specs
                                    </>
                                )}
                            </Button>
                            <Separator className="my-2" />
                            <Button variant="destructive" className="w-full justify-start">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Product
                            </Button>
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
