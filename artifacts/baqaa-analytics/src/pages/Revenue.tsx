import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  format, 
  subDays, 
  startOfDay, 
  parseISO,
  isWithinInterval,
  endOfDay 
} from "date-fns";
import { Order } from "../hooks/use-analytics";
import { formatCurrency, cn } from "../lib/utils";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];

export default function Revenue({ orders, loading }: { orders: Order[], loading: boolean }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const stats = useMemo(() => {
    const today = new Date();
    const startDate = startOfDay(subDays(today, range - 1));
    const endDate = endOfDay(today);

    const filteredOrders = orders.filter(o => {
      const date = parseISO(o.created_at);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalDiscounts = filteredOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
    const potentialRevenue = totalRevenue + totalDiscounts;

    // Timeline data
    const timelineData = Array.from({ length: range }).map((_, i) => {
      const date = subDays(today, range - 1 - i);
      const dayOrders = filteredOrders.filter(o => format(parseISO(o.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      return {
        name: format(date, range > 7 ? 'MMM dd' : 'EEE'),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0)
      };
    });

    // Payment Methods
    const payments: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const method = o.payment_method || 'Unknown';
      payments[method] = (payments[method] || 0) + o.total;
    });
    const pieData = Object.entries(payments).map(([name, value]) => ({ name, value }));

    return {
      totalRevenue,
      totalDiscounts,
      discountImpact: potentialRevenue === 0 ? 0 : (totalDiscounts / potentialRevenue) * 100,
      timelineData,
      pieData,
      orderCount: filteredOrders.length,
      recentSales: filteredOrders.slice(0, 10)
    };
  }, [orders, range]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 glass-morphism rounded-2xl" />
        <div className="h-48 glass-morphism rounded-[2.5rem]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 glass-morphism rounded-3xl" />
          <div className="h-40 glass-morphism rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Range Switcher */}
      <div className="flex glass p-1 rounded-2xl border border-white/5">
        {[7, 30, 90].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r as any)}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
              range === r 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                : "text-slate-500"
            )}
          >
            {r} Days
          </button>
        ))}
      </div>

      {/* Main KPI Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-[2.5rem] glow-indigo text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <TrendingUp className="w-24 h-24 text-indigo-400" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Total Sales Stream</p>
        <h2 className="text-5xl font-black text-white tracking-tighter mb-4">
          {formatCurrency(stats.totalRevenue)}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            {stats.orderCount} Orders
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {range}D View
          </div>
        </div>
      </motion.div>

      {/* Area Chart Section */}
      <div className="glass p-6 rounded-[2.5rem] glow-indigo overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Growth Matrix</h3>
            <p className="text-lg font-black text-white">Revenue Timeline</p>
          </div>
          <Calendar className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.timelineData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                interval={range === 30 ? 6 : range === 90 ? 20 : 1}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                tickFormatter={(val) => `₹${val/1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '1.5rem',
                  backdropFilter: 'blur(10px)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#fff', fontWeight: 900 }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#revenueGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Payment Split */}
        <div className="glass p-6 rounded-[2.5rem] flex flex-col items-center justify-center">
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    fontSize: '10px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Top Method</p>
            <p className="text-xs font-black text-white uppercase">{stats.pieData.sort((a,b)=>b.value-a.value)[0]?.name || 'N/A'}</p>
          </div>
        </div>

        {/* Discount Impact Card */}
        <div className="glass p-6 rounded-[2.5rem] flex flex-col justify-between overflow-hidden relative glow-rose">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Percent className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Impact</span>
          </div>
          <div>
            <h4 className="text-3xl font-black text-white mb-1">{stats.discountImpact.toFixed(1)}%</h4>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Revenue Leakage</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/20">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.discountImpact}%` }}
              className="h-full bg-rose-500" 
            />
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Audit Stream</h3>
          <Calendar className="w-4 h-4 text-slate-600" />
        </div>
        <div className="space-y-3">
          {stats.recentSales.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass p-5 rounded-[1.5rem] flex items-center justify-between border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner",
                  order.payment_method === 'Cash' ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                )}>
                  {order.payment_method === 'Cash' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-black text-white">#{order.bill_number}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    {format(parseISO(order.created_at), 'MMM dd, hh:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-white tracking-tight">{formatCurrency(order.total)}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
