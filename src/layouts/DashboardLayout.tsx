import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserSession } from '@/types';

interface TabItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

interface DashboardLayoutProps {
    session: UserSession;
    onLogout: () => void;
    tabs: TabItem[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    children: React.ReactNode;
    brandName?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
    session, 
    onLogout, 
    tabs, 
    activeTab, 
    setActiveTab, 
    children,
    brandName = "Mimphy"
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Collapsible sidebar state
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('fp_sidebar_collapsed') === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('fp_sidebar_collapsed', isCollapsed.toString());
    }, [isCollapsed]);

    const handleTabClick = (id: string) => {
        setActiveTab(id);
        setIsMobileMenuOpen(false);
    };

    const SidebarContent = ({ isMobile = false }) => {
        const collapsed = !isMobile && isCollapsed;
        
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-stone-200 dark:border-slate-800 overflow-x-hidden w-full relative">
                {/* Brand Logo & Name */}
                <div className={`h-16 flex items-center shrink-0 overflow-hidden whitespace-nowrap transition-all duration-300 px-4`}>
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-white font-black text-lg leading-none">M</span>
                    </div>
                    <h1 className={`font-bold text-xl text-stone-800 dark:text-white tracking-tight ml-3 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                        {brandName}
                    </h1>
                </div>

                {/* Navigation Tabs */}
                <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1 py-4 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-slate-700 px-2`}>
                    <div className={`text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                        Menu Utama
                    </div>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <div key={tab.id} className="relative group">
                                <button
                                    onClick={() => handleTabClick(tab.id)}
                                    className={`w-full flex items-center h-[40px] rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${
                                        collapsed ? 'px-[10px]' : 'px-2'
                                    } ${
                                        isActive 
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-bold' 
                                            : 'text-stone-600 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-800/50 hover:text-stone-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <tab.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-red-600 dark:text-red-400' : 'text-stone-400 dark:text-slate-500 group-hover:text-stone-600 dark:group-hover:text-slate-400'}`} />
                                    
                                    <span className={`ml-3 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                                        {tab.label}
                                    </span>
                                </button>
                                
                                {collapsed && (
                                    <div className="absolute left-[52px] top-1/2 -translate-y-1/2 ml-1 px-2.5 py-1.5 bg-stone-800 dark:bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-stone-700 dark:border-slate-700 pointer-events-none">
                                        {tab.label}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Profile / User Section */}
                <div className="shrink-0 p-2 space-y-1 border-t border-stone-200 dark:border-slate-800">
                    <div className="relative group">
                        <button 
                            onClick={onLogout}
                            className={`w-full flex items-center h-[40px] rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap text-stone-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 ${
                                collapsed ? 'px-[10px]' : 'px-2'
                            }`}
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            <span className={`ml-3 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                                Keluar
                            </span>
                        </button>
                        {collapsed && (
                            <div className="absolute left-[52px] top-1/2 -translate-y-1/2 ml-1 px-2.5 py-1.5 bg-stone-800 dark:bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-stone-700 dark:border-slate-700 pointer-events-none">
                                Keluar
                            </div>
                        )}
                    </div>
                    
                    <div className={`flex items-center h-16 mt-1 overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'px-[6px]' : 'px-2'}`}>
                        <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-stone-200 dark:border-slate-700 shrink-0">
                            {session.photoUrl ? (
                                <img src={session.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-stone-400 dark:text-slate-500 font-bold text-sm">
                                    {session.name ? session.name[0].toUpperCase() : 'U'}
                                </span>
                            )}
                        </div>
                        <div className={`ml-3 flex-1 min-w-0 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                            <p className="text-sm font-bold text-stone-800 dark:text-white truncate">{session.name}</p>
                            <p className="text-xs text-stone-500 dark:text-slate-400 truncate capitalize">{session.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
            {/* DESKTOP SIDEBAR */}
            <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-20 transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
                <SidebarContent isMobile={false} />
                
                {/* Pinned Collapse Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-2 top-12 w-6 h-6 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 shadow-sm z-50 transition-transform duration-300 hover:scale-110"
                    aria-label="Toggle Sidebar"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </aside>

            {/* MOBILE DRAWER OVERLAY */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity animate-in fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* MOBILE DRAWER */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent isMobile={true} />
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden transition-[padding] duration-300 ease-in-out ${isCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
                {/* MOBILE HEADER */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-stone-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0 md:hidden transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg"
                            aria-label="Buka Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="font-bold text-lg text-stone-800 dark:text-white truncate">
                            {tabs.find(t => t.id === activeTab)?.label || brandName}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </header>

                {/* DESKTOP TOP BAR */}
                <header className="hidden md:flex h-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-stone-100 dark:border-slate-800/50 items-center justify-between px-8 sticky top-0 z-30 shrink-0 transition-colors duration-300">
                     <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                        {tabs.find(t => t.id === activeTab)?.label}
                     </h2>
                     <div className="flex items-center gap-4">
                         <ThemeToggle />
                     </div>
                </header>

                {/* SCROLLABLE PAGE CONTENT */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-50/50 dark:bg-slate-900/50 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
