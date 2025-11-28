

import React, { useState } from 'react';
import {
  ChevronsUpDown,
  Plus,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Package,
  ClipboardCheck,
  Calendar,
  Moon,
  Sun,
  Database
} from 'lucide-react';
import { SidebarGroup, SidebarItem, Site, ViewType } from '@/lib/types';
import { Button, Avatar, Separator, DropdownMock, cn } from './ui/ui-primitives';

// Map icon strings to components
const iconMap: Record<string, React.ElementType> = {
  'LayoutDashboard': LayoutDashboard,
  'ShoppingCart': ShoppingCart,
  'Factory': Factory,
  'Package': Package,
  'ClipboardCheck': ClipboardCheck,
  'Calendar': Calendar,
  'Settings': Settings,
  'Database': Database,
};

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  groups: SidebarGroup[];
  setGroups: React.Dispatch<React.SetStateAction<SidebarGroup[]>>;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  groups,
  setGroups,
  collapsed,
  setCollapsed,
  isDark,
  toggleTheme
}) => {
  const [sitesOpen, setSitesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [currentSite, setCurrentSite] = useState<Site>({ id: '1', name: 'Austin Plant A', location: 'Austin, TX' });

  const toggleGroup = (groupId: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r bg-muted/30 transition-all duration-300 ease-in-out z-20",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* --- Top Area --- */}
      <div className="p-2 space-y-2">
        {/* Site Switcher */}
        {!collapsed ? (
            <DropdownMock
                isOpen={sitesOpen}
                onClose={() => setSitesOpen(false)}
                align="start"
                className="w-full"
                trigger={
                    <button
                        onClick={() => setSitesOpen(!sitesOpen)}
                        className="flex items-center w-full gap-2 p-2 text-sm font-medium transition-colors rounded-md hover:bg-accent text-foreground"
                    >
                        <Avatar initials="AP" className="w-6 h-6 text-xs bg-indigo-600 text-white rounded-md" />
                        <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="truncate">{currentSite.name}</span>
                        </div>
                        <ChevronsUpDown className="w-4 h-4 opacity-50" />
                    </button>
                }
            >
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Switch Plant</div>
                <button className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                    Berlin Factory
                </button>
                <button className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                    Tokyo Assembly
                </button>
                <Separator className="my-1"/>
                <button className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                    <Plus className="mr-2 h-4 w-4" /> Create Organization
                </button>
            </DropdownMock>
        ) : (
            <div className="flex justify-center py-2">
                 <Avatar initials="AP" className="w-8 h-8 bg-indigo-600 text-white rounded-md cursor-pointer" />
            </div>
        )}
      </div>

      {/* --- Navigation (Scrollable) --- */}
      <div className="flex-1 px-2 py-2 overflow-y-auto space-y-6 scrollbar-none">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            {!collapsed && group.label && (
              <div
                className="flex items-center justify-between px-2 text-xs font-semibold tracking-wider uppercase cursor-pointer text-muted-foreground group"
                onClick={() => toggleGroup(group.id)}
              >
                <span>{group.label}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform opacity-0 group-hover:opacity-100", group.collapsed && "-rotate-90")} />
              </div>
            )}

            {(!group.collapsed || collapsed) && (
                <div className="space-y-0.5">
                {group.items.map((item) => {
                    const Icon = iconMap[item.iconName] || HelpCircle;
                    const isActive = activeView === item.viewId;

                    return (
                    <div
                        key={item.id}
                        className={cn(
                        "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors relative",
                        isActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <Icon className={cn("w-4 h-4", isActive && "text-primary")} />

                        {!collapsed && (
                            <button
                                className="flex-1 text-left truncate"
                                onClick={() => onNavigate(item.viewId as ViewType)}
                            >
                                {item.label}
                            </button>
                        )}
                    </div>
                    );
                })}
                </div>
            )}
          </div>
        ))}
      </div>

      {/* --- Bottom Actions --- */}
      <div className="p-2 space-y-1 border-t bg-background/50 backdrop-blur-sm">
        
        {/* Settings Button */}
        <button
            onClick={() => onNavigate('settings')}
            className={cn(
                "flex items-center w-full gap-2 p-2 text-sm transition-colors rounded-md hover:bg-accent text-muted-foreground hover:text-foreground",
                activeView === 'settings' && "bg-secondary text-foreground",
                collapsed && "justify-center"
            )}
            title="Settings"
        >
            <Settings className={cn("w-4 h-4", activeView === 'settings' && "text-primary")} />
            {!collapsed && <span className="flex-1 text-left">Settings</span>}
        </button>

        <DropdownMock
            isOpen={userMenuOpen}
            onClose={() => setUserMenuOpen(false)}
            align="start"
            side="top"
            className="w-full"
            trigger={
                <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={cn("flex items-center w-full gap-2 p-2 text-sm transition-colors rounded-md hover:bg-accent", collapsed && "justify-center")}
                >
                    <Avatar initials="JD" className="w-6 h-6 text-[10px]" />
                    {!collapsed && (
                        <div className="flex flex-col items-start text-xs">
                            <span className="font-medium">John Doe</span>
                            <span className="text-muted-foreground">Admin</span>
                        </div>
                    )}
                </button>
            }
        >
             <div className="px-2 py-1.5 text-xs font-semibold">John Doe</div>
             <div className="px-2 pb-1.5 text-xs text-muted-foreground">john@factoryflow.com</div>
             <Separator className="my-1"/>
             <button className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground" onClick={toggleTheme}>
                {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                Toggle Theme
             </button>
             <button className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                Log out
             </button>
        </DropdownMock>

        {/* Collapse Toggle */}
        <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-1/2 h-6 w-6 rounded-full border bg-background shadow-md z-50 hover:bg-accent hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
        >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>
    </aside>
  );
};
