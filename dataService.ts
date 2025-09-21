import { Question, Progress, Alarm, QuestionStats } from '../types';

const DB_KEYS = {
    QUESTIONS: 'smart_alarm_questions',
    PROGRESS: 'smart_alarm_progress',
    ALARMS: 'smart_alarm_alarms',
    SETTINGS: 'smart_alarm_settings',
    QUESTION_STATS: 'smart_alarm_question_stats',
};

const get = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error getting data for key ${key}:`, error);
        return defaultValue;
    }
};

const set = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting data for key ${key}:`, error);
    }
};

const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const normalizeQuestionFields = (q: Omit<Question, 'id'> | Question): any => {
    return {
        ...q,
        section: toTitleCase(q.section.trim()),
        chapter: toTitleCase(q.chapter.trim()),
    };
};


export const initDB = (): void => {
    if (!localStorage.getItem(DB_KEYS.QUESTIONS)) {
        const samples: Omit<Question, 'id'>[] = [
            { section: 'Math', chapter: 'Algebra', qtype: 'mcq', payload: { question: '2 + 2 = ?', options: ['3', '4', '5'], answer: '4' } },
            { section: 'Physics', chapter: 'Mechanics', qtype: 'mcq', payload: { question: 'Unit of force?', options: ['Newton', 'Joule', 'Watt'], answer: 'Newton' } },
            { section: 'Chemistry', chapter: 'Organic', qtype: 'mcq', payload: { question: 'Methane formula?', options: ['CH4', 'C2H6', 'C3H8'], answer: 'CH4' } },
            { section: 'Math', chapter: 'Calculus', qtype: 'fill', payload: { question: 'Derivative of x^2?', answer: '2x' } },
            { section: 'Physics', chapter: 'Optics', qtype: 'tf', payload: { question: 'Light speed in vacuum is constant?', answer: 'True' } },
            { section: 'Chemistry', chapter: 'Inorganic', qtype: 'fill', payload: { question: 'Atomic number of Helium?', answer: '2' } },
        ];
        const initialQuestions = samples.map((q, i) => ({ ...normalizeQuestionFields(q), id: i + 1 }));
        set(DB_KEYS.QUESTIONS, initialQuestions);
        set(DB_KEYS.QUESTION_STATS, {});
        set(DB_KEYS.ALARMS, [{ id: 1, time: '07:00', label: 'Morning Revision', enabled: true }]);
        set(DB_KEYS.PROGRESS, []);
        set(DB_KEYS.SETTINGS, { num_questions: '6', strict_mode: '0', dark_mode: '0' });
    }
};

// Questions
export const getAllQuestions = (): Question[] => get(DB_KEYS.QUESTIONS, []);
export const insertQuestion = (question: Omit<Question, 'id'>): void => {
    const questions = getAllQuestions();
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQuestion = { ...normalizeQuestionFields(question), id: newId };
    set(DB_KEYS.QUESTIONS, [...questions, newQuestion]);
};
export const updateQuestion = (updatedQuestion: Question): void => {
    const questions = getAllQuestions();
    const index = questions.findIndex(q => q.id === updatedQuestion.id);
    if (index !== -1) {
        questions[index] = normalizeQuestionFields(updatedQuestion);
        set(DB_KEYS.QUESTIONS, questions);
    }
};
export const deleteQuestion = (qid: number): void => {
    const questions = getAllQuestions();
    set(DB_KEYS.QUESTIONS, questions.filter(q => q.id !== qid));
    const stats = getQuestionStats();
    delete stats[qid];
    set(DB_KEYS.QUESTION_STATS, stats);
};
export const importQuestions = (importedQuestions: Omit<Question, 'id'>[]): void => {
    const existingQuestions = getAllQuestions();
    let maxId = existingQuestions.length > 0 ? Math.max(...existingQuestions.map(q => q.id)) : 0;
    const newQuestions = importedQuestions.map(q => {
        maxId++;
        return { ...normalizeQuestionFields(q), id: maxId };
    });
    set(DB_KEYS.QUESTIONS, [...existingQuestions, ...newQuestions]);
}

