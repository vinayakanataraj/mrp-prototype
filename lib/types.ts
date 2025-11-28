
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  iconName: string;
  viewId: string;
}

export interface SidebarGroup {
  id: string;
  label: string;
  items: SidebarItem[];
  collapsed: boolean;
}

export interface Site {
  id: string;
  name: string;
  location: string;
}

export type ViewType = 'dashboard' | 'orders' | 'production' | 'inventory' | 'quality' | 'settings' | 'billing' | 'master-products';

export interface Order {
  id: string;
  customer: string;
  product: string;
  status: 'Pending' | 'Allocated' | 'Production' | 'QA' | 'Packing' | 'Done';
  progress: number;
  dueDate: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  allocated: number;
  unit: string;
  status: 'OK' | 'Low' | 'Critical';
}

export interface ProductionStage {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  assignee: string;
  completedAt?: string;
}

export interface QualityLog {
  id: string;
  orderId: string;
  result: 'Pass' | 'Fail';
  reason?: string;
  stage: string;
  timestamp: string;
}

// --- Master Data Types ---

export interface StageParameter {
  id: string;
  name: string;
  targetValue: string;
}

export interface ProcessStageDefinition {
  id: string;
  name: string;
  description: string;
  order: number;
  parameters: StageParameter[];
}

export interface BOMItemDefinition {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string; // Cached name for display
  quantity: number;
  unit: string;
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  category: 'Visual' | 'Dimensional' | 'Functional' | 'Packaging' | string;
}

export interface ProductDefinition {
  id: string;
  sku: string;
  name: string;
  description: string;
  version: string;
  bom: BOMItemDefinition[];
  stages: ProcessStageDefinition[];
  checklist?: InspectionChecklistItem[];
  customFields?: { key: string; value: string }[];
  category?: string;
  lastModified: string;
}

// --- Settings & Admin Types ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastActive: string;
  avatar?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
}

export interface Permission {
  id: string;
  group: 'Manufacturing' | 'Inventory' | 'Quality' | 'Admin';
  label: string;
}
