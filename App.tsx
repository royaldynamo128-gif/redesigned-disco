import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { AppScreen, Question, Alarm, QuizSession } from './types';
import * as dataService from './services/dataService';

import HomeScreen from './screens/HomeScreen';
import AlarmScreen from './screens/AlarmScreen';
import QuestionScreen from './screens/QuestionScreen';
import ResultScreen from './screens/ResultScreen';
import SettingsScreen from './screens/SettingsScreen';
import QuestionEditorScreen from './screens/QuestionEditorScreen';
import AlarmEditorScreen from './screens/AlarmEditorScreen';
import StatsScreen from './screens/StatsScreen';
import { AppContextType } from './types';

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

const App: React.FC = () => {
    const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    const alarmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        dataService.initDB();
        setAlarms(dataService.getAlarms());
        const darkModeSetting = dataService.getSetting('dark_mode', '0') === '1';
        setIsDarkMode(darkModeSetting);
    }, []);
    
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const startQuizSession = (questions: Question[]) => {
        if (questions.length === 0) {
            alert('No questions available for this session.');
            return;
        }
        
        const settings = {
            strictMode: dataService.getSetting('strict_mode', '0') === '1',
        };

        setQuizSession({
            questions,
            currentQuestionIndex: 0,
            correctAnswers: 0,
            points: 0,
            initialQuestionCount: questions.length,
            strictMode: settings.strictMode,
        });

        setCurrentScreen(AppScreen.ALARM);
    };

    const triggerAlarm = useCallback(() => {
        // Prevent triggering if a quiz is already active
        if (quizSession) {
            console.log("Alarm trigger skipped: quiz session already in progress.");
            return;
        }
        const numQuestions = parseInt(dataService.getSetting('num_questions', '6'), 10);
        const questions = dataService.selectSessionQuestions(numQuestions);
        startQuizSession(questions);
    }, [quizSession]);

    const startCustomQuiz = useCallback((questions: Question[]) => {
        startQuizSession(questions);
    }, []);
    
    // Efficient Alarm Scheduling Effect
    useEffect(() => {
        const scheduleNextAlarm = () => {
            if (alarmTimeoutRef.current) {
                clearTimeout(alarmTimeoutRef.current);
            }
            
            const activeAlarms = dataService.getAlarms().filter(a => a.enabled);
            if (activeAlarms.length === 0) return;

            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            const sortedAlarms = activeAlarms
                .map(a => {
                    const [h, m] = a.time.split(':').map(Number);
                    const alarmTotalMinutes = h * 60 + m;
                    let diff = alarmTotalMinutes - nowMinutes;
                    if (diff < 0) { // If alarm time has passed for today
                        diff += 24 * 60; // Schedule for tomorrow
                    }
                    return { ...a, diffMinutes: diff };
                })
                .sort((a, b) => a.diffMinutes - b.diffMinutes);

            const nextAlarm = sortedAlarms[0];

            if (nextAlarm) {
                const msToNextAlarm = (nextAlarm.diffMinutes * 60 - now.getSeconds()) * 1000;
                
                if (msToNextAlarm > 0) {
                    alarmTimeoutRef.current = setTimeout(() => {
                        triggerAlarm();
                        // Reschedule automatically for the next alarm after this one goes off
                        scheduleNextAlarm();
                    }, msToNextAlarm);
                }
            }
        };

        scheduleNextAlarm();

        return () => {
            if (alarmTimeoutRef.current) {
                clearTimeout(alarmTimeoutRef.current);
            }
        };
    }, [alarms, triggerAlarm]);

    const navigate = (screen: AppScreen) => {
        setCurrentScreen(screen);
    };
    
    const startQuiz = () => {
        setCurrentScreen(AppScreen.QUESTION);
    };

    const answerQuestion = (isCorrect: boolean, question: Question) => {
        if (!quizSession) return;
        
        let newSession = { ...quizSession };
        
        dataService.recordQuestionResult(question.id, isCorrect);

        if (isCorrect) {
            newSession.correctAnswers++;
            newSession.points += 10;
        } else if (quizSession.strictMode) {
            newSession.questions = [...newSession.questions, question];
        }

        newSession.currentQuestionIndex++;

        if (newSession.currentQuestionIndex >= newSession.questions.length) {
            dataService.saveProgress(new Date().toISOString(), newSession.points, newSession.correctAnswers, newSession.questions.length);
            setQuizSession(newSession);
            setCurrentScreen(AppScreen.RESULT);
        } else {
            setQuizSession(newSession);
        }
    };
    
    const finishQuiz = () => {
        setQuizSession(null);
        setCurrentScreen(AppScreen.HOME);
    };
    
    const refreshAlarms = () => {
        setAlarms(dataService.getAlarms());
    };

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        dataService.saveSetting('dark_mode', newDarkMode ? '1' : '0');
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case AppScreen.HOME:
                return <HomeScreen />;
            case AppScreen.ALARM:
                return <AlarmScreen />;
            case AppScreen.QUESTION:
                return <QuestionScreen />;
            case AppScreen.RESULT:
                return <ResultScreen />;
            case AppScreen.SETTINGS:
                return <SettingsScreen />;
            case AppScreen.QUESTION_EDITOR:
                return <QuestionEditorScreen />;
            case AppScreen.ALARM_EDITOR:
                return <AlarmEditorScreen />;
            case AppScreen.STATS:
                return <StatsScreen />;
            default:
                return <HomeScreen />;
        }
    };

    const contextValue: AppContextType = {
        currentScreen,
        navigate,
        quizSession,
        startQuiz,
        answerQuestion,
        finishQuiz,
        alarms,
        refreshAlarms,
        isDarkMode,
        toggleTheme,
        triggerAlarm,
        startCustomQuiz,
    };

    return (
        <AppContext.Provider value={contextValue}>
            <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 afont-sans transition-colors duration-300">
                <main className="max-w-7xl mx-auto p-2 sm:p-4">
                    {renderScreen()}
                </main>
            </div>
        </AppContext.Provider>
    );
};

export default App;