// Progress
export const saveProgress = (date: string, points: number, correct: number, total: number): void => {
    const progressHistory = getProgressHistory();
    progressHistory.unshift({ date, points, correct, total });
    set(DB_KEYS.PROGRESS, progressHistory.slice(0, 90)); // Store more history for stats
};
export const getProgressHistory = (limit = 90): Progress[] => get<Progress[]>(DB_KEYS.PROGRESS, []).slice(0, limit);
export const calculateStreak = (): number => {
    const history = getProgressHistory();
    if (history.length === 0) return 0;

    const uniqueDays = [...new Set(history.map(h => new Date(h.date).toISOString().split('T')[0]))];
    if (uniqueDays.length === 0) return 0;

    let streak = 0;
    let today = new Date();
    
    // Check if today is in the list
    if (uniqueDays.includes(today.toISOString().split('T')[0])) {
        streak++;
    } else {
        // If today is not in the list, check if yesterday was the last day
        today.setDate(today.getDate() - 1);
        if(!uniqueDays.includes(today.toISOString().split('T')[0])) {
            return 0; // No activity today or yesterday
        }
    }

    // Check previous days
    for (let i = 1; i < uniqueDays.length + 1; i++) {
        const prevDay = new Date();
        prevDay.setDate(prevDay.getDate() - i);
        const prevDayStr = prevDay.toISOString().split('T')[0];
        
        if (uniqueDays.includes(prevDayStr)) {
            if (i === streak) streak++; // ensure it's consecutive
        } else {
            break; // Gap found
        }
    }
    
    return streak;
};

// Alarms
export const getAlarms = (): Alarm[] => get(DB_KEYS.ALARMS, []);
export const insertAlarm = (time: string, label: string): void => {
    const alarms = getAlarms();
    const newId = alarms.length > 0 ? Math.max(...alarms.map(a => a.id)) + 1 : 1;
    set(DB_KEYS.ALARMS, [...alarms, { id: newId, time, label, enabled: true }]);
};
export const deleteAlarm = (aid: number): void => {
    const alarms = getAlarms();
    set(DB_KEYS.ALARMS, alarms.filter(a => a.id !== aid));
};
export const toggleAlarm = (aid: number): void => {
    const alarms = getAlarms();
    const updatedAlarms = alarms.map(a => a.id === aid ? { ...a, enabled: !a.enabled } : a);
    set(DB_KEYS.ALARMS, updatedAlarms);
};

// Settings
export const getSetting = (key: string, defaultValue: string): string => {
    const settings = get<{ [key: string]: string }>(DB_KEYS.SETTINGS, {});
    return settings[key] || defaultValue;
};
export const saveSetting = (key: string, value: string): void => {
    const settings = get<{ [key: string]: string }>(DB_KEYS.SETTINGS, {});
    settings[key] = value;
    set(DB_KEYS.SETTINGS, settings);
};

// Question Stats & Selection
export const getQuestionStats = (): { [qid: number]: QuestionStats } => get(DB_KEYS.QUESTION_STATS, {});
export const recordQuestionResult = (qid: number, isCorrect: boolean): void => {
    const stats = getQuestionStats();
    const now = new Date().toISOString();
    let currentStat = stats[qid] || { last_seen: '', correct_count: 0, total_count: 0, ease: 2.5 };
    
    currentStat.correct_count += isCorrect ? 1 : 0;
    currentStat.total_count += 1;
    currentStat.ease = Math.max(1.3, currentStat.ease + (isCorrect ? 0.15 : -0.25));
    currentStat.last_seen = now;

    stats[qid] = currentStat;
    set(DB_KEYS.QUESTION_STATS, stats);
};

const calculatePriority = (q: Question, stats: { [qid: number]: QuestionStats }): number => {
    const stat = stats[q.id];
    if (!stat || stat.total_count === 0) {
        return 10.0; // High priority for unseen questions
    }
    const accuracy = stat.correct_count / stat.total_count;
    // Lower ease factor means harder question, higher priority
    // Lower accuracy means harder question, higher priority
    const priority = (1.0 - accuracy) * 5.0 + (3.0 - stat.ease);
    return Math.max(0.1, priority);
};

export const selectSessionQuestions = (totalQ: number): Question[] => {
    const allQuestions = getAllQuestions();
    if (allQuestions.length === 0) return [];

    const stats = getQuestionStats();
    
    const weightedQuestions = allQuestions.map(q => ({
        question: q,
        weight: calculatePriority(q, stats),
    }));

    // Normalize weights
    const totalWeight = weightedQuestions.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
        // Fallback if all weights are zero
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, totalQ);
    }

    const chosen: Question[] = [];
    const pool = [...weightedQuestions];

    while (chosen.length < totalQ && pool.length > 0) {
        const random = Math.random() * pool.reduce((sum, item) => sum + item.weight, 0);
        let cumulativeWeight = 0;
        for (let i = 0; i < pool.length; i++) {
            cumulativeWeight += pool[i].weight;
            if (random < cumulativeWeight) {
                chosen.push(pool[i].question);
                pool.splice(i, 1);
                break;
            }
        }
    }
    
    // If we need more questions than available, cycle through the chosen ones
    if (chosen.length > 0 && allQuestions.length > 0) {
        while (chosen.length < totalQ) {
            chosen.push(chosen[chosen.length % allQuestions.length]);
        }
    }

    return chosen.sort(() => 0.5 - Math.random()); // Shuffle final list
};