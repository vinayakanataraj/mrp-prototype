
import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  cn, Separator, Avatar, Select, DropdownMock
} from '@/components/ui/ui-primitives';
import {
  User, Building2, Shield, CreditCard,
  Plus, Search, MoreHorizontal, Mail, CheckCircle2,
  Trash2, Copy, AlertCircle, Lock, Users, Pencil, Ban, UserCog, Power
} from 'lucide-react';
import { User as UserType, Role, Permission } from '@/lib/types';

// Mock Data
const MOCK_USERS: UserType[] = [
  { id: 'u1', name: 'John Doe', email: 'john@factoryflow.com', role: 'Admin', status: 'Active', lastActive: 'Just now', avatar: 'JD' },
  { id: 'u2', name: 'Sarah Jenkins', email: 'sarah@factoryflow.com', role: 'Plant Manager', status: 'Active', lastActive: '2 hours ago', avatar: 'SJ' },
  { id: 'u3', name: 'Mike Ross', email: 'mike@factoryflow.com', role: 'Operator', status: 'Active', lastActive: '5 mins ago', avatar: 'MR' },
  { id: 'u4', name: 'Emily Blunt', email: 'emily@factoryflow.com', role: 'Operator', status: 'Invited', lastActive: '-', avatar: 'EB' },
  { id: 'u5', name: 'David Kim', email: 'david@factoryflow.com', role: 'Viewer', status: 'Suspended', lastActive: '3 days ago', avatar: 'DK' },
];

const MOCK_ROLES: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Full access to all resources and settings.', usersCount: 1, permissions: ['all'] },
  { id: 'r2', name: 'Plant Manager', description: 'Can manage production, orders, and inventory.', usersCount: 1, permissions: ['production.manage', 'orders.manage', 'inventory.manage'] },
  { id: 'r3', name: 'Operator', description: 'Can view and update production tasks.', usersCount: 2, permissions: ['production.update', 'inventory.view'] },
  { id: 'r4', name: 'Viewer', description: 'Read-only access to dashboards.', usersCount: 1, permissions: ['dashboard.view'] },
];

