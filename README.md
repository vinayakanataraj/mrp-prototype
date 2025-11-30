# FactoryFlow MRP

A modern Manufacturing Resource Planning (MRP) system built with Next.js. This is currently a **frontend UI prototype** showcasing the complete user interface and workflow for a production-ready MRP application.

## 🎯 Project Overview

FactoryFlow MRP is designed to streamline manufacturing operations by providing a comprehensive platform for managing purchase orders, production workflows, inventory, quality control, and master data. The current implementation is a fully functional frontend prototype with hardcoded sample data, ready for backend integration.

## ✨ Features

### 📊 Dashboard
- Real-time overview of manufacturing operations
- Key performance indicators (KPIs) and metrics
- Visual charts and analytics using Recharts
- Quick access to critical information

### 🛒 Purchase Orders Management
- Create and track purchase orders
- Monitor order status (Pending, Allocated, Production, QA, Packing, Done)
- Progress tracking with visual indicators
- Due date management
- Customer and product information

### 🏭 Production Management
- Multi-stage production workflow tracking
- Stage-by-stage process monitoring
- Assignee management for each production stage
- Real-time status updates (Pending, Active, Completed, Blocked)
- Production parameters and specifications
- Timeline and completion tracking

### 📦 Inventory Management
- Real-time stock level monitoring
- Inventory allocation tracking
- Low stock alerts and critical status indicators
- SKU-based item management
- Unit tracking (sheets, pieces, units, etc.)
- Available vs. allocated stock visibility

### 🗂️ Master Data Management
- Product definition and versioning
- Bill of Materials (BOM) management
- Process stage definitions with parameters
- Quality inspection checklists
- Custom fields for product specifications
- Version control and modification tracking

### ✅ Quality Control & Inspections
- Product-specific inspection checklists
- Multi-category quality checks (Visual, Dimensional, Functional, Packaging)
- Inspection workflow management
- Quality assurance tracking
- Pass/Fail logging

### ⚙️ Settings & Administration
- User management and role-based access control
- Organization and plant management
- Permission management
- System configuration
- Multi-plant support

### 🎨 UI/UX Features
- **Dark Mode Support** - Toggle between light and dark themes
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Collapsible Sidebar** - Maximize workspace when needed
- **Notion-Inspired Design** - Clean, modern, and intuitive interface
- **Custom Scrollbars** - Premium feel with styled scrollbars
- **Smooth Animations** - Polished transitions and interactions

## 🔄 User Flow (Production Scenario)

### Typical Manufacturing Workflow:

1. **Order Creation** (Purchase Orders)
   - Customer places an order for a product
   - Order is created with customer details, product, quantity, and due date
   - Order status: `Pending`

2. **Material Allocation** (Inventory)
   - System checks inventory for required materials (BOM)
   - Materials are allocated to the order
   - Stock levels are updated
   - Order status: `Allocated`

3. **Production Planning** (Master Data)
   - Product definition is referenced for BOM and process stages
   - Production stages are identified from master data
   - Parameters and specifications are loaded

4. **Production Execution** (Production)
   - Order moves through defined production stages
   - Each stage is assigned to operators/teams
   - Stage parameters are monitored
   - Order status: `Production`

5. **Quality Inspection** (Quality)
   - Product undergoes inspection based on checklist
   - Visual, dimensional, functional, and packaging checks
   - Results are logged (Pass/Fail)
   - Order status: `QA`

6. **Packing & Completion** (Production)
   - Final packing stage
   - Order status: `Packing` → `Done`

7. **Dashboard Monitoring**
   - Real-time visibility of all orders
   - KPIs and metrics tracking
   - Bottleneck identification

## 🛠️ Technical Specifications

### Frontend Stack
- **Framework**: Next.js 16.0.5 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom component library (shadcn-inspired)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Utilities**: date-fns

### Architecture
- **Routing**: Next.js App Router with client-side navigation
- **State Management**: React hooks (useState, useEffect)
- **Component Structure**: Modular, reusable components
- **Type Safety**: Full TypeScript coverage
- **Styling System**: CSS variables with HSL color tokens
- **Theme**: Light/Dark mode with CSS custom properties

### Project Structure
```
mrp-next/
├── app/
│   ├── layout.tsx          # Root layout with Inter font
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles and theme
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── ui/
│   │   └── ui-primitives.tsx  # Reusable UI components
│   └── views/
│       ├── Dashboard.tsx
│       ├── PurchaseOrders.tsx
│       ├── Production.tsx
│       ├── Inventory.tsx
│       ├── MasterData.tsx
│       ├── Quality.tsx
│       └── Settings.tsx
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   └── data.ts             # Mock data (products, sidebar config)
└── public/                 # Static assets
```

### Design System
- **Color Palette**: HSL-based with semantic color tokens
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale
- **Border Radius**: Customizable radius system
- **Shadows**: Subtle elevation system
- **Animations**: Smooth transitions and fade-ins

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2017+ JavaScript support
- CSS Grid and Flexbox

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository** (or navigate to the project directory)
   ```bash
   cd mrp-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode
```bash
npm run dev
```
The application will be available at **http://localhost:3000**

#### Production Build
```bash
npm run build
npm start
```

#### Linting
```bash
npm run lint
```

## 📝 Current Status

### ✅ Completed
- Full UI/UX implementation
- All view components (7 main views)
- Navigation and routing
- Theme system (light/dark mode)
- Responsive design
- Mock data integration
- TypeScript type system

### 🔜 Planned (Backend Integration)
- **Database**: Supabase with Drizzle ORM
- **Authentication**: Clerk (WorkOS)
- **API Routes**: Next.js API routes for CRUD operations
- **Real-time Updates**: Supabase real-time subscriptions
- **Multi-tenancy**: Organization and plant separation
- **Role-based Access Control**: Permission system
- **File Uploads**: Product images and documents
- **Reporting**: PDF generation and exports

## 🎨 Design Philosophy

The UI is inspired by Notion's clean and intuitive design:
- **Minimalistic**: Focus on content, not chrome
- **Customizable**: Flexible sidebar and layout
- **User-Empowering**: Easy access to all features
- **Professional**: Suitable for industrial environments
- **Accessible**: Clear hierarchy and readable typography

## 🔧 Development Notes

### Mock Data
Currently, the application uses hardcoded sample data located in `lib/data.ts`:
- 2 sample products (Hydraulic Pump X1, Circuit Board v2)
- Complete BOM, process stages, and quality checklists
- Sample sidebar configuration

### State Management
- Client-side state using React hooks
- Products state shared between Master Data and Quality views
- Theme state persisted via DOM class manipulation
- Sidebar state for collapse/expand functionality

### Import Aliases
The project uses TypeScript path aliases for clean imports:
- `@/lib/*` - Library files (types, data)
- `@/components/*` - React components
- `@/app/*` - App router files

## 📄 License

This project is proprietary software for FactoryFlow MRP.

## 👥 Contributing

This is currently a prototype. For backend integration and production deployment, please coordinate with the development team.

---

**Built with ❤️ using Next.js and React**
