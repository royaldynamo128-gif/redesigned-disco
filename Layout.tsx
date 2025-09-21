
import React, { ReactNode } from 'react';
import { AppScreen } from '../types';
import { useAppContext } from '../App';
import { SunIcon, MoonIcon, HomeIcon, CogIcon, PlusCircleIcon, BellIcon, ChartBarIcon, BookOpenIcon } from './Icons';

interface LayoutProps {
    title: string;
    children: ReactNode;
}

const NavButton: React.FC<{ screen: AppScreen; label: string; icon: ReactNode }> = ({ screen, label, icon }) => {
    const { navigate, currentScreen } = useAppContext();
    const isActive = currentScreen === screen;
    return (
        <button
            onClick={() => navigate(screen)}
            title={label}
            className={`flex items-center justify-center sm:justify-start sm:space-x-2 p-3 rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-primary-100 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

const Layout: React.FC<LayoutProps> = ({ title, children }) => {
    const { isDarkMode, toggleTheme } = useAppContext();

    return (
        <div className="flex flex-col md:flex-row gap-4 min-h-screen">
            <aside className="w-full md:w-16 sm:md:w-56 bg-white dark:bg-slate-800 p-2 md:p-4 rounded-lg shadow-md md:h-screen md:sticky md:top-4">
                <div className="flex md:flex-col justify-between h-full">
                    <div className="flex md:flex-col gap-2">
                        <div className="text-primary-500 font-bold text-xl hidden sm:flex items-center gap-2 mb-6">
                           <BellIcon className="w-8 h-8"/>
                           <span className="hidden sm:inline">Smart Alarm</span>
                        </div>
                        <nav className="flex flex-row md:flex-col gap-2 w-full justify-around md:justify-start">
                            <NavButton screen={AppScreen.HOME} label="Home" icon={<HomeIcon className="w-6 h-6"/>} />
                            <NavButton screen={AppScreen.QUESTION_EDITOR} label="Questions" icon={<BookOpenIcon className="w-6 h-6"/>} />
                            <NavButton screen={AppScreen.ALARM_EDITOR} label="Alarms" icon={<BellIcon className="w-6 h-6"/>} />
                            <NavButton screen={AppScreen.STATS} label="Stats" icon={<ChartBarIcon className="w-6 h-6"/>} />
                            <NavButton screen={AppScreen.SETTINGS} label="Settings" icon={<CogIcon className="w-6 h-6"/>} />
                        </nav>
                    </div>
                    <div className="flex items-center md:items-start">
                         <button
                            onClick={toggleTheme}
                            title="Toggle Theme"
                            className="p-3 rounded-lg transition-colors duration-200 hover:bg-primary-100 dark:hover:bg-slate-700"
                        >
                            {isDarkMode ? <SunIcon className="w-6 h-6"/> : <MoonIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>
            </aside>
            <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-6">{title}</h1>
                {children}
            </div>
        </div>
    );
};

export default Layout;
