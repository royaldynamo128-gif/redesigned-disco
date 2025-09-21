
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import Layout from '../components/Layout';
import { BellIcon } from '../components/Icons';

const HomeScreen: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { alarms, triggerAlarm } = useAppContext();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    const getNextAlarm = () => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const sortedAlarms = [...alarms]
            .filter(a => a.enabled)
            .map(a => {
                const [h, m] = a.time.split(':').map(Number);
                const alarmMinutes = h * 60 + m;
                const diff = alarmMinutes - currentMinutes;
                return { ...a, diff: diff >= 0 ? diff : diff + 24 * 60 };
            })
            .sort((a, b) => a.diff - b.diff);
            
        return sortedAlarms[0];
    };

    const nextAlarm = getNextAlarm();

    return (
        <Layout title="Dashboard">
            <div className="text-center space-y-8">
                <div className="bg-slate-100 dark:bg-slate-700 p-8 rounded-xl shadow-inner">
                    <p className="text-lg text-slate-500 dark:text-slate-400">Current Time</p>
                    <h2 className="text-7xl font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h2>
                </div>

                <div className="bg-slate-100 dark:bg-slate-700 p-8 rounded-xl shadow-inner">
                    <p className="text-lg text-slate-500 dark:text-slate-400">Next Alarm</p>
                    {nextAlarm ? (
                         <h3 className="text-5xl font-semibold text-slate-800 dark:text-slate-200">
                             {nextAlarm.time} - <span className="text-3xl">{nextAlarm.label}</span>
                         </h3>
                    ) : (
                        <p className="text-3xl text-slate-600 dark:text-slate-300">No alarms set</p>
                    )}
                </div>

                <div className="pt-4">
                    <button
                        onClick={triggerAlarm}
                        className="flex items-center justify-center gap-4 w-full max-w-md mx-auto bg-primary-500 hover:bg-primary-600 text-white font-bold py-6 px-8 rounded-full text-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                        <BellIcon className="w-8 h-8 animate-pulse"/>
                        <span>Trigger Manual Revision</span>
                    </button>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Start a practice quiz session anytime.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default HomeScreen;
