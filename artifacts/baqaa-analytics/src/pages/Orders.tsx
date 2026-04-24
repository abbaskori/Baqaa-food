import { useState, useMemo } from "react";
import { Search, Calendar, Filter, ChevronRight, Hash, Package, ReceiptText, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Order } from "../hooks/use-analytics";
import { formatCurrency, cn } from "../lib/utils";

export default function Orders({ orders, loading }: { orders: Order[], loading: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const q = searchTerm.toLowerCase();
    return orders.filter(o => 
      o.bill_number.toString().includes(q) || 
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.customer_phone || "").includes(q)
    );
  }, [orders, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 glass-morphism rounded-2xl" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 glass-morphism rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Search Header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
        <div className="relative glass-morphism flex items-center rounded-2xl overflow-hidden border border-white/5 group-focus-within:border-indigo-500/30 transition-all">
          <div className="pl-5 pr-3">
            <Search className="w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent py-5 text-sm font-black text-white focus:outline-none placeholder:text-slate-600 placeholder:font-bold tracking-tight"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="px-4 text-slate-500 hover:text-white font-black text-[10px] uppercase"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-indigo-500 rounded-full" />
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {filteredOrders.length} Log Entries
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 glass rounded-xl text-slate-400">
            <Filter className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest glass-morphism px-3 py-2 rounded-xl border border-white/5">
            <Calendar className="w-3 h-3" /> Latest
          </button>
        </div>
      </div>

      {/* Order Stream */}
      <div className="space-y-4">
        {filteredOrders.map((order, idx) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-lg"
          >
            <button 
              onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
              className={cn(
                "w-full p-6 flex items-center justify-between text-left transition-all active:scale-[0.98]",
                selectedOrder === order.id ? "bg-white/5" : "hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border transition-all",
                  order.payment_method === 'Cash' 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                  selectedOrder === order.id && "scale-110 shadow-lg"
                )}>
                  <span className="text-[8px] uppercase tracking-widest opacity-60 mb-0.5">Inv</span>
                  <span className="text-sm font-black">#{order.bill_number}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-white">{order.customer_name || 'Anonymous Guest'}</p>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      order.payment_method === 'Cash' ? "bg-emerald-400" : "bg-indigo-400"
                    )} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {format(parseISO(order.created_at), 'dd MMM • hh:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-base font-black text-white tracking-tight">{formatCurrency(order.total)}</p>
                  <p className={cn(
                    "text-[9px] font-black uppercase tracking-[0.15em] opacity-80",
                    order.payment_method === 'Cash' ? "text-emerald-400" : "text-indigo-400"
                  )}>{order.payment_method}</p>
                </div>
                <div className={cn(
                  "w-8 h-8 rounded-full glass flex items-center justify-center transition-all",
                  selectedOrder === order.id ? "bg-indigo-500 text-white rotate-90" : "text-slate-600"
                )}>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {selectedOrder === order.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 border-t border-white/5"
                >
                  <div className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ReceiptText className="w-3 h-3 text-slate-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Order Receipt</span>
                    </div>
                    
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-400">
                              {item.qty}x
                            </div>
                            <span className="text-xs font-black text-slate-200">{item.name}</span>
                          </div>
                          <span className="text-xs font-black text-slate-400">{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-5 mt-5 border-t border-white/5 space-y-3">
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-rose-400">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Loyalty Discount</span>
                          </div>
                          <span className="text-xs font-black">-{formatCurrency(order.discount_amount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <span className="bg-slate-900 border border-white/5 text-slate-500 text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1.5">
                            <Hash className="w-2 h-2" /> {order.id.substring(0, 12)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Final Amount</p>
                          <p className="text-lg font-black text-indigo-400">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredOrders.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 glass rounded-[2.5rem] border-white/5"
          >
            <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
              <Package className="w-8 h-8 text-slate-800" />
            </div>
            <h4 className="text-white font-black mb-1">No Results</h4>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">No matching transactions found</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
