import React, { useState, useEffect, useMemo } from 'react';
import * as dataService from '../services/dataService';
import Layout from '../components/Layout';
import { Progress, Question } from '../types';
import { useAppContext } from '../App';

type SummaryData = {
    totalPoints: number;
    overallAccuracy: number;
    streak: number;
    sessions: number;
};

type ChartDataPoint = { date: string; accuracy: number };

// A simple SVG sparkline component
const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
    if (data.length < 2) return null;
    const width = 100;
    const height = 30;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / range) * height;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8" preserveAspectRatio="none">
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
};

// A simple SVG Line Chart component
const LineChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    if(data.length === 0) return <div className="text-center p-8 text-slate-500">Not enough data to display chart.</div>;
    
    const width = 500;
    const height = 200;
    const padding = 30;

    const maxAccuracy = 100;
    const minAccuracy = 0;

    const xScale = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
    const yScale = (accuracy: number) => height - padding - (accuracy / maxAccuracy) * (height - 2 * padding);
    
    const points = data.map((d, i) => `${xScale(i)},${yScale(d.accuracy)}`).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Y-Axis labels and grid lines */}
            {[0, 25, 50, 75, 100].map(val => (
                <g key={val}>
                    <text x={padding - 5} y={yScale(val) + 3} textAnchor="end" fontSize="10" className="fill-current text-slate-400">{val}%</text>
                    <line x1={padding} y1={yScale(val)} x2={width - padding} y2={yScale(val)} className="stroke-current text-slate-200 dark:text-slate-700" strokeWidth="1" />
                </g>
            ))}
            
             {/* X-Axis labels */}
            {data.map((d, i) => {
                 if (data.length < 15 || i % Math.floor(data.length / 5) === 0) {
                    return (
                        <text key={i} x={xScale(i)} y={height - padding + 15} textAnchor="middle" fontSize="10" className="fill-current text-slate-400">
                           {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </text>
                    );
                 }
                 return null;
            })}

            {/* Data line */}
            <polyline points={points} fill="none" className="stroke-current text-primary-500" strokeWidth="2" />
        </svg>
    )
}

const StatsScreen: React.FC = () => {
    const { startCustomQuiz } = useAppContext();
    const [dateRange, setDateRange] = useState(30);
    const [history, setHistory] = useState<Progress[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [weakestQuestions, setWeakestQuestions] = useState<Question[]>([]);

    useEffect(() => {
        const allHistory = dataService.getProgressHistory(90);
        const filteredHistory = allHistory.filter(h => {
            const historyDate = new Date(h.date);
            const rangeDate = new Date();
            rangeDate.setDate(rangeDate.getDate() - dateRange);
            return historyDate >= rangeDate;
        });
        setHistory(filteredHistory);

        // Calculate Summary Stats
        if (filteredHistory.length > 0) {
            const totalPoints = filteredHistory.reduce((sum, h) => sum + h.points, 0);
            const totalCorrect = filteredHistory.reduce((sum, h) => sum + h.correct, 0);
            const totalAnswered = filteredHistory.reduce((sum, h) => sum + h.total, 0);
            const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
            setSummary({
                totalPoints,
                overallAccuracy,
                streak: dataService.calculateStreak(),
                sessions: filteredHistory.length,
            });
        } else {
            setSummary({ totalPoints: 0, overallAccuracy: 0, streak: dataService.calculateStreak(), sessions: 0 });
        }
        
        // Prepare Chart Data
        const dailyData: { [date: string]: { correct: number; total: number } } = {};
        filteredHistory.forEach(h => {
            const dateStr = new Date(h.date).toISOString().split('T')[0];
            if (!dailyData[dateStr]) dailyData[dateStr] = { correct: 0, total: 0 };
            dailyData[dateStr].correct += h.correct;
            dailyData[dateStr].total += h.total;
        });
        const chartPoints = Object.entries(dailyData)
            .map(([date, data]) => ({
                date,
                accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
            }))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setChartData(chartPoints);
        
        // Find Weakest Questions
        const stats = dataService.getQuestionStats();
        const questions = dataService.getAllQuestions();
        const weak = questions.map(q => {
            const stat = stats[q.id];
            if (!stat || stat.total_count < 3) return { ...q, weakness: -1 }; // Ignore questions with few attempts
            const accuracy = stat.correct_count / stat.total_count;
            const weakness = (1 - accuracy) * stat.total_count; // Simple weakness score
            return { ...q, weakness };
        })
        .filter(q => q.weakness !== -1)
        .sort((a, b) => b.weakness - a.weakness)
        .slice(0, 5);

        setWeakestQuestions(weak);

    }, [dateRange]);

    const summaryCards = useMemo(() => summary ? [
        { label: 'Overall Accuracy', value: `${summary.overallAccuracy.toFixed(1)}%`, sparkData: chartData.map(d => d.accuracy) },
        { label: 'Total Points', value: summary.totalPoints.toLocaleString(), sparkData: history.map(h => h.points).reverse() },
        { label: 'Current Streak', value: `${summary.streak} Day${summary.streak === 1 ? '' : 's'}`, sparkData: [] },
        { label: 'Sessions Logged', value: summary.sessions.toLocaleString(), sparkData: [] },
    ] : [], [summary, chartData, history]);
    
    return (
        <Layout title="Statistics">
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summaryCards.map(card => (
                        <div key={card.label} className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg shadow">
                            <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                            <p className="text-3xl font-bold">{card.value}</p>
                            {card.sparkData.length > 0 && <Sparkline data={card.sparkData} />}
                        </div>
                    ))}
                </div>

                {/* Performance Chart */}
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-semibold">Performance Over Time</h3>
                         <div className="flex gap-1 bg-slate-200 dark:bg-slate-600 p-1 rounded-md">
                            {[7, 30, 90].map(range => (
                                <button key={range} onClick={() => setDateRange(range)} className={`px-2 py-1 text-sm rounded ${dateRange === range ? 'bg-white dark:bg-slate-800 shadow' : 'hover:bg-slate-100 dark:hover:bg-slate-500'}`}>
                                    {range}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <LineChart data={chartData} />
                </div>
                
                {/* Actionable Recommendations */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg shadow">
                         <h3 className="text-xl font-semibold mb-2">Top Weak Items</h3>
                         {weakestQuestions.length > 0 ? (
                             <div className="space-y-2">
                                {weakestQuestions.map(q => (
                                    <p key={q.id} className="text-sm truncate p-2 bg-red-50 dark:bg-red-900/50 rounded">{q.payload.question}</p>
                                ))}
                                <button
                                    onClick={() => startCustomQuiz(weakestQuestions)}
                                    className="w-full mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 font-semibold"
                                >
                                    Review These {weakestQuestions.length} Items
                                </button>
                             </div>
                         ) : <p className="text-sm text-slate-500">Not enough data to identify weak items. Keep practicing!</p>}
                     </div>

                    {/* Session History */}
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-2">Session History</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {history.length > 0 ? history.map((h, i) => (
                             <details key={i} className="bg-slate-200 dark:bg-slate-600 p-2 rounded-md text-sm">
                                 <summary className="cursor-pointer font-medium">
                                     {new Date(h.date).toLocaleString()}: {h.correct}/{h.total} ({h.points} pts)
                                 </summary>
                                 <p className="pt-2 mt-2 border-t border-slate-300 dark:border-slate-500">A detailed breakdown of the questions in this session would appear here.</p>
                             </details>
                        )) : <p className="text-sm text-slate-500">No sessions recorded in this period.</p>}
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default StatsScreen;
