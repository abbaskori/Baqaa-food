import { Link, useRoute, useLocation } from "wouter";
import { Store, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShopInfo } from "@/hooks/use-data";

export function TopNav({ role }: { role: 'admin' | 'staff' }) {
  const { data: shop } = useShopInfo();
  const [, setLocation] = useLocation();
  const logoSrc = shop.logo || `${import.meta.env.BASE_URL}baqaa-logo.png`;

  const handleLogout = () => {
    sessionStorage.removeItem('baqaa_session');
    window.location.reload(); // Quick way to reset state
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={logoSrc}
            alt="Logo"
            className="h-9 w-auto object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="min-w-0 hidden sm:block">
            <h1 className="font-black text-base text-gray-900 leading-tight truncate">{shop.name}</h1>
            <p className="text-xs text-gray-400 leading-none">Cashier Point of Sale</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {role === 'admin' && (
            <>
              <NavLink href="/admin" icon={<Settings className="w-4 h-4" />} label="Admin" />
              <NavLink href="/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
            </>
          )}
          <NavLink href="/" exact icon={<Store className="w-4 h-4" />} label="POS" />
          <div className="w-[1px] h-6 bg-gray-200 mx-1" />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
            title="Lock POS"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label, exact }: { href: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  const [isActive] = useRoute(exact ? href : href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all",
        isActive
          ? "bg-orange-500 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export function AppLayout({ children, role }: { children: React.ReactNode; role: 'admin' | 'staff' }) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <TopNav role={role} />
      <main className="flex-1 flex flex-col overflow-hidden relative min-h-0">
        {children}
      </main>
    </div>
  );
}

