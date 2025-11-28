# FactoryFlow MRP - Full-Stack Implementation Plan

**Version:** 2.0  
**Last Updated:** November 28, 2024  
**Status:** Backend Integration Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema (Drizzle ORM)](#database-schema-drizzle-orm)
5. [WorkOS Authentication](#workos-authentication)
6. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
7. [API Architecture](#api-architecture)
8. [Security Implementation](#security-implementation)
9. [Implementation Phases](#implementation-phases)
10. [Development Workflow](#development-workflow)

---

## Executive Summary

This document outlines the complete backend implementation for FactoryFlow MRP, transforming the existing frontend prototype into a production-ready full-stack application. The implementation focuses on:

- **WorkOS Authentication** for enterprise SSO and user management
- **Supabase PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations
- **Multi-tenant architecture** with organization and plant-level isolation
- **Row-Level Security (RLS)** for data protection
- **Next.js 15+ App Router** with Server Actions and API Routes

---

## Technology Stack

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.5+ | Full-stack framework with App Router |
| **WorkOS** | Latest | Enterprise authentication (SSO, SAML, OAuth) |
| **Supabase** | Latest | PostgreSQL database hosting |
| **Drizzle ORM** | Latest | Type-safe database queries and migrations |
| **Drizzle Kit** | Latest | Migration management |
| **Zod** | Latest | Runtime validation and type inference |
| **@workos-inc/node** | Latest | WorkOS Node.js SDK |

### Development Tools

- **TypeScript 5+** - Full type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **tsx** - TypeScript execution for migrations
- **dotenv** - Environment variable management

---

## Architecture Overview

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  Next.js 16+ App Router (Server Components + Client)        │
│  - Server Components (default)                               │
│  - Client Components (interactive UI)                        │
│  - Server Actions (mutations)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                      │
│                       WorkOS AuthKit                         │
│  - SSO (SAML, OAuth, Google, Microsoft)                     │
│  - Session Management                                        │
│  - Admin Portal for user management                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC                          │
│  - Service Layer (lib/services/)                            │
│  - Repository Pattern (lib/repositories/)                   │
│  - Validation (Zod schemas)                                  │
│  - Authorization (RBAC + ABAC)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│                   Drizzle ORM + Supabase                     │
│  - Type-safe queries                                         │
│  - Migration management                                      │
│  - Transaction support                                       │
│  - Connection pooling                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│                  Supabase PostgreSQL                         │
│  - Row Level Security (RLS)                                  │
│  - Indexes and constraints                                   │
│  - Triggers and functions                                    │
│  - Real-time subscriptions (optional)                        │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model

```
Organization (tenant_id)
    ├── Plants (manufacturing sites)
    │   ├── Plant A
    │   └── Plant B
    ├── Users (members)
    │   ├── Admin
    │   ├── Manager
    │   └── Operator
    └── Data (isolated by organization_id)
        ├── Products
        ├── Orders
        ├── Inventory
        └── Production Records
```

---

## Database Schema (Drizzle ORM)

### Core Schema Principles

1. **Multi-tenant isolation** - Every table has `organization_id`
2. **Audit trails** - `created_at`, `updated_at`, `created_by`, `updated_by`
3. **Soft deletes** - `deleted_at` for important records
4. **UUID primary keys** - For distributed systems and security
5. **Indexed foreign keys** - For query performance
6. **Enum types** - For status fields with fixed values

### Schema File Structure

```
lib/db/
├── schema/
│   ├── index.ts              # Export all schemas
│   ├── organizations.ts      # Organization & plants
│   ├── users.ts              # Users, roles, permissions
│   ├── products.ts           # Product master data
│   ├── inventory.ts          # Inventory items
│   ├── orders.ts             # Purchase orders
│   ├── production.ts         # Production stages & logs
│   ├── quality.ts            # Quality inspections
│   └── enums.ts              # Shared enums
├── migrations/               # Drizzle migrations
├── index.ts                  # Database client
└── seed.ts                   # Seed data for development
```

### Complete Database Schema

#### 1. Organizations & Plants

```typescript
// lib/db/schema/organizations.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workosOrganizationId: varchar('workos_organization_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  domain: varchar('domain', { length: 255 }),
  settings: jsonb('settings').$type<{
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    features?: string[];
  }>().default({}),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, suspended, deleted
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const plants = pgTable('plants', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(), // e.g., "PLT-001"
  location: text('location'),
  address: jsonb('address').$type<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }>(),
  isDefault: boolean('is_default').default(false),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  plants: many(plants),
  users: many(users),
  products: many(products),
}));

export const plantsRelations = relations(plants, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [plants.organizationId],
    references: [organizations.id],
  }),
  inventoryItems: many(inventoryItems),
  productionOrders: many(productionOrders),
}));
```

#### 2. Users, Roles & Permissions

```typescript
// lib/db/schema/users.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  workosUserId: varchar('workos_user_id', { length: 255 }).unique().notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatar: text('avatar'),
  phoneNumber: varchar('phone_number', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, invited, suspended
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(), // e.g., "admin", "manager", "operator"
  description: text('description'),
  isSystem: boolean('is_system').default(false), // System roles cannot be deleted
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  group: varchar('group', { length: 100 }).notNull(), // e.g., "manufacturing", "inventory"
  resource: varchar('resource', { length: 100 }).notNull(), // e.g., "orders", "products"
  action: varchar('action', { length: 50 }).notNull(), // create, read, update, delete, manage
  description: text('description'),
  isSystem: boolean('is_system').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  plantId: uuid('plant_id').references(() => plants.id), // Optional: scope role to specific plant
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));
```

#### 3. Product Master Data

```typescript
// lib/db/schema/products.ts
import { pgTable, uuid, varchar, text, timestamp, integer, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version: varchar('version', { length: 50 }).notNull().default('1.0'),
  category: varchar('category', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, discontinued, draft
  customFields: jsonb('custom_fields').$type<Record<string, string>>(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const billOfMaterials = pgTable('bill_of_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(), // sheets, pcs, kg, etc.
  order: integer('order').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const processStages = pgTable('process_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  estimatedDuration: integer('estimated_duration'), // in minutes
  parameters: jsonb('parameters').$type<Array<{
    id: string;
    name: string;
    targetValue: string;
    unit?: string;
  }>>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const qualityChecklists = pgTable('quality_checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // Visual, Dimensional, Functional, Packaging
  label: text('label').notNull(),
  description: text('description'),
  order: integer('order').default(0),
  isMandatory: boolean('is_mandatory').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  bom: many(billOfMaterials),
  stages: many(processStages),
  checklists: many(qualityChecklists),
}));
```

#### 4. Inventory Management

```typescript
// lib/db/schema/inventory.ts
import { pgTable, uuid, varchar, text, timestamp, decimal, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  plantId: uuid('plant_id').references(() => plants.id).notNull(),
  sku: varchar('sku', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  unit: varchar('unit', { length: 50 }).notNull(),
  stockQuantity: decimal('stock_quantity', { precision: 10, scale: 3 }).notNull().default('0'),
  allocatedQuantity: decimal('allocated_quantity', { precision: 10, scale: 3 }).notNull().default('0'),
  reorderLevel: decimal('reorder_level', { precision: 10, scale: 3 }),
  reorderQuantity: decimal('reorder_quantity', { precision: 10, scale: 3 }),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  location: varchar('location', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const inventoryTransactions = pgTable('inventory_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // purchase, sale, allocation, adjustment, return
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 3 }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }), // order, production_order, adjustment
  referenceId: uuid('reference_id'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryItems.organizationId],
    references: [organizations.id],
  }),
  plant: one(plants, {
    fields: [inventoryItems.plantId],
    references: [plants.id],
  }),
  transactions: many(inventoryTransactions),
}));
```

#### 5. Purchase Orders

```typescript
// lib/db/schema/orders.ts
import { pgTable, uuid, varchar, text, timestamp, decimal, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  plantId: uuid('plant_id').references(() => plants.id).notNull(),
  orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), 
  // pending, allocated, production, qa, packing, done, cancelled
  progress: integer('progress').default(0), // 0-100
  dueDate: date('due_date').notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  deletedAt: timestamp('deleted_at'),
});

// Relations
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchaseOrders.organizationId],
    references: [organizations.id],
  }),
  plant: one(plants, {
    fields: [purchaseOrders.plantId],
    references: [plants.id],
  }),
  product: one(products, {
    fields: [purchaseOrders.productId],
    references: [products.id],
  }),
  productionOrder: one(productionOrders),
}));
```

#### 6. Production Management

```typescript
// lib/db/schema/production.ts
import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const productionOrders = pgTable('production_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, active, completed, blocked
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const productionStageExecutions = pgTable('production_stage_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productionOrderId: uuid('production_order_id').references(() => productionOrders.id, { onDelete: 'cascade' }).notNull(),
  processStageId: uuid('process_stage_id').references(() => processStages.id).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, active, completed, blocked
  assignedTo: uuid('assigned_to').references(() => users.id),
  actualParameters: jsonb('actual_parameters').$type<Array<{
    id: string;
    name: string;
    actualValue: string;
  }>>().default([]),
  notes: text('notes'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [productionOrders.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  stageExecutions: many(productionStageExecutions),
}));
```

#### 7. Quality Control

```typescript
// lib/db/schema/quality.ts
import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const qualityInspections = pgTable('quality_inspections', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  inspectorId: uuid('inspector_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, in_progress, completed
  result: varchar('result', { length: 20 }), // pass, fail
  notes: text('notes'),
  inspectedAt: timestamp('inspected_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const qualityCheckResults = pgTable('quality_check_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  inspectionId: uuid('inspection_id').references(() => qualityInspections.id, { onDelete: 'cascade' }).notNull(),
  checklistItemId: uuid('checklist_item_id').references(() => qualityChecklists.id).notNull(),
  passed: boolean('passed').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const qualityInspectionsRelations = relations(qualityInspections, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [qualityInspections.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [qualityInspections.productId],
    references: [products.id],
  }),
  inspector: one(users, {
    fields: [qualityInspections.inspectorId],
    references: [users.id],
  }),
  checkResults: many(qualityCheckResults),
}));
```

### Database Indexes (Performance Optimization)

```typescript
// Add these to respective schema files
import { index, uniqueIndex } from 'drizzle-orm/pg-core';

// Organizations
export const organizationsIndex = {
  workosOrgIdIdx: index('workos_org_id_idx').on(organizations.workosOrganizationId),
  slugIdx: uniqueIndex('org_slug_idx').on(organizations.slug),
};

// Users
export const usersIndexes = {
  workosUserIdIdx: index('workos_user_id_idx').on(users.workosUserId),
  organizationIdIdx: index('user_org_id_idx').on(users.organizationId),
  emailIdx: index('user_email_idx').on(users.email),
};

// Products
export const productsIndexes = {
  orgIdIdx: index('product_org_id_idx').on(products.organizationId),
  skuIdx: index('product_sku_idx').on(products.sku),
  statusIdx: index('product_status_idx').on(products.status),
};

// Inventory
export const inventoryIndexes = {
  orgPlantIdx: index('inv_org_plant_idx').on(inventoryItems.organizationId, inventoryItems.plantId),
  skuIdx: index('inv_sku_idx').on(inventoryItems.sku),
  statusIdx: index('inv_status_idx').on(inventoryItems.status),
};

// Purchase Orders
export const ordersIndexes = {
  orgIdIdx: index('order_org_id_idx').on(purchaseOrders.organizationId),
  statusIdx: index('order_status_idx').on(purchaseOrders.status),
  dueDateIdx: index('order_due_date_idx').on(purchaseOrders.dueDate),
  orderNumberIdx: uniqueIndex('order_number_idx').on(purchaseOrders.orderNumber),
};
```

---

## WorkOS Authentication

### Overview

WorkOS provides enterprise-ready authentication with:
- **SSO** (SAML, OAuth, Google Workspace, Microsoft 365)
- **Directory Sync** (SCIM)
- **Admin Portal** for organization management
- **Magic Links** for passwordless auth
- **MFA** support

### Setup Steps

#### 1. Install Dependencies

```bash
npm install @workos-inc/authkit-nextjs
npm install -D @types/node
```

#### 2. Environment Variables

```env
# .env.local
WORKOS_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
WORKOS_CLIENT_ID=client_xxxxxxxxxxxxxxxxxxxx
WORKOS_REDIRECT_URI=http://localhost:3000/auth/callback
WORKOS_COOKIE_PASSWORD=<generate-32-character-random-string>

# Production
NEXT_PUBLIC_APP_URL=https://app.factoryflow.com
```

#### 3. Auth Configuration

```typescript
// lib/auth/workos.ts
import { WorkOS } from '@workos-inc/node';

export const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const authConfig = {
  clientId: process.env.WORKOS_CLIENT_ID!,
  redirectUri: process.env.WORKOS_REDIRECT_URI!,
  cookiePassword: process.env.WORKOS_COOKIE_PASSWORD!,
};
```

#### 4. Authentication Routes

```typescript
// app/auth/callback/route.ts
import { NextRequest } from 'next/server';
import { handleAuth } from '@workos-inc/authkit-nextjs';

export const GET = handleAuth();
```

```typescript
// app/auth/signin/route.ts
import { redirect } from 'next/navigation';
import { getSignInUrl } from '@workos-inc/authkit-nextjs';

export async function GET() {
  const signInUrl = await getSignInUrl();
  redirect(signInUrl);
}
```

```typescript
// app/auth/signout/route.ts
import { redirect } from 'next/navigation';
import { getSignOutUrl } from '@workos-inc/authkit-nextjs';

export async function GET() {
  const signOutUrl = await getSignOutUrl();
  redirect(signOutUrl);
}
```

#### 5. User Session Management

```typescript
// lib/auth/session.ts
import { getUser, withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const { user: workosUser } = await getUser();
  
  if (!workosUser) {
    return null;
  }

  // Sync user with database
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.workosUserId, workosUser.id))
    .limit(1);

  if (!dbUser) {
    // Create user if doesn't exist (first login)
    const [newUser] = await db
      .insert(users)
      .values({
        workosUserId: workosUser.id,
        organizationId: workosUser.organizationId, // From WorkOS
        email: workosUser.email,
        firstName: workosUser.firstName,
        lastName: workosUser.lastName,
        status: 'active',
      })
      .returning();
    
    return newUser;
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, dbUser.id));

  return dbUser;
}

export { withAuth };
```

#### 6. Middleware for Protected Routes

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

export default withAuth(
  async function middleware(req: NextRequest) {
    // Additional middleware logic
    return NextResponse.next();
  },
  {
    middlewareAuth: {
      enabled: true,
      unauthenticatedPaths: ['/auth/signin', '/public'],
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

#### 7. WorkOS Webhooks (User Sync)

```typescript
// app/api/webhooks/workos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { workos } from '@/lib/auth/workos';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const signature = req.headers.get('workos-signature');

  // Verify webhook signature
  const isValid = workos.webhooks.verify({
    payload: JSON.stringify(payload),
    signature: signature!,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { event, data } = payload;

  switch (event) {
    case 'user.created':
      await db.insert(users).values({
        workosUserId: data.id,
        organizationId: data.organizationId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        status: 'active',
      });
      break;

    case 'user.updated':
      await db
        .update(users)
        .set({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          updatedAt: new Date(),
        })
        .where(eq(users.workosUserId, data.id));
      break;

    case 'user.deleted':
      await db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.workosUserId, data.id));
      break;

    case 'organization.created':
      await db.insert(organizations).values({
        workosOrganizationId: data.id,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Multi-Tenancy Strategy

### Organization-Based Isolation

Every data access is scoped to the user's organization:

```typescript
// lib/services/base.service.ts
import { getCurrentUser } from '@/lib/auth/session';

export abstract class BaseService {
  protected async getOrganizationId(): Promise<string> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    return user.organizationId;
  }

  protected async getUserId(): Promise<string> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    return user.id;
  }
}
```

### Repository Pattern with Automatic Filtering

```typescript
// lib/repositories/product.repository.ts
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export class ProductRepository {
  async findAll(organizationId: string) {
    return db
      .select()
      .from(products)
      .where(
        and(
          eq(products.organizationId, organizationId),
          isNull(products.deletedAt)
        )
      );
  }

  async findById(id: string, organizationId: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.organizationId, organizationId),
          isNull(products.deletedAt)
        )
      )
      .limit(1);
    
    return product || null;
  }

  async create(data: NewProduct, organizationId: string, userId: string) {
    const [product] = await db
      .insert(products)
      .values({
        ...data,
        organizationId,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();
    
    return product;
  }
}
```

### Row-Level Security (RLS) in Supabase

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ... enable for all tables

-- Create policy for organization isolation
CREATE POLICY "Users can only access their organization's data"
ON products
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM users 
    WHERE workos_user_id = current_setting('app.current_user_id')
  )
);

-- Repeat for all tables with organization_id
```

---

## API Architecture

### Server Actions (Preferred for Mutations)

```typescript
// app/actions/products.ts
'use server';

import { revalidatePath } from 'next/cache';
import { ProductService } from '@/lib/services/product.service';
import { productCreateSchema } from '@/lib/validations/product';
import { z } from 'zod';

const productService = new ProductService();

export async function createProduct(data: z.infer<typeof productCreateSchema>) {
  // Validate input
  const validated = productCreateSchema.parse(data);
  
  // Create product
  const product = await productService.create(validated);
  
  // Revalidate cache
  revalidatePath('/master-products');
  
  return { success: true, product };
}

export async function updateProduct(
  id: string, 
  data: z.infer<typeof productCreateSchema>
) {
  const validated = productCreateSchema.parse(data);
  const product = await productService.update(id, validated);
  
  revalidatePath('/master-products');
  revalidatePath(`/master-products/${id}`);
  
  return { success: true, product };
}

export async function deleteProduct(id: string) {
  await productService.delete(id);
  revalidatePath('/master-products');
  return { success: true };
}
```

### API Routes (For External Integrations)

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product.service';
import { getCurrentUser } from '@/lib/auth/session';

const productService = new ProductService();

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await productService.getAll();
    return NextResponse.json({ data: products });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const product = await productService.create(data);
    
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Service Layer Pattern

```typescript
// lib/services/product.service.ts
import { BaseService } from './base.service';
import { ProductRepository } from '@/lib/repositories/product.repository';
import { db } from '@/lib/db';
import { billOfMaterials, processStages, qualityChecklists } from '@/lib/db/schema';

export class ProductService extends BaseService {
  private productRepo = new ProductRepository();

  async getAll() {
    const organizationId = await this.getOrganizationId();
    return this.productRepo.findAll(organizationId);
  }

  async getById(id: string) {
    const organizationId = await this.getOrganizationId();
    const product = await this.productRepo.findById(id, organizationId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }

  async create(data: NewProductInput) {
    const organizationId = await this.getOrganizationId();
    const userId = await this.getUserId();

    return db.transaction(async (tx) => {
      // Create product
      const [product] = await tx
        .insert(products)
        .values({
          ...data,
          organizationId,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      // Create BOM items
      if (data.bom?.length) {
        await tx.insert(billOfMaterials).values(
          data.bom.map((item) => ({
            ...item,
            productId: product.id,
          }))
        );
      }

      // Create process stages
      if (data.stages?.length) {
        await tx.insert(processStages).values(
          data.stages.map((stage) => ({
            ...stage,
            productId: product.id,
          }))
        );
      }

      // Create quality checklists
      if (data.checklists?.length) {
        await tx.insert(qualityChecklists).values(
          data.checklists.map((item) => ({
            ...item,
            productId: product.id,
          }))
        );
      }

      return product;
    });
  }

  async update(id: string, data: UpdateProductInput) {
    const organizationId = await this.getOrganizationId();
    const userId = await this.getUserId();

    // Verify ownership
    await this.getById(id);

    return this.productRepo.update(id, data, userId);
  }

  async delete(id: string) {
    const organizationId = await this.getOrganizationId();
    
    // Verify ownership
    await this.getById(id);

    return this.productRepo.softDelete(id);
  }
}
```

### Validation Schemas (Zod)

```typescript
// lib/validations/product.ts
import { z } from 'zod';

export const bomItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  notes: z.string().optional(),
});

export const stageParameterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  targetValue: z.string(),
  unit: z.string().optional(),
});

export const processStageSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  order: z.number().int().min(0),
  estimatedDuration: z.number().int().positive().optional(),
  parameters: z.array(stageParameterSchema).default([]),
});

export const qualityChecklistSchema = z.object({
  category: z.string().min(1).max(100),
  label: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().default(0),
  isMandatory: z.boolean().default(true),
});

export const productCreateSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  version: z.string().default('1.0'),
  category: z.string().max(100).optional(),
  customFields: z.record(z.string()).optional(),
  bom: z.array(bomItemSchema).optional(),
  stages: z.array(processStageSchema).optional(),
  checklists: z.array(qualityChecklistSchema).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();
```

---

## Security Implementation

### 1. Environment Security

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // WorkOS
  WORKOS_API_KEY: z.string().startsWith('sk_'),
  WORKOS_CLIENT_ID: z.string().startsWith('client_'),
  WORKOS_REDIRECT_URI: z.string().url(),
  WORKOS_COOKIE_PASSWORD: z.string().min(32),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### 2. Authorization Middleware

```typescript
// lib/auth/authorization.ts
import { getCurrentUser } from './session';
import { db } from '@/lib/db';
import { userRoles, rolePermissions, permissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function hasPermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Get user's permissions
  const userPermissions = await db
    .select({ permission: permissions.resource, action: permissions.action })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, user.id));

  // Check if user has permission
  return userPermissions.some(
    (p) => p.permission === resource && (p.action === action || p.action === 'manage')
  );
}

export function requirePermission(resource: string, action: string) {
  return async () => {
    const allowed = await hasPermission(resource, action as any);
    if (!allowed) {
      throw new Error('Forbidden: Insufficient permissions');
    }
  };
}
```

### 3. Input Sanitization

```typescript
// lib/utils/sanitize.ts
import validator from 'validator';

export function sanitizeString(input: string): string {
  return validator.escape(validator.trim(input));
}

export function sanitizeEmail(email: string): string {
  const normalized = validator.normalizeEmail(email);
  return normalized || '';
}
```

### 4. Rate Limiting

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function checkRateLimit(req: NextRequest) {
  const ip = req.ip ?? 'anonymous';
  try {
    await limiter.check(10, ip); // 10 requests per minute
  } catch {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation Setup (Week 1)

#### Tasks:
1. **Install Dependencies**
   ```bash
   npm install drizzle-orm postgres
   npm install -D drizzle-kit
   npm install @workos-inc/authkit-nextjs
   npm install zod
   npm install lru-cache
   ```

2. **Setup Environment Variables**
   - Create `.env.local` with all credentials
   - Setup Supabase project
   - Setup WorkOS project

3. **Configure Drizzle**
   ```typescript
   // drizzle.config.ts
   import type { Config } from 'drizzle-kit';
   
   export default {
     schema: './lib/db/schema/index.ts',
     out: './lib/db/migrations',
     driver: 'pg',
     dbCredentials: {
       connectionString: process.env.DATABASE_URL!,
     },
   } satisfies Config;
   ```

4. **Database Schema Implementation**
   - Create all schema files in `lib/db/schema/`
   - Export from `lib/db/schema/index.ts`
   - Generate initial migration: `npx drizzle-kit generate:pg`
   - Push to database: `npx drizzle-kit push:pg`

5. **WorkOS Integration**
   - Setup auth routes
   - Configure middleware
   - Test login/logout flow

**Deliverables:**
- ✅ Database schema created
- ✅ Migrations generated
- ✅ WorkOS authentication working
- ✅ Protected routes functioning

---

### Phase 2: Core Services (Week 2)

#### Tasks:
1. **Create Base Infrastructure**
   - Database client setup
   - Base service class
   - Repository pattern structure

2. **Implement User Management**
   - User sync with WorkOS
   - Role and permission seeding
   - Authorization helpers

3. **Organization & Plant Management**
   - Organization creation from WorkOS
   - Plant CRUD operations
   - Multi-tenant filtering

4. **Validation Schemas**
   - Create Zod schemas for all entities
   - Input validation utilities

**Deliverables:**
- ✅ User authentication & authorization
- ✅ Organization management
- ✅ Validation framework

---

### Phase 3: Master Data (Week 3)

#### Tasks:
1. **Product Management**
   - Product CRUD operations
   - BOM management
   - Process stages
   - Quality checklists

2. **Inventory Management**
   - Inventory item CRUD
   - Stock tracking
   - Transaction logging

3. **Server Actions**
   - Create product actions
   - Update frontend to use actions

**Deliverables:**
- ✅ Master data management working
- ✅ Frontend integrated with backend

---

### Phase 4: Orders & Production (Week 4)

#### Tasks:
1. **Purchase Orders**
   - Order creation and tracking
   - Status management
   - Due date tracking

2. **Production Management**
   - Production order creation
   - Stage execution tracking
   - Assignee management

3. **Material Allocation**
   - Inventory allocation logic
   - Stock deduction
   - Availability checks

**Deliverables:**
- ✅ Order management functional
- ✅ Production tracking working

---

### Phase 5: Quality & Settings (Week 5)

#### Tasks:
1. **Quality Inspections**
   - Inspection workflow
   - Checklist execution
   - Pass/fail logging

2. **Settings & Admin**
   - User management UI
   - Role management
   - Permission assignment

3. **Dashboard Analytics**
   - Real-time KPIs
   - Chart data aggregation

**Deliverables:**
- ✅ Quality control functional
- ✅ Settings complete
- ✅ Dashboard with real data

---

### Phase 6: Polish & Production (Week 6)

#### Tasks:
1. **Testing**
   - Unit tests for services
   - Integration tests for API
   - E2E tests for critical flows

2. **Performance Optimization**
   - Query optimization
   - Caching strategy
   - Database indexing

3. **Security Audit**
   - OWASP top 10 check
   - Penetration testing
   - Security headers

4. **Documentation**
   - API documentation
   - User guide
   - Deployment guide

5. **Deployment**
   - Vercel deployment
   - Environment setup
   - Domain configuration

**Deliverables:**
- ✅ Production-ready application
- ✅ Complete documentation
- ✅ Deployed and accessible

---

## Development Workflow

### Database Migrations

```bash
# Generate migration after schema changes
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:migrate": "tsx lib/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx lib/db/seed.ts"
  }
}
```

### Git Workflow

```bash
# Feature branches
git checkout -b feature/product-management
git commit -m "feat: add product CRUD operations"
git push origin feature/product-management

# Create PR → Review → Merge to main
```

### Testing Strategy

```typescript
// __tests__/services/product.service.test.ts
import { ProductService } from '@/lib/services/product.service';
import { db } from '@/lib/db';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    service = new ProductService();
  });

  it('should create a product', async () => {
    const product = await service.create({
      sku: 'TEST-001',
      name: 'Test Product',
      version: '1.0',
    });

    expect(product.sku).toBe('TEST-001');
  });
});
```

---

## Appendix

### A. Drizzle Client Setup

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

### B. Migration Runner

```typescript
// lib/db/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigrations = async () => {
  const connection = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(connection);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  console.log('Migrations complete!');

  await connection.end();
};

runMigrations();
```

### C. Seed Data

```typescript
// lib/db/seed.ts
import { db } from './index';
import { permissions, roles, rolePermissions } from './schema';

async function seed() {
  console.log('Seeding database...');

  // Seed system permissions
  const systemPermissions = [
    { group: 'Manufacturing', resource: 'orders', action: 'read', description: 'View orders' },
    { group: 'Manufacturing', resource: 'orders', action: 'create', description: 'Create orders' },
    { group: 'Manufacturing', resource: 'orders', action: 'update', description: 'Update orders' },
    { group: 'Manufacturing', resource: 'orders', action: 'delete', description: 'Delete orders' },
    // ... more permissions
  ];

  await db.insert(permissions).values(systemPermissions);
  
  console.log('Seed complete!');
}

seed();
```

---

## Summary

This implementation plan provides a comprehensive roadmap for building a production-ready MRP system with:

✅ **Enterprise Authentication** - WorkOS for SSO and user management  
✅ **Type-Safe Database** - Drizzle ORM with full TypeScript support  
✅ **Multi-Tenancy** - Organization-based data isolation  
✅ **Security** - RLS, RBAC, input validation, rate limiting  
✅ **Scalability** - Proper indexing, connection pooling, caching  
✅ **Best Practices** - Repository pattern, service layer, validation  

**Timeline:** 6 weeks to production  
**Team Size:** 2-3 developers  
**Risk Level:** Low (proven tech stack)

---

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
