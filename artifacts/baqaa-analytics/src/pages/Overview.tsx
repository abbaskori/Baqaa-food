import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  ShoppingBag, 
  Ticket, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  format, 
  isToday, 
  isYesterday, 
  subDays, 
  startOfDay, 
  endOfDay, 
  parseISO,
  differenceInMinutes
} from "date-fns";
import { Order, Customer } from "../hooks/use-analytics";
import { formatCurrency, formatCurrencyShort, cn } from "../lib/utils";

export default function Overview({ orders, customers, loading }: { orders: Order[], customers: Customer[], loading: boolean }) {
  const stats = useMemo(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);

    const todayOrders = orders.filter(o => isToday(parseISO(o.created_at)));
    const yesterdayOrders = orders.filter(o => isYesterday(parseISO(o.created_at)));

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);

    const revenueTrend = yesterdayRevenue === 0 ? 0 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    const ordersTrend = yesterdayOrders.length === 0 ? 0 : ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100;

    const avgTicketSize = todayOrders.length === 0 ? 0 : todayRevenue / todayOrders.length;
    
    // Busiest Hour
    const hours: Record<number, number> = {};
    orders.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    const busiestHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    // 14-day Chart Data
    const chartData = Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(today, 13 - i);
      const dayOrders = orders.filter(o => format(parseISO(o.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        name: format(date, 'MMM dd'),
        revenue,
        orders: dayOrders.length
      };
    });

    // 7-day Sparkline
    const sparklineData = chartData.slice(-7).map(d => ({ value: d.revenue }));

    return {
      todayRevenue,
      revenueTrend,
      todayOrders: todayOrders.length,
      ordersTrend,
      avgTicketSize,
      busiestHour: busiestHour !== "—" ? `${busiestHour}:00` : "—",
      chartData,
      sparklineData,
      recentOrders: orders.slice(0, 5)
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 glass-morphism rounded-3xl" />)}
        </div>
        <div className="h-72 glass-morphism rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          title="Revenue" 
          value={formatCurrency(stats.todayRevenue)} 
          trend={stats.revenueTrend}
          icon={<TrendingUp className="text-emerald-400" />}
          color="emerald"
          sparkline={stats.sparklineData}
        />
        <StatCard 
          title="Orders" 
          value={stats.todayOrders.toString()} 
          trend={stats.ordersTrend}
          icon={<ShoppingBag className="text-indigo-400" />}
          color="indigo"
        />
        <StatCard 
          title="Avg Bill" 
          value={formatCurrency(stats.avgTicketSize)} 
          icon={<Ticket className="text-amber-400" />}
          color="amber"
        />
        <StatCard 
          title="Peak Time" 
          value={stats.busiestHour} 
          icon={<Clock className="text-rose-400" />}
          color="rose"
        />
      </div>

      {/* Primary Chart Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-6 rounded-[2.5rem] glow-indigo relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Performance</h3>
            <p className="text-lg font-black text-white">Revenue Trend</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
            Last 14 Days
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                interval={2}
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
                itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '12px' }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 10 }}
              />
              <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 4, 4]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Activity List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Live Activity</h3>
          <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">View All</button>
        </div>
        <div className="space-y-3">
          {stats.recentOrders.map((order, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={order.id} 
              className="glass p-5 rounded-[1.5rem] flex items-center justify-between hover:bg-white/5 transition-colors border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-xl shadow-inner border border-white/5">
                  {order.payment_method === 'Cash' ? '💵' : '💳'}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{order.customer_name || 'Walk-in Guest'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{format(parseISO(order.created_at), 'hh:mm a')}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">#{order.bill_number}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-emerald-400">{formatCurrency(order.total)}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Completed</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color, sparkline }: any) {
  const isPositive = trend > 0;
  
  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      className={cn(
        "glass p-5 rounded-3xl flex flex-col justify-between h-40 overflow-hidden relative border-white/5", 
        `glow-${color}`
      )}
    >
      <div className="flex items-start justify-between z-10">
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
          `bg-${color}-500/10 border border-${color}-500/20`
        )}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={cn(
            "flex items-center px-2 py-1 rounded-full text-[10px] font-black border", 
            isPositive 
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
              : "text-rose-400 bg-rose-500/10 border-rose-500/20"
          )}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      
      <div className="z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-0.5">{title}</p>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      </div>

      {sparkline && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color === 'emerald' ? '#10b981' : '#6366f1'} 
                strokeWidth={3} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

