import React, { useState, useEffect } from 'react';
import * as dataService from '../services/dataService';
import Layout from '../components/Layout';
import { useAppContext } from '../App';

const SettingsScreen: React.FC = () => {
    const { isDarkMode, toggleTheme } = useAppContext();
    const [numQuestions, setNumQuestions] = useState(dataService.getSetting('num_questions', '6'));
    const [strictMode, setStrictMode] = useState(dataService.getSetting('strict_mode', '0') === '1');
    const [ringtoneName, setRingtoneName] = useState('Default');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setRingtoneName(dataService.getSetting('custom_alarm_sound_name', 'Default'));
    }, []);

    const handleSave = () => {
        dataService.saveSetting('num_questions', numQuestions);
        dataService.saveSetting('strict_mode', strictMode ? '1' : '0');
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };
    
    const handleRingtoneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                dataService.saveSetting('custom_alarm_sound', base64Url);
                dataService.saveSetting('custom_alarm_sound_name', file.name);
                setRingtoneName(file.name);
                alert('Ringtone saved!');
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid audio file.');
        }
    };

    const resetRingtone = () => {
        dataService.saveSetting('custom_alarm_sound', '');
        dataService.saveSetting('custom_alarm_sound_name', '');
        setRingtoneName('Default');
        alert('Ringtone reset to default.');
    };

    return (
        <Layout title="Settings">
            <div className="space-y-8 max-w-lg">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary-600 dark:text-primary-400">Quiz Settings</h3>
                    <div>
                        <label htmlFor="numQuestions" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Questions Per Alarm
                        </label>
                        <input
                            type="number"
                            id="numQuestions"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">The number of questions you need to answer to stop the alarm.</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Strict Mode
                            </label>
                             <p className="mt-1 text-xs text-slate-500">Incorrectly answered questions will be asked again at the end of the session.</p>
                        </div>
                        <label htmlFor="strict-mode-toggle" className="inline-flex relative items-center cursor-pointer">
                            <input type="checkbox" id="strict-mode-toggle" className="sr-only peer" checked={strictMode} onChange={() => setStrictMode(!strictMode)} />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                    </div>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-primary-600 dark:text-primary-400">Appearance & Sound</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Dark Mode
                            </label>
                             <p className="mt-1 text-xs text-slate-500">Switch between light and dark themes.</p>
                        </div>
                        <label htmlFor="dark-mode-toggle" className="inline-flex relative items-center cursor-pointer">
                            <input type="checkbox" id="dark-mode-toggle" className="sr-only peer" checked={isDarkMode} onChange={toggleTheme} />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                           Custom Alarm Ringtone
                        </label>
                         <p className="mt-1 text-xs text-slate-500">Current: <span className="font-semibold">{ringtoneName}</span></p>
                        <div className="mt-2 flex gap-2">
                             <label className="cursor-pointer bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors">
                                <span>Upload Audio</span>
                                <input type="file" accept="audio/*" className="hidden" onChange={handleRingtoneUpload} />
                            </label>
                            <button onClick={resetRingtone} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Save Settings
                    </button>
                    {showSuccess && <span className="text-green-600 dark:text-green-400">Settings saved!</span>}
                </div>
            </div>
        </Layout>
    );
};

export default SettingsScreen;