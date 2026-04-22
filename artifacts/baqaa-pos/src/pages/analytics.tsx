import { useState, useMemo } from "react";
import { useOrders } from "@/hooks/use-data";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { format, isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { TrendingUp, CreditCard, Banknote, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Analytics() {
  const { data: allOrders, resetData } = useOrders();
  const [timeFilter, setTimeFilter] = useState<'daily'|'weekly'|'monthly'|'all'|'custom'>('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const orders = useMemo(() => {
    if(timeFilter === 'all') return allOrders;
    return allOrders.filter(o => {
      const d = parseISO(o.createdAt);
      if(timeFilter === 'daily') return isToday(d);
      if(timeFilter === 'weekly') return isThisWeek(d);
      if(timeFilter === 'monthly') return isThisMonth(d);
      if(timeFilter === 'custom') return format(d, 'yyyy-MM-dd') === selectedDate;
      return true;
    });
  }, [allOrders, timeFilter, selectedDate]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const cashOrders = orders.filter(o => o.paymentMethod === 'Cash');
    const onlineOrders = orders.filter(o => o.paymentMethod === 'Online');
    const uniqueCustomers = new Set(orders.map(o => o.customerPhone || o.customerName)).size;

    return {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
      uniqueCustomers,
      cashRevenue: cashOrders.reduce((sum, o) => sum + o.total, 0),
      onlineRevenue: onlineOrders.reduce((sum, o) => sum + o.total, 0),
      cashCount: cashOrders.length,
      onlineCount: onlineOrders.length,
    };
  }, [orders]);

  const pieData = [
    { name: 'Cash', value: stats.cashRevenue, color: '#f97316' }, // orange-500
    { name: 'Online', value: stats.onlineRevenue, color: '#ec4899' }, // pink-500
  ].filter(d => d.value > 0);

  const exportCSV = () => {
    const headers = "Bill No,Date,Customer,Phone,Items,Subtotal,Discount,Total,Payment\n";
    const rows = orders.map(o => `${o.billNumber},${format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm')},"${o.customerName}",${o.customerPhone},"${o.items.map(i=>`${i.quantity}x ${i.name}`).join('; ')}",${o.subtotal},${o.discountAmount},${o.total},${o.paymentMethod}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `baqaa_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if(window.confirm("WARNING: This will delete ALL orders and customer data permanently. Are you sure?")) {
      if(window.prompt("Type 'DELETE' to confirm") === "DELETE") {
        resetData();
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 relative p-4 md:p-8">
      <img src={`${import.meta.env.BASE_URL}images/analytics-bg.png`} className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none mix-blend-overlay" alt="" />
      
      <div className="max-w-[1600px] mx-auto relative z-10 space-y-6 md:space-y-8">
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track sales, revenue, and customer patterns.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 md:gap-4 items-center">
            <div className="flex gap-2">
              <select 
                value={timeFilter} 
                onChange={e => setTimeFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-white dark:bg-card border border-border rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-accent/20 font-bold text-sm text-foreground"
              >
                <option value="daily">Today</option>
                <option value="custom">Specific Day</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="all">All Time</option>
              </select>

              {timeFilter === 'custom' && (
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-4 py-2.5 bg-white dark:bg-card border border-border rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-accent/20 font-bold text-sm text-foreground"
                />
              )}
            </div>
            <button onClick={exportCSV} className="px-5 py-2.5 bg-white dark:bg-card text-foreground border border-border rounded-xl font-bold text-sm hover:shadow-md transition-all">Export CSV</button>
            <button onClick={handleReset} className="px-5 py-2.5 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 transition-all flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Reset Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<TrendingUp className="text-green-500 w-6 h-6" />} color="bg-green-50" />
          <StatCard title="Total Orders" value={stats.totalOrders} icon={<Banknote className="text-blue-500 w-6 h-6" />} color="bg-blue-50" />
          <StatCard title="Avg Order Value" value={formatCurrency(stats.avgOrderValue)} icon={<CreditCard className="text-purple-500 w-6 h-6" />} color="bg-purple-50" />
          <StatCard title="Customers" value={stats.uniqueCustomers} icon={<Users className="text-orange-500 w-6 h-6" />} color="bg-orange-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts */}
          <div className="lg:col-span-1 bg-white dark:bg-card rounded-3xl p-6 shadow-xl shadow-black/5 border border-border/50 flex flex-col">
            <h3 className="font-display font-bold text-lg mb-6 text-foreground">Payment Methods</h3>
            <div className="flex-1 min-h-[250px] relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop:'20px'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium">No payment data</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-2xl">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Cash</p>
                <p className="text-xl font-black text-orange-700 dark:text-orange-400">{formatCurrency(stats.cashRevenue)}</p>
                <p className="text-xs text-orange-600/70 mt-1">{stats.cashCount} orders</p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-950/30 p-4 rounded-2xl">
                <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">Online</p>
                <p className="text-xl font-black text-pink-700 dark:text-pink-400">{formatCurrency(stats.onlineRevenue)}</p>
                <p className="text-xs text-pink-600/70 mt-1">{stats.onlineCount} orders</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="lg:col-span-2 bg-white dark:bg-card rounded-3xl p-6 shadow-xl shadow-black/5 border border-border/50 flex flex-col">
            <h3 className="font-display font-bold text-lg mb-4 text-foreground">Recent Orders</h3>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-b-2 border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4 rounded-tl-xl">Bill No</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center rounded-tr-xl">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No orders found for this period.</td></tr>
                  )}
                  {orders.slice(0, 100).map(o => (
                    <tr key={o.id} className="hover:bg-muted/50 transition-colors text-foreground">
                      <td className="py-3 px-4 font-bold text-primary">#{o.billNumber}</td>
                      <td className="py-3 px-4">{format(new Date(o.createdAt), "dd MMM, hh:mm a")}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold">{o.customerName}</p>
                        {o.customerPhone && <p className="text-xs text-muted-foreground">{o.customerPhone}</p>}
                      </td>
                      <td className="py-3 px-4 text-right font-black">{formatCurrency(o.total)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${o.paymentMethod==='Cash'?'bg-orange-100 text-orange-700':'bg-pink-100 text-pink-700'}`}>
                          {o.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length > 100 && <p className="text-center text-sm text-muted-foreground mt-4">Showing last 100 orders. Export CSV for complete history.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({title, value, icon, color}: any) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-card p-6 rounded-3xl shadow-lg shadow-black/5 border border-border/50 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-black font-display mt-1 text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}
