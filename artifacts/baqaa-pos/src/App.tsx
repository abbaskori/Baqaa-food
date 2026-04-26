import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeStorage, StorageAPI } from "@/lib/storage";
import { useHashLocation } from "@/lib/use-hash-location";

import { AppLayout } from "@/components/layout";
import POS from "@/pages/pos";
import Admin from "@/pages/admin";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

const queryClient = new QueryClient();

function Router({ role }: { role: 'admin' | 'staff' | 'manager' }) {
  const [location, setLocation] = useLocation();

  // Role-based access control
  useEffect(() => {
    if (role === 'staff' && (location === '/admin' || location === '/analytics')) {
      setLocation('/');
    }
    if (role === 'manager' && (location === '/' || location === '/admin')) {
      setLocation('/analytics');
    }
  }, [location, role, setLocation]);

  return (
    <AppLayout role={role}>
      <Switch>
        {role !== 'manager' && <Route path="/" component={POS} />}
        {(role === 'admin' || role === 'manager') && (
          <Route path="/analytics" component={Analytics} />
        )}
        {role === 'admin' && (
          <Route path="/admin" component={Admin} />
        )}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [auth, setAuth] = useState<{ role: 'admin' | 'staff' | 'manager' } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activationKey, setActivationKey] = useState("");
  const [activationError, setActivationError] = useState(false);

  // You can change this to your desired secret master key
  const MASTER_KEY = "BAQAA-PRO-POS";

  useEffect(() => {
    initializeStorage();
    StorageAPI.fetchCloudData().catch(console.error);
    
    // Check if device is authorized
    const authorized = localStorage.getItem('baqaa_device_authorized') === 'true';
    setIsAuthorized(authorized);

    // Check if session exists
    const saved = sessionStorage.getItem('baqaa_session');
    if (saved) setAuth(JSON.parse(saved));
  }, []);

  const handleActivate = () => {
    if (activationKey === MASTER_KEY) {
      localStorage.setItem('baqaa_device_authorized', 'true');
      setIsAuthorized(true);
    } else {
      setActivationError(true);
      setTimeout(() => {
        setActivationKey("");
        setActivationError(false);
      }, 1000);
    }
  };

  const handleLogin = (role: 'admin' | 'staff' | 'manager') => {
    const session = { role };
    setAuth(session);
    sessionStorage.setItem('baqaa_session', JSON.stringify(session));
  };

  const handleLogout = () => {
    setAuth(null);
    sessionStorage.removeItem('baqaa_session');
  };

  // ── Activation Screen ──────────────────────────────────────────────────────
  if (isAuthorized === false) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/20">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Device Unauthorized</h1>
          <p className="text-slate-400 mb-8">This device is not authorized to access the Baqaa POS system. Please enter the Master Key.</p>
          
          <input
            type="password"
            placeholder="Enter Master Key"
            value={activationKey}
            onChange={(e) => setActivationKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
            className={`w-full bg-slate-900 border-2 rounded-xl py-3 px-4 text-white text-center font-bold tracking-widest focus:outline-none transition-all ${
              activationError ? 'border-red-500 animate-shake' : 'border-slate-800 focus:border-orange-500'
            }`}
          />
          
          <button
            onClick={handleActivate}
            className="w-full mt-4 bg-white text-slate-950 font-black py-3 rounded-xl hover:bg-orange-500 hover:text-white transition-all active:scale-95"
          >
            Authorize Device
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) return null; // Loading state

  if (!auth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <Router role={auth.role} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

