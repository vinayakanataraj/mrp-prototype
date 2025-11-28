'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DashboardView } from '@/components/views/Dashboard';
import { ProductionView } from '@/components/views/Production';
import { PurchaseOrdersView } from '@/components/views/PurchaseOrders';
import { InventoryView } from '@/components/views/Inventory';
import { MasterDataView } from '@/components/views/MasterData';
import { QualityView } from '@/components/views/Quality';
import { SettingsView } from '@/components/views/Settings';
import { SidebarGroup, ViewType, ProductDefinition } from '@/lib/types';
import { initialGroups, INITIAL_PRODUCTS } from '@/lib/data';
import { cn } from '@/components/ui/ui-primitives';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarGroups, setSidebarGroups] = useState<SidebarGroup[]>(initialGroups);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Shared Data State
  const [products, setProducts] = useState<ProductDefinition[]>(INITIAL_PRODUCTS);

  // Initial Theme check
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'orders':
        return <PurchaseOrdersView />;
      case 'production':
        return <ProductionView />;
      case 'inventory':
        return <InventoryView />;
      case 'master-products':
        return <MasterDataView products={products} setProducts={setProducts} />;
      case 'quality':
        return <QualityView products={products} />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-in fade-in">
            <div className="p-6 rounded-full bg-muted mb-4">
              <div className="w-12 h-12 border-2 border-dashed border-muted-foreground rounded-full"></div>
            </div>
            <h2 className="text-xl font-semibold mb-2">View Under Construction</h2>
            <p className="text-sm max-w-md text-center">
              This page ({activeView}) is part of the mockup generation but hasn't been fully implemented in this code demo.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        groups={sidebarGroups}
        setGroups={setSidebarGroups}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
