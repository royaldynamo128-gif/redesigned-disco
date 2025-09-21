
import React, { useState } from 'react';
import * as dataService from '../services/dataService';
import Layout from '../components/Layout';
import { Alarm } from '../types';
import { TrashIcon } from '../components/Icons';
import { useAppContext } from '../App';

const AlarmEditorScreen: React.FC = () => {
    const { alarms, refreshAlarms } = useAppContext();
    const [time, setTime] = useState('07:30');
    const [label, setLabel] = useState('Morning Quiz');
    
    const handleAddAlarm = (e: React.FormEvent) => {
        e.preventDefault();
        dataService.insertAlarm(time, label);
        refreshAlarms();
        setLabel('New Alarm');
    };

    const handleDelete = (aid: number) => {
        if (window.confirm('Are you sure you want to delete this alarm?')) {
            dataService.deleteAlarm(aid);
            refreshAlarms();
        }
    };
    
    const handleToggle = (aid: number) => {
        dataService.toggleAlarm(aid);
        refreshAlarms();
    };
    
    return (
        <Layout title="Alarm Settings">
            <div className="space-y-8">
                <form onSubmit={handleAddAlarm} className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg space-y-4">
                    <h3 className="text-xl font-semibold">Add New Alarm</h3>
                    <div className="flex gap-4">
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="p-2 rounded border dark:bg-slate-600 dark:border-slate-500" required />
                        <input type="text" placeholder="Label" value={label} onChange={e => setLabel(e.target.value)} className="flex-grow p-2 rounded border dark:bg-slate-600 dark:border-slate-500" required />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">Add Alarm</button>
                </form>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Your Alarms ({alarms.length})</h3>
                    {alarms.map(alarm => (
                        <div key={alarm.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-4">
                               <label htmlFor={`alarm-toggle-${alarm.id}`} className="inline-flex relative items-center cursor-pointer">
                                    <input type="checkbox" id={`alarm-toggle-${alarm.id}`} className="sr-only peer" checked={alarm.enabled} onChange={() => handleToggle(alarm.id)} />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                </label>
                                <div>
                                    <p className={`text-2xl font-mono ${!alarm.enabled && 'line-through text-slate-400'}`}>{alarm.time}</p>
                                    <p className={`text-sm text-slate-500 dark:text-slate-400 ${!alarm.enabled && 'line-through'}`}>{alarm.label}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(alarm.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-slate-600 rounded-full">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default AlarmEditorScreen;
