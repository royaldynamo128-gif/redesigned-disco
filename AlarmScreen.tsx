
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../App';
import * as dataService from '../services/dataService';

const ALARM_DECREASE_RATE_PER_SEC = 5;
const ALARM_TICK_MS = 100;

const AlarmScreen: React.FC = () => {
    const { startQuiz } = useAppContext();
    const [barValue, setBarValue] = useState(100);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const customSound = dataService.getSetting('custom_alarm_sound', '');
        // Default beep sound data URI
        const defaultBeep = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"+Array(1e3).join("1234567890");
        
        const soundSrc = customSound || defaultBeep;

        audioRef.current = new Audio(soundSrc);
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.warn("Audio autoplay blocked by browser. User interaction may be required."));

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    useEffect(() => {
        const decreasePerTick = (ALARM_DECREASE_RATE_PER_SEC * ALARM_TICK_MS) / 1000;
        const timer = setInterval(() => {
            setBarValue(prev => Math.max(0, prev - decreasePerTick));
        }, ALARM_TICK_MS);

        return () => clearInterval(timer);
    }, []);
    
    useEffect(() => {
        if(barValue === 0) {
            setBarValue(100); // Reset bar when it hits zero to restart the challenge
            // Optional: Increase volume or change sound
        }
    }, [barValue]);
    
    const refillBar = () => {
        setBarValue(100);
    };

    const handleStartQuiz = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        startQuiz();
    }

    const barColor = barValue > 60 ? 'bg-green-500' : barValue > 30 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-95 flex flex-col items-center justify-center p-4 text-white z-50">
            <div className="w-full max-w-2xl text-center space-y-6">
                <h1 className="text-6xl font-bold animate-pulse text-red-400">WAKE UP!</h1>
                <p className="text-xl">Answer questions to turn off the alarm.</p>

                <div 
                    className="w-full bg-slate-700 rounded-full h-16 cursor-pointer border-4 border-slate-500 shadow-lg"
                    onClick={refillBar}
                    title="Click to refill"
                >
                    <div
                        className={`h-full rounded-full transition-all duration-100 ease-linear ${barColor}`}
                        style={{ width: `${barValue}%` }}
                    />
                </div>
                <p className="text-lg">Click the bar to keep it full!</p>
                
                <button
                    onClick={handleStartQuiz}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-8 rounded-lg text-2xl shadow-lg transform hover:scale-105 transition-transform duration-200"
                >
                    Start Quiz
                </button>
            </div>
        </div>
    );
};

export default AlarmScreen;
