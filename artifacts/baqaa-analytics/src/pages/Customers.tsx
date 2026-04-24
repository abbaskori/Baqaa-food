import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { 
  Users, 
  Crown, 
  UserPlus, 
  Heart,
  Star,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Order, Customer } from "../hooks/use-analytics";
import { formatCurrency, cn } from "../lib/utils";

const SEGMENT_COLORS = ['#6366f1', '#10b981', '#f59e0b'];

export default function Customers({ orders, customers, loading }: { orders: Order[], customers: Customer[], loading: boolean }) {
  const stats = useMemo(() => {
    const customerSpend: Record<string, { name: string, total: number, visits: number }> = {};
    
    orders.forEach(o => {
      const id = o.customer_phone || 'Guest';
      if (!customerSpend[id]) {
        customerSpend[id] = { name: o.customer_name || 'Guest', total: 0, visits: 0 };
      }
      customerSpend[id].total += o.total;
      customerSpend[id].visits += 1;
    });

    const leaderboard = Object.entries(customerSpend)
      .filter(([id]) => id !== 'Guest')
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Segmentation
    let newC = 0;      // 1 visit
    let returning = 0; // 2-5 visits
    let loyal = 0;     // 5+ visits

    Object.values(customerSpend).forEach(c => {
      if (c.visits === 1) newC++;
      else if (c.visits <= 5) returning++;
      else loyal++;
    });

    const segments = [
      { name: 'New', value: newC },
      { name: 'Returning', value: returning },
      { name: 'Loyal', value: loyal }
    ];

    return {
      leaderboard,
      segments,
      totalCustomers: customers.length,
      avgLTV: leaderboard.length === 0 ? 0 : leaderboard.reduce((sum, c) => sum + c.total, 0) / leaderboard.length
    };
  }, [orders, customers]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-36 glass-morphism rounded-3xl" />
          <div className="h-36 glass-morphism rounded-3xl" />
        </div>
        <div className="h-64 glass-morphism rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="glass p-6 rounded-[2rem] text-center glow-indigo border-white/5"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Base</p>
          <p className="text-3xl font-black text-white">{stats.totalCustomers}</p>
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="glass p-6 rounded-[2rem] text-center glow-emerald border-white/5"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg LTV</p>
          <p className="text-xl font-black text-white">{formatCurrency(stats.avgLTV)}</p>
        </motion.div>
      </div>

      {/* Segment Chart */}
      <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">User Matrix</h3>
            <p className="text-lg font-black text-white">Segmentation</p>
          </div>
          <UserPlus className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="flex items-center">
          <div className="w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.segments}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.segments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                     backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                     border: '1px solid rgba(255,255,255,0.1)', 
                     borderRadius: '1.5rem',
                     backdropFilter: 'blur(10px)'
                   }}
                   itemStyle={{ color: '#fff', fontWeight: 900 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-6 space-y-5">
            {stats.segments.map((s, idx) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: SEGMENT_COLORS[idx] }} />
                <div>
                  <p className="text-xs font-black text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.value} Users</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">VIP Circle</h3>
          <Crown className="w-4 h-4 text-amber-500" />
        </div>
        <div className="space-y-3">
          {stats.leaderboard.map((c, idx) => (
            <motion.div 
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="glass p-5 rounded-[2rem] flex items-center justify-between border-white/5 group relative overflow-hidden"
            >
              {idx < 3 && (
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-300" : "bg-orange-600"
                )} />
              )}
              
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border shadow-inner",
                  idx === 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                  "bg-slate-900 text-slate-400 border-white/5"
                )}>
                  {idx === 0 ? <Star className="w-6 h-6 fill-amber-500" /> : c.name.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-white">{c.name}</p>
                    {c.visits > 10 && <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {c.visits} Visits • {c.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-base font-black text-emerald-400 tracking-tight">{formatCurrency(c.total)}</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Top Tier</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
