
import React from 'react';
import { useAppContext } from '../App';

const ResultScreen: React.FC = () => {
    const { quizSession, finishQuiz } = useAppContext();

    if (!quizSession) {
        return <div className="text-center p-8">No session data available.</div>;
    }
    
    const { points, correctAnswers, questions, initialQuestionCount } = quizSession;
    const totalAnswered = questions.length;
    const accuracy = totalAnswered > 0 ? ((correctAnswers / totalAnswered) * 100).toFixed(1) : 0;
    
    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 z-40">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
                <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400">Session Complete!</h1>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400">Points</p>
                        <p className="text-4xl font-bold">{points}</p>
                    </div>
                     <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400">Accuracy</p>
                        <p className="text-4xl font-bold">{accuracy}%</p>
                    </div>
                </div>
                 <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400">Score</p>
                    <p className="text-4xl font-bold">{correctAnswers} / {totalAnswered}</p>
                    {totalAnswered > initialQuestionCount && (
                        <p className="text-sm text-slate-500">(Strict mode added {totalAnswered - initialQuestionCount} questions)</p>
                    )}
                </div>
                
                <button
                    onClick={finishQuiz}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default ResultScreen;
