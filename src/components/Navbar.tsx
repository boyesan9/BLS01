import React from 'react';
import { UserProfile, UserRole } from '../types';
import { Shield, FileSpreadsheet, User, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  currentView: 'form' | 'dashboard';
  onViewChange: (view: 'form' | 'dashboard') => void;
  onOpenGoogleSheets: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  sheetsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onViewChange,
  onOpenGoogleSheets,
  onSwitchRole,
  onLogout,
  sheetsConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand title, one line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <button
            onClick={() => onViewChange('form')}
            className="text-left font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-white"
          >
            <span className="text-base">BLS Fleet Inspection</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-normal text-slate-400">
              · ระบบตรวจรถยนต์ส่วนกลาง
            </span>
          </button>
        </div>

        {/* Zone 2: Nav links - Admin sees all menus, Staff only sees inspection form */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onViewChange('form')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentView === 'form'
                ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            แบบฟอร์มตรวจรถ
          </button>

          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => onViewChange('dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                  currentView === 'dashboard'
                    ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                แดชบอร์ดผู้ดูแล
              </button>

              <button
                onClick={onOpenGoogleSheets}
                className="inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Google Sheets</span>
                {sheetsConnected && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Profile & Role Badge & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Role Status Badge - Only admin can switch mode if needed */}
          {currentUser.role === 'admin' ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300">
                <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>ผู้ดูแลระบบ (Admin)</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                <User className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>พนักงานทั่วไป (Staff)</span>
              </span>
            </div>
          )}

          {/* User profile info */}
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">
            <div className="text-right">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white max-w-[130px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {currentUser.role === 'admin' ? 'หัวหน้ายานพาหนะ' : currentUser.position || 'เจ้าหน้าที่เวร'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
            title="ออกจากระบบ / สลับบัญชี"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