const MOCK_PERMISSIONS: Permission[] = [
    { id: 'p1', group: 'Manufacturing', label: 'Manage Production' },
    { id: 'p2', group: 'Manufacturing', label: 'Execute Tasks' },
    { id: 'p3', group: 'Inventory', label: 'Manage Stock' },
    { id: 'p4', group: 'Inventory', label: 'View Stock' },
    { id: 'p5', group: 'Quality', label: 'Perform Inspections' },
    { id: 'p6', group: 'Admin', label: 'Manage Users' },
    { id: 'p7', group: 'Admin', label: 'Billing & Settings' },
];

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'roles' | 'billing'>('team');
  const [users, setUsers] = useState<UserType[]>(MOCK_USERS);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  
  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: '', role: 'Operator' });
  const [newRole, setNewRole] = useState<{name: string, description: string, permissions: string[]}>({ name: '', description: '', permissions: [] });

  // Role Edit/Delete State
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);

  // User Edit/Menu State
  const [openUserMenuId, setOpenUserMenuId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const handleInvite = () => {
      const newUser: UserType = {
          id: `u-${Date.now()}`,
          name: '',
          email: newInvite.email,
          role: newInvite.role,
          status: 'Invited',
          lastActive: '-',
          avatar: newInvite.email.substring(0, 2).toUpperCase()
      };
      setUsers([...users, newUser]);
      setIsInviteOpen(false);
      setNewInvite({ email: '', role: 'Operator' });
  };

  const openCreateRoleModal = () => {
      setEditingRoleId(null);
      setNewRole({ name: '', description: '', permissions: [] });
      setIsRoleModalOpen(true);
  };

  const openEditRoleModal = (role: Role) => {
      setEditingRoleId(role.id);
      setNewRole({
          name: role.name,
          description: role.description,
          permissions: role.permissions
      });
      setIsRoleModalOpen(true);
      setOpenRoleMenuId(null);
  };

  const handleSaveRole = () => {
      if (editingRoleId) {
          // Edit existing role
          setRoles(prev => prev.map(r => r.id === editingRoleId ? {
              ...r,
              name: newRole.name,
              description: newRole.description,
              permissions: newRole.permissions
          } : r));
      } else {
          // Create new role
          const role: Role = {
              id: `r-${Date.now()}`,
              name: newRole.name,
              description: newRole.description,
              usersCount: 0,
              permissions: newRole.permissions
          };
          setRoles([...roles, role]);
      }
      setIsRoleModalOpen(false);
      setNewRole({ name: '', description: '', permissions: [] });
      setEditingRoleId(null);
  };

  const confirmDeleteRole = () => {
      if (roleToDelete) {
          setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
          setRoleToDelete(null);
      }
  };

  const togglePermission = (id: string) => {
      setNewRole(prev => {
          const exists = prev.permissions.includes(id);
          return {
              ...prev,
              permissions: exists ? prev.permissions.filter(p => p !== id) : [...prev.permissions, id]
          };
      });
  };

  const handleSuspendUser = (userId: string) => {
      setUsers(prev => prev.map(u => {
          if (u.id !== userId) return u;
          // Toggle between Suspended and Active (or Invited if they were invited)
          const newStatus = u.status === 'Suspended' 
              ? (u.name ? 'Active' : 'Invited') 
              : 'Suspended';
          return { ...u, status: newStatus };
      }));
      setOpenUserMenuId(null);
  };

  const handleUpdateUserRole = () => {
      if (editingUser) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
          setEditingUser(null);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your organization, team, and preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
            {[
                { id: 'general', label: 'General', icon: Building2 },
                { id: 'team', label: 'Team Members', icon: Users },
                { id: 'roles', label: 'Roles & Permissions', icon: Shield },
                { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        activeTab === item.id 
                            ? "bg-secondary text-foreground" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                </button>
            ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                    AP
                                </div>
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium">Organization Name</label>
                                    <Input defaultValue="Austin Plant A" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Workspace URL</label>
                                <div className="flex items-center gap-2">
                                    <Input defaultValue="austin-plant-a" className="flex-1" />
                                    <span className="text-muted-foreground text-sm">.factoryflow.app</span>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button>Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-destructive">Delete Organization</h4>
                                    <p className="text-sm text-muted-foreground">Permanently remove this organization and all its data.</p>
                                </div>
                                <Button variant="destructive">Delete</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'team' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Team Members</CardTitle>
                            <Button onClick={() => setIsInviteOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Invite People
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search by name or email..." className="pl-8" />
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Active</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="flex items-center gap-3">
                                                <Avatar initials={user.avatar || '??'} className="w-8 h-8 text-xs" />
                                                <div>
                                                    <div className="font-medium">{user.name || user.email}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="secondary" 
                                                    className={cn(
                                                        "font-normal",
                                                        user.status === 'Active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                        user.status === 'Invited' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                    )}
                                                >
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {user.lastActive}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMock
                                                    isOpen={openUserMenuId === user.id}
                                                    onClose={() => setOpenUserMenuId(null)}
                                                    trigger={
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8"
                                                            onClick={() => setOpenUserMenuId(openUserMenuId === user.id ? null : user.id)}
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    }
                                                >
                                                    <button 
                                                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                                        onClick={() => { setEditingUser(user); setOpenUserMenuId(null); }}
                                                    >
                                                        <UserCog className="w-3 h-3 mr-2" /> Edit Role
                                                    </button>
                                                    <button 
                                                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-red-600 dark:text-red-400 transition-colors"
                                                        onClick={() => handleSuspendUser(user.id)}
                                                    >
                                                        {user.status === 'Suspended' ? (
                                                            <>
                                                                <Power className="w-3 h-3 mr-2" /> Activate User
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Ban className="w-3 h-3 mr-2" /> Suspend User
                                                            </>
                                                        )}
                                                    </button>
                                                </DropdownMock>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'roles' && (
                <div className="space-y-6">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Roles & Permissions</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Define access levels for your team.</p>
                            </div>
                            <Button onClick={openCreateRoleModal}>
                                <Plus className="w-4 h-4 mr-2" /> Create Role
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {roles.map(role => (
                                    <div key={role.id} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-primary" />
                                                <h4 className="font-semibold">{role.name}</h4>
                                            </div>
                                            <DropdownMock
                                                isOpen={openRoleMenuId === role.id}
                                                onClose={() => setOpenRoleMenuId(null)}
                                                trigger={
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6"
                                                        onClick={() => setOpenRoleMenuId(openRoleMenuId === role.id ? null : role.id)}
                                                    >
                                                        <MoreHorizontal className="w-3 h-3" />
                                                    </Button>
                                                }
                                            >
                                                <button 
                                                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                                    onClick={() => openEditRoleModal(role)}
                                                >
                                                    <Pencil className="w-3 h-3 mr-2" /> Edit Role
                                                </button>
                                                <button 
                                                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-red-600 dark:text-red-400 transition-colors"
                                                    onClick={() => { setRoleToDelete(role); setOpenRoleMenuId(null); }}
                                                >
                                                    <Trash2 className="w-3 h-3 mr-2" /> Delete Role
                                                </button>
                                            </DropdownMock>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4 h-10 line-clamp-2">
                                            {role.description}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {role.usersCount} users
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> {role.permissions.includes('all') ? 'Full Access' : `${role.permissions.length} permissions`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'billing' && (
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-6 p-4 bg-muted/20 rounded-lg border">
                                <div>
                                    <h3 className="font-bold text-lg">Pro Plan</h3>
                                    <p className="text-sm text-muted-foreground">$49/month per user</p>
                                </div>
                                <Button variant="outline">Manage Subscription</Button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Seats Used</span>
                                        <span className="text-muted-foreground">12 / 20</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[60%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Storage</span>
                                        <span className="text-muted-foreground">45GB / 1TB</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[4.5%]" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">INV-2024-001</TableCell>
                                        <TableCell>Mar 01, 2024</TableCell>
                                        <TableCell>$588.00</TableCell>
                                        <TableCell><Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Paid</Badge></TableCell>
                                        <TableCell><Button variant="ghost" size="sm">Download</Button></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">INV-2024-002</TableCell>
                                        <TableCell>Feb 01, 2024</TableCell>
                                        <TableCell>$588.00</TableCell>
                                        <TableCell><Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Paid</Badge></TableCell>
                                        <TableCell><Button variant="ghost" size="sm">Download</Button></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                 </div>
            )}
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-md bg-background animate-in fade-in zoom-in-95">
                  <CardHeader>
                      <CardTitle>Invite Team Members</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <div className="relative">
                              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                  placeholder="colleague@company.com" 
                                  className="pl-8"
                                  value={newInvite.email}
                                  onChange={(e) => setNewInvite({...newInvite, email: e.target.value})}
                              />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-medium">Role</label>
                          <Select 
                                value={newInvite.role}
                                onChange={(val) => setNewInvite({...newInvite, role: val})}
                                options={roles.map(r => ({ label: r.name, value: r.name }))}
                                className="w-full"
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                          <Button onClick={handleInvite} disabled={!newInvite.email}>Send Invite</Button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* Edit User Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm bg-background animate-in fade-in zoom-in-95">
                <CardHeader>
                    <CardTitle>Edit User Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 mb-4 p-2 bg-muted/20 rounded-md">
                        <Avatar initials={editingUser.avatar || '??'} className="w-10 h-10" />
                        <div>
                            <div className="font-medium">{editingUser.name || editingUser.email}</div>
                            <div className="text-xs text-muted-foreground">{editingUser.email}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Assign Role</label>
                        <Select 
                            value={editingUser.role}
                            onChange={(val) => setEditingUser({ ...editingUser, role: val })}
                            options={roles.map(r => ({ label: r.name, value: r.name }))}
                            className="w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button onClick={handleUpdateUserRole}>Save</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      {/* Role Create/Edit Modal */}
      {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-lg bg-background animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                  <CardHeader className="border-b">
                      <CardTitle>{editingRoleId ? 'Edit Role' : 'Create New Role'}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 overflow-auto space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-medium">Role Name</label>
                          <Input 
                              placeholder="e.g. Quality Inspector"
                              value={newRole.name}
                              onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Input 
                              placeholder="What can this role do?"
                              value={newRole.description}
                              onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                          />
                      </div>
                      
                      <div className="space-y-3 pt-2">
                          <label className="text-sm font-medium">Permissions</label>
                          <div className="space-y-4 border rounded-md p-4">
                              {Array.from(new Set(MOCK_PERMISSIONS.map(p => p.group))).map(group => (
                                  <div key={group}>
                                      <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{group}</h5>
                                      <div className="space-y-2">
                                          {MOCK_PERMISSIONS.filter(p => p.group === group).map(perm => (
                                              <div key={perm.id} className="flex items-center gap-2">
                                                  <input 
                                                      type="checkbox" 
                                                      id={perm.id}
                                                      className="rounded border-gray-300 text-primary focus:ring-primary"
                                                      checked={newRole.permissions.includes(perm.id)}
                                                      onChange={() => togglePermission(perm.id)}
                                                  />
                                                  <label htmlFor={perm.id} className="text-sm cursor-pointer select-none">
                                                      {perm.label}
                                                  </label>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                          <Button onClick={handleSaveRole} disabled={!newRole.name}>{editingRoleId ? 'Save Changes' : 'Create Role'}</Button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}

      {/* Role Delete Confirmation Modal */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-background shadow-lg animate-in fade-in zoom-in-95 duration-200 border-border">
                 <CardHeader>
                    <CardTitle>Delete Role</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p className="text-sm text-muted-foreground mb-6">
                        Are you sure you want to delete the role <span className="font-medium text-foreground">{roleToDelete.name}</span>?
                        Users assigned to this role may lose access permissions.
                     </p>
                     <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRoleToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteRole}>Delete</Button>
                     </div>
                 </CardContent>
            </Card>
        </div>
      )}

    </div>
  );
};
