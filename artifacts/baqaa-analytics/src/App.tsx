import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  IndianRupee, 
  UtensilsCrossed, 
  Users, 
  ClipboardList,
  Lock,
  Delete,
  Fingerprint
} from "lucide-react";
import { useAnalytics } from "./hooks/use-analytics";
import { cn } from "./lib/utils";
import Overview from "./pages/Overview";
import Revenue from "./pages/Revenue";
import Menu from "./pages/Menu";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";

type Tab = "overview" | "revenue" | "menu" | "customers" | "orders";

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { orders, customers, loading, error, refresh } = useAnalytics();

  // Handle successful login
  const handleUnlock = () => {
    setIsLocked(false);
    refresh();
  };

  return (
    <div className="relative flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className="mesh-bg" />
      
      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100]"
          >
            <Login onUnlock={handleUnlock} />
          </motion.div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Header */}
            <header className="px-6 py-4 pt-14 glass flex items-center justify-between shrink-0 border-b-0 rounded-b-[2rem]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center">
                  <img src="/logo.png" alt="Baqaa" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Baqaa
                  </h1>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-black">Analytics Hub</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => refresh()}
                  className="w-10 h-10 rounded-2xl glass-morphism flex items-center justify-center text-slate-300 active:scale-90 transition-all"
                >
                  <motion.div animate={loading ? { rotate: 360 } : {}} transition={loading ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}>
                    <ClipboardList className="w-5 h-5" />
                  </motion.div>
                </button>
                <button 
                  onClick={() => setIsLocked(true)}
                  className="w-10 h-10 rounded-2xl glass-morphism flex items-center justify-center text-rose-400 active:scale-90 transition-all shadow-lg shadow-rose-500/10"
                >
                  <Lock className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-32">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="p-6"
                >
                  {activeTab === "overview" && <Overview orders={orders} customers={customers} loading={loading} />}
                  {activeTab === "revenue" && <Revenue orders={orders} loading={loading} />}
                  {activeTab === "menu" && <Menu orders={orders} loading={loading} />}
                  {activeTab === "customers" && <Customers orders={orders} customers={customers} loading={loading} />}
                  {activeTab === "orders" && <Orders orders={orders} loading={loading} />}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-6 left-6 right-6 glass px-6 py-4 flex items-center justify-between rounded-[2.5rem] border border-white/10 z-50">
              <NavButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<LayoutDashboard />} label="Home" />
              <NavButton active={activeTab === "revenue"} onClick={() => setActiveTab("revenue")} icon={<IndianRupee />} label="Sales" />
              <NavButton active={activeTab === "menu"} onClick={() => setActiveTab("menu")} icon={<UtensilsCrossed />} label="Menu" />
              <NavButton active={activeTab === "customers"} onClick={() => setActiveTab("customers")} icon={<Users />} label="Users" />
              <NavButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")} icon={<ClipboardList />} label="Log" />
            </nav>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 transition-all active:scale-90"
    >
      <div className={cn(
        "p-2.5 rounded-2xl transition-all duration-300",
        active ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 -translate-y-1" : "text-slate-500 hover:text-slate-300"
      )}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      </div>
      <span className={cn(
        "text-[9px] font-black uppercase tracking-widest transition-all",
        active ? "text-white opacity-100" : "text-slate-500 opacity-60"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-pill" 
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-white" 
        />
      )}
    </button>
  );
}

function Login({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  
  const ADMIN_PIN = "0000";

  const handleKeyPress = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === ADMIN_PIN) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 600);
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-950/40 backdrop-blur-3xl">
      <div className="mb-16 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 bg-white rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8 border border-white/20 p-4"
        >
          <img src="/logo.png" alt="Baqaa Logo" className="w-full h-full object-contain" />
        </motion.div>
        <h1 className="text-4xl font-black text-white mb-2 font-display tracking-tighter">Baqaa</h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Secure Analytics</p>
      </div>

      <div className="flex justify-center gap-5 mb-16">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={error ? { x: [0, -10, 10, -10, 10, 0], color: "#f43f5e" } : {}}
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-all duration-300",
              pin.length > i 
                ? "bg-white border-white scale-125 shadow-[0_0_20px_rgba(255,255,255,0.6)]" 
                : "border-slate-800 bg-slate-900/50",
              error && "border-rose-500 bg-rose-500 shadow-rose-500/50"
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="h-20 text-3xl font-black text-white glass-morphism rounded-3xl hover:bg-white/10 active:scale-90 transition-all border border-white/5"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleKeyPress("0")}
          className="h-20 text-3xl font-black text-white glass-morphism rounded-3xl hover:bg-white/10 active:scale-90 transition-all border border-white/5"
        >
          0
        </button>
        <button 
          onClick={() => setPin(pin.slice(0, -1))}
          className="h-20 flex items-center justify-center rounded-3xl glass-morphism text-slate-400 active:scale-90 transition-all"
        >
          <Delete className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

