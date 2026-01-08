
import React, { useState } from 'react';
import { 
  LayoutDashboard, Coffee, ShoppingBag, Wallet, Receipt, History, Settings, Menu, X, PieChart, Archive, Wifi, Landmark, Crown, ClipboardList, Briefcase, Users, Search, Bell, Banknote, Database, ShieldCheck, PiggyBank, AlertTriangle, ChevronLeft, LogOut, UserCircle, UserCog, Lock, DatabaseBackup, Boxes
} from 'lucide-react';
import { AppUser, Permission } from '../../types';
import ConfirmModal from './ConfirmModal';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: any) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  daysSinceBackup?: number;
  currentUser: AppUser | null;
  onLogout: () => void;
  onEditProfile: () => void;
}

const NavItem = ({ id, label, icon: Icon, active, onClick, badge, locked, index }: any) => (
  <button
    onClick={() => !locked && onClick(id)}
    disabled={locked}
    style={{ animationDelay: `${index * 50}ms` }}
    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl transition-all duration-300 group font-bold text-sm relative overflow-hidden mb-1.5 animate-slide-up opacity-0 ${
      locked 
      ? 'opacity-60 cursor-not-allowed grayscale' 
      : active 
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' 
        : 'text-gray-600 hover:bg-white/80 hover:text-indigo-600 hover:shadow-md hover:scale-[1.01]'
    }`}
  >
    <div className="flex items-center gap-3.5 z-10">
        <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="tracking-wide">{label}</span>
    </div>
    <div className="flex items-center gap-2 z-10">
        {badge && !locked && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                {badge}
            </span>
        )}
        {locked && <Lock size={14} className="text-gray-400 opacity-70" />}
    </div>
  </button>
);

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isMobileMenuOpen, setIsMobileMenuOpen, daysSinceBackup = 0, currentUser, onLogout, onEditProfile }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const checkAccess = (perm?: Permission) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      if (currentUser.role === 'partner') return true; 
      if (!perm) return true; 
      return currentUser.permissions?.includes(perm) || false;
  };

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'vip_customers', label: 'الزبائن والديون', icon: Crown },
    { id: 'records', label: 'سجل الجلسات', icon: History },
    { id: 'drinks', label: 'المشروبات', icon: Coffee, permission: 'manage_products' },
    { id: 'internet_cards', label: 'بطاقات النت', icon: Wifi, permission: 'manage_products' },
    { id: 'inventory', label: 'المخزون', icon: Boxes },
    { id: 'liabilities', label: 'المصاريف والمشتريات', icon: ShoppingBag, permission: 'view_financials' }, 
    { id: 'partners', label: 'الشركاء والأرباح', icon: Users, permission: 'view_financials' }, 
    { id: 'partner_debts', label: 'مسحوبات الشركاء', icon: Wallet, permission: 'view_financials' },
    { id: 'cost_analysis', label: 'التحليل المالي', icon: PieChart, permission: 'view_reports' },
    { id: 'inventory_archive', label: 'الأرشيف الشهري', icon: Archive, permission: 'view_reports' },
    { id: 'treasury', label: 'الصندوق المركزي', icon: Banknote, permission: 'manage_treasury' }, 
    { id: 'ledger_viewer', label: 'دفتر الأستاذ', icon: ShieldCheck, permission: 'manage_treasury' },
    { id: 'audit_log', label: 'سجل العمليات', icon: ClipboardList, permission: 'manage_system' },
    { id: 'backup_restore', label: 'النسخ الاحتياطي', icon: DatabaseBackup, permission: 'manage_system' },
    ...(currentUser?.role === 'admin' ? [{ id: 'users', label: 'المستخدمين والصلاحيات', icon: UserCog }] : []),
    { id: 'settings', label: 'الإعدادات', icon: Settings, permission: 'manage_system' },
  ];

  const BrandLogo = ({ textSize = "text-2xl" }: { textSize?: string }) => (
    <span dir="ltr" className={`${textSize} font-black text-gray-900 tracking-tighter`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
      C<span className="text-indigo-600">'</span>oMa
    </span>
  );

  return (
    <div className="flex h-screen bg-transparent overflow-hidden font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Sidebar (Desktop) - Floating Glass Panel */}
      <aside className="hidden md:flex flex-col w-[280px] h-full z-30 p-4">
        <div className="glass h-full rounded-[32px] flex flex-col relative overflow-hidden transition-all duration-300">
            
            {/* Logo Area */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-2 group cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-glow-sm transform group-hover:rotate-12 transition-transform duration-300">
                        <LayoutDashboard size={24} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <BrandLogo textSize="text-2xl" />
                        <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">Manager</p>
                    </div>
                </div>
            </div>
            
            {/* Nav Scroll Area */}
            <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 no-scrollbar mt-2">
            {navItems.map((item, idx) => {
                const hasAccess = item.id === 'users' ? currentUser?.role === 'admin' : checkAccess(item.permission as Permission);
                return (
                <React.Fragment key={item.id}>
                {idx === 0 && <p className="px-4 text-[10px] font-black text-indigo-400/80 mb-2 mt-2 uppercase tracking-widest animate-fade-in">الرئيسية</p>}
                {idx === 3 && <p className="px-4 text-[10px] font-black text-indigo-400/80 mb-2 mt-6 uppercase tracking-widest animate-fade-in delay-100">المنتجات</p>}
                {idx === 6 && <p className="px-4 text-[10px] font-black text-indigo-400/80 mb-2 mt-6 uppercase tracking-widest animate-fade-in delay-200">المالية</p>}
                {idx === 9 && <p className="px-4 text-[10px] font-black text-indigo-400/80 mb-2 mt-6 uppercase tracking-widest animate-fade-in delay-300">التقارير</p>}
                {idx === 12 && <p className="px-4 text-[10px] font-black text-indigo-400/80 mb-2 mt-6 uppercase tracking-widest animate-fade-in delay-300">الإدارة</p>}
                    <NavItem {...item} active={activeView === item.id} onClick={onNavigate} locked={!hasAccess} index={idx} />
                </React.Fragment>
            )})}
            </nav>
            
            {/* Profile Footer */}
            <div className="p-4 border-t border-white/40 bg-white/30 backdrop-blur-md">
                <div className="bg-white/60 border border-white rounded-2xl p-3 flex items-center justify-between group relative shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase border-2 border-white shadow-sm">
                            {currentUser?.username.substring(0,2) || 'US'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate w-20">{currentUser?.name || 'User'}</p>
                            <p className="text-[10px] text-gray-500 truncate font-medium">
                                {currentUser?.role === 'admin' ? 'مدير النظام' : currentUser?.role === 'partner' ? 'شريك' : 'مستخدم'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button onClick={onEditProfile} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors shadow-sm" title="تعديل الملف الشخصي">
                            <UserCog size={18} />
                        </button>
                        <button onClick={() => setShowLogoutConfirm(true)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="تسجيل خروج">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* IMPROVED Floating Backup Warning Toast */}
        {daysSinceBackup > 3 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-slide-up">
                <div className="bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-lg p-4 rounded-3xl shadow-2xl border border-white/20 flex items-center justify-between text-white overflow-hidden group">
                    {/* Animated shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-25"></div>
                            <div className="bg-white/20 p-2 rounded-2xl relative">
                                <DatabaseBackup size={22} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] font-black leading-tight">تنبيه أمان البيانات</p>
                            <p className="text-[10px] font-medium opacity-90 mt-0.5">مرَّت {daysSinceBackup} أيام منذ آخر نسخة!</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onNavigate('backup_restore')}
                        className="relative z-10 bg-white text-orange-700 px-4 py-2 rounded-2xl text-[11px] font-black hover:bg-orange-50 transition-all shadow-xl active:scale-95 flex items-center gap-1.5"
                    >
                        تأمين الآن <ChevronLeft size={14}/>
                    </button>
                </div>
            </div>
        )}

        {/* Header Mobile */}
        <header className="md:hidden bg-white/80 backdrop-blur-xl border-b border-gray-200 h-16 flex items-center justify-between px-4 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
               <LayoutDashboard size={18} />
            </div>
            <BrandLogo textSize="text-lg" />
          </div>
          <button className="relative p-2 text-gray-500 bg-gray-50 rounded-xl active:scale-95 transition-transform">
              <Bell size={20} />
              {daysSinceBackup > 3 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse"></span>}
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth no-scrollbar">
           <div className="max-w-[1600px] mx-auto animate-fade-in">
             {children}
           </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 flex justify-around items-end h-[88px] px-2 z-30 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
           <button onClick={() => onNavigate('dashboard')} className={`flex flex-col items-center p-2 rounded-2xl transition-all w-16 ${activeView === 'dashboard' ? 'text-indigo-600 -translate-y-2' : 'text-gray-400'}`}>
              <div className={`mb-1 p-1 rounded-full transition-all duration-300 ${activeView === 'dashboard' ? 'bg-indigo-50 shadow-sm scale-110' : ''}`}><LayoutDashboard size={24} strokeWidth={activeView === 'dashboard' ? 2.5 : 2} className={activeView === 'dashboard' ? 'fill-indigo-100' : ''} /></div>
              <span className="text-[10px] font-bold">الرئيسية</span>
           </button>
           <button onClick={() => onNavigate('records')} className={`flex flex-col items-center p-2 rounded-2xl transition-all w-16 ${activeView === 'records' ? 'text-indigo-600 -translate-y-2' : 'text-gray-400'}`}>
              <div className={`mb-1 p-1 rounded-full transition-all duration-300 ${activeView === 'records' ? 'bg-indigo-50 shadow-sm scale-110' : ''}`}><History size={24} strokeWidth={activeView === 'records' ? 2.5 : 2} /></div>
              <span className="text-[10px] font-bold">السجلات</span>
           </button>
           
           <div className="relative -top-6">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="bg-indigo-600 text-white w-14 h-14 rounded-2xl shadow-xl shadow-indigo-500/40 flex items-center justify-center transform transition-transform active:scale-95 border-4 border-[#F3F4F6] hover:-translate-y-1"
              >
                <Menu size={24} />
              </button>
           </div>

           <button onClick={() => onNavigate('vip_customers')} className={`flex flex-col items-center p-2 rounded-2xl transition-all w-16 ${activeView === 'vip_customers' ? 'text-indigo-600 -translate-y-2' : 'text-gray-400'}`}>
              <div className={`mb-1 p-1 rounded-full transition-all duration-300 ${activeView === 'vip_customers' ? 'bg-indigo-50 shadow-sm scale-110' : ''}`}><Users size={24} strokeWidth={activeView === 'vip_customers' ? 2.5 : 2} /></div>
              <span className="text-[10px] font-bold">الزبائن</span>
           </button>
           <button onClick={() => checkAccess('view_reports') && onNavigate('cost_analysis')} disabled={!checkAccess('view_reports')} className={`flex flex-col items-center p-2 rounded-2xl transition-all w-16 ${activeView === 'cost_analysis' ? 'text-indigo-600 -translate-y-2' : 'text-gray-400'} ${!checkAccess('view_reports') ? 'opacity-50 grayscale' : ''}`}>
              <div className={`mb-1 p-1 rounded-full transition-all duration-300 ${activeView === 'cost_analysis' ? 'bg-indigo-50 shadow-sm scale-110' : ''}`}><PieChart size={24} strokeWidth={activeView === 'cost_analysis' ? 2.5 : 2} /></div>
              <span className="text-[10px] font-bold">التقارير</span>
           </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative bg-white w-full rounded-t-[32px] p-6 animate-slide-up max-h-[85vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-2">
                    <Menu className="text-indigo-600" size={24}/> القائمة الكاملة
                </h3>
                <button onClick={() => setShowLogoutConfirm(true)} className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-colors">
                    <LogOut size={14}/> خروج
                </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
               {navItems.map(item => {
                 const hasAccess = item.id === 'users' ? currentUser?.role === 'admin' : checkAccess(item.permission as Permission);
                 return (
                 <button 
                    key={item.id} 
                    onClick={() => { if(hasAccess) { onNavigate(item.id); setIsMobileMenuOpen(false); } }}
                    disabled={!hasAccess}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${
                        !hasAccess 
                        ? 'bg-gray-50 border-gray-100 text-gray-300 grayscale cursor-not-allowed'
                        : activeView === item.id 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:shadow-md'
                    }`}
                 >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 ${!hasAccess ? 'bg-gray-100' : activeView === item.id ? 'bg-indigo-600 text-white shadow-md scale-110' : 'bg-gray-50 text-gray-500 group-hover:scale-110'}`}>
                        {!hasAccess ? <Lock size={20} className="opacity-50"/> : <item.icon size={22} />}
                    </div>
                    <span className="text-[11px] font-bold text-center">{item.label}</span>
                 </button>
               )})}
            </div>
            
            <button onClick={() => setIsMobileMenuOpen(false)} className="mt-8 w-full py-4 bg-gray-100 rounded-2xl text-gray-500 font-bold hover:bg-gray-200 transition-colors active:scale-95">
                إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
            setShowLogoutConfirm(false);
            onLogout();
        }}
        title="تسجيل الخروج"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج من النظام؟"
        confirmText="تسجيل خروج"
      />
    </div>
  );
};

export default Layout;
