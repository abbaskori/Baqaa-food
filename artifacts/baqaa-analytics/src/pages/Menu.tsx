import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  Trophy, 
  TrendingDown, 
  Package, 
  Flame,
  Zap,
  ChevronRight
} from "lucide-react";
import { Order } from "../hooks/use-analytics";
import { formatCurrency, cn } from "../lib/utils";

export default function Menu({ orders, loading }: { orders: Order[], loading: boolean }) {
  const stats = useMemo(() => {
    const itemMap: Record<string, { name: string, qty: number, revenue: number }> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        }
        itemMap[item.name].qty += item.qty;
        itemMap[item.name].revenue += item.price * item.qty;
      });
    });

    const items = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);
    const topItems = items.slice(0, 10);
    const bottomItems = items.slice(-5).reverse();

    return {
      topItems,
      bottomItems,
      totalItemsSold: items.reduce((sum, i) => sum + i.qty, 0)
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 glass-morphism rounded-[2.5rem]" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 glass-morphism rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Top Performers Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-[2.5rem] glow-indigo overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Menu Power</h3>
            <p className="text-lg font-black text-white">Top 10 Performers</p>
          </div>
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={stats.topItems} 
              layout="vertical" 
              margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '1.5rem',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ color: '#fff', fontWeight: 900 }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={16}>
                {stats.topItems.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index < 3 ? '#6366f1' : 'rgba(99, 102, 241, 0.2)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Detailed Ranking List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Product Matrix</h3>
          <Zap className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="space-y-3">
          {stats.topItems.map((item, idx) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass p-5 rounded-[1.5rem] flex items-center justify-between border-white/5 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shadow-inner border",
                  idx === 0 ? "bg-indigo-500 text-white border-indigo-400" : 
                  idx === 1 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  idx === 2 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-slate-900 text-slate-500 border-white/5"
                )}>
                  {idx === 0 ? <Trophy className="w-5 h-5" /> : idx + 1}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{item.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.qty} units sold</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-white">{formatCurrency(item.revenue)}</p>
                  <div className="flex items-center justify-end gap-1">
                    <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${(item.revenue / stats.topItems[0].revenue) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Underperformers Alert */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass p-6 rounded-[2.5rem] border-rose-500/10 bg-rose-500/5 glow-rose"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-rose-500/10">
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">Efficiency Alert</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Low Performance Items</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.bottomItems.slice(0, 4).map((item) => (
            <div key={item.name} className="glass-morphism p-3 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-300 truncate mb-1">{item.name}</p>
              <div className="flex items-center gap-1.5">
                <Package className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] font-black text-rose-400">{item.qty} sold</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center opacity-60">
          Optimization Recommended
        </p>
      </motion.div>
    </div>
  );
}
