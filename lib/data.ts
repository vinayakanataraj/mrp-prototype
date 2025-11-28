import { SidebarGroup, ProductDefinition } from './types';

// Initial Sidebar Configuration
export const initialGroups: SidebarGroup[] = [
    {
        id: 'g1',
        label: 'Favorites',
        collapsed: false,
        items: [
            { id: 'i0', label: 'Dashboard', iconName: 'LayoutDashboard', viewId: 'dashboard' },
        ]
    },
    {
        id: 'g2',
        label: 'Manufacturing',
        collapsed: false,
        items: [
            { id: 'i1', label: 'Purchase Orders', iconName: 'ShoppingCart', viewId: 'orders' },
            { id: 'i2', label: 'Production', iconName: 'Factory', viewId: 'production' },
            { id: 'i3', label: 'Inventory', iconName: 'Package', viewId: 'inventory' },
        ]
    },
    {
        id: 'g3',
        label: 'Data Management',
        collapsed: false,
        items: [
            { id: 'i6', label: 'Master Data', iconName: 'Database', viewId: 'master-products' },
        ]
    },
    {
        id: 'g4',
        label: 'Quality Control',
        collapsed: false,
        items: [
            { id: 'i4', label: 'Inspections', iconName: 'ClipboardCheck', viewId: 'quality' },
        ]
    }
];

// Initial Mock Products Data
export const INITIAL_PRODUCTS: ProductDefinition[] = [
    {
        id: 'prod-1',
        sku: 'HYD-PUMP-X1',
        name: 'Hydraulic Pump X1',
        description: 'High pressure hydraulic pump for industrial applications.',
        version: '1.2',
        lastModified: '2024-03-10',
        bom: [
            { id: 'b1', inventoryItemId: 'inv-1', inventoryItemName: 'Steel Sheet 4mm', quantity: 2, unit: 'sheets' },
            { id: 'b2', inventoryItemId: 'inv-2', inventoryItemName: 'M8 Hex Bolt', quantity: 12, unit: 'pcs' },
            { id: 'b3', inventoryItemId: 'inv-6', inventoryItemName: 'Rubber Seal 22mm', quantity: 4, unit: 'pcs' },
        ],
        stages: [
            { id: 'st1', name: 'Material Cutting', description: 'Cut steel sheets to size', order: 1, parameters: [{ id: 'p1', name: 'Tolerance', targetValue: '±0.5mm' }] },
            { id: 'st2', name: 'Assembly A', description: 'Assemble main housing', order: 2, parameters: [{ id: 'p2', name: 'Torque', targetValue: '25Nm' }] },
            { id: 'st3', name: 'Painting', description: 'Apply protective coating', order: 3, parameters: [{ id: 'p3', name: 'Color', targetValue: 'Matte Black' }, { id: 'p4', name: 'Coats', targetValue: '2' }] },
        ],
        checklist: [
            { id: 'c1', label: 'Surface finish free of scratches/dents', category: 'Visual' },
            { id: 'c2', label: 'Color consistency matches master sample', category: 'Visual' },
            { id: 'c3', label: 'Pressure test @ 100psi', category: 'Functional' },
            { id: 'c4', label: 'Piston movement smooth', category: 'Functional' },
        ],
        customFields: [
            { key: 'Weight', value: '4.5kg' },
            { key: 'Material Grade', value: '316L' }
        ]
    },
    {
        id: 'prod-2',
        sku: 'ELEC-CIRC-V2',
        name: 'Circuit Board v2',
        description: 'Main control unit for Z-series automation.',
        version: '2.0',
        lastModified: '2024-03-12',
        bom: [
            { id: 'b4', inventoryItemId: 'inv-3', inventoryItemName: 'Circuit Board v2', quantity: 1, unit: 'units' },
            { id: 'b5', inventoryItemId: 'inv-4', inventoryItemName: 'Packaging Box', quantity: 1, unit: 'pcs' },
        ],
        stages: [
            { id: 'st4', name: 'PCB Inspection', description: 'Visual check of soldering', order: 1, parameters: [] },
            { id: 'st5', name: 'Firmware Flash', description: 'Upload v2.0 firmware', order: 2, parameters: [{ id: 'p5', name: 'Version', targetValue: '2.0.4' }] },
            { id: 'st6', name: 'Final Testing', description: 'Run diagnostic suite', order: 3, parameters: [{ id: 'p6', name: 'Pass Score', targetValue: '98%' }] },
        ],
        checklist: [
            { id: 'c5', label: 'Soldering joints inspection', category: 'Visual' },
            { id: 'c6', label: 'Component placement verification', category: 'Visual' },
            { id: 'c7', label: 'Power-on self test (POST)', category: 'Functional' },
            { id: 'c8', label: 'Firmware version verification', category: 'Functional' },
            { id: 'c9', label: 'ESD Packaging secure', category: 'Packaging' },
        ],
        customFields: [
            { key: 'Input Voltage', value: '24V DC' },
            { key: 'IP Rating', value: 'IP67' }
        ]
    }
];
