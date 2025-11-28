import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Badge, cn } from '@/components/ui/ui-primitives';
import { TrendingUp, AlertCircle, Package, CheckCircle2 } from 'lucide-react';

const productionData = [
  { name: 'Mon', output: 400, defects: 24 },
  { name: 'Tue', output: 300, defects: 13 },
  { name: 'Wed', output: 550, defects: 48 },
  { name: 'Thu', output: 450, defects: 30 },
  { name: 'Fri', output: 600, defects: 20 },
];

const inventoryData = [
    { name: 'Steel', stock: 80 },
    { name: 'Plastic', stock: 45 },
    { name: 'Elec', stock: 20 },
    { name: 'Paint', stock: 90 },
];

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Plant Overview • Austin Plant A</p>
        </div>
        <div className="flex gap-2">
             <span className="text-sm text-muted-foreground self-center mr-2">Last updated: Just now</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350 <span className="text-xs text-muted-foreground font-normal">units</span></div>
            <p className="text-xs text-green-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1"/> +12% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">3.2%</div>
            <p className="text-xs text-muted-foreground mt-1">
                Target: &lt; 2.0%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">
                4 in QA, 6 in Production
            </p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Material Shortages</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">2 <span className="text-sm font-normal text-muted-foreground">items</span></div>
                <div className="flex gap-1 mt-2">
                    <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-500">Electronics</Badge>
                    <Badge variant="outline" className="text-[10px]">Packaging</Badge>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Production Output vs Defects</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip
                        cursor={{fill: 'hsl(var(--muted)/0.4)'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }}
                    />
                    <Bar dataKey="output" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="defects" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {inventoryData.map((item) => (
                    <div key={item.name} className="flex items-center">
                        <div className="w-16 text-sm font-medium">{item.name}</div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mx-2">
                            <div
                                className={cn("h-full rounded-full", item.stock < 30 ? "bg-destructive" : item.stock < 50 ? "bg-orange-500" : "bg-green-500")}
                                style={{ width: `${item.stock}%` }}
                            ></div>
                        </div>
                        <div className="w-12 text-right text-sm text-muted-foreground">{item.stock}%</div>
                    </div>
                ))}
            </div>
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-dashed">
                <h4 className="text-sm font-semibold mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                    <button className="text-xs bg-background border p-2 rounded hover:bg-accent transition text-left">
                        + Purchase Order
                    </button>
                    <button className="text-xs bg-background border p-2 rounded hover:bg-accent transition text-left">
                        + Quality Report
                    </button>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
