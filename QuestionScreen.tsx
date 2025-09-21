
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { Question } from '../types';

const QuestionScreen: React.FC = () => {
    const { quizSession, answerQuestion } = useAppContext();
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

    const question: Question | undefined = quizSession?.questions[quizSession.currentQuestionIndex];

    useEffect(() => {
        setUserAnswer('');
        setFeedback(null);
    }, [question]);

    if (!quizSession || !question) {
        return <div className="text-center p-8">Loading question...</div>;
    }
    
    const handleSubmit = (selectedAnswer: string) => {
        if (feedback) return; // Prevent multiple submissions
        
        const isCorrect = selectedAnswer.trim().toLowerCase() === question.payload.answer.trim().toLowerCase();
        setFeedback({ correct: isCorrect, message: isCorrect ? 'Correct!' : `The correct answer was: ${question.payload.answer}` });

        setTimeout(() => {
            answerQuestion(isCorrect, question);
        }, 1500); // Wait 1.5 seconds to show feedback
    };

    const renderQuestionType = () => {
        switch (question.qtype) {
            case 'mcq':
                const shuffledOptions = React.useMemo(() => [...(question.payload.options || [])].sort(() => Math.random() - 0.5), [question]);
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {shuffledOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => handleSubmit(opt)}
                                disabled={!!feedback}
                                className="p-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-lg"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                );
            case 'tf':
                return (
                    <div className="flex justify-center gap-4 mt-6">
                        {['True', 'False'].map((opt) => (
                           <button
                                key={opt}
                                onClick={() => handleSubmit(opt)}
                                disabled={!!feedback}
                                className="w-48 p-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-lg"
                            >
                                {opt}
                            </button> 
                        ))}
                    </div>
                );
            case 'fill':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(userAnswer); }} className="mt-6 flex gap-2">
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder={question.payload.placeholder || 'Your answer...'}
                            disabled={!!feedback}
                            className="flex-grow p-3 border-2 border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button type="submit" disabled={!!feedback} className="p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                            Submit
                        </button>
                    </form>
                );
            default:
                return <p>Unsupported question type.</p>;
        }
    };

    const progress = (quizSession.currentQuestionIndex / quizSession.questions.length) * 100;
    
    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 z-40">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
                <div className="space-y-2">
                     <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                        <span>Question {quizSession.currentQuestionIndex + 1} of {quizSession.questions.length}</span>
                        <span>{question.section} - {question.chapter}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <h2 className="text-3xl font-semibold text-center">{question.payload.question}</h2>

                {question.imageData && (
                    <div className="my-4 max-h-64 flex justify-center bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                        <img src={question.imageData} alt="Question visual aid" className="max-h-full max-w-full object-contain rounded-md" />
                    </div>
                )}
                
                <div>{renderQuestionType()}</div>
                
                {feedback && (
                    <div className={`mt-6 p-4 rounded-lg text-center font-bold text-lg ${
                        feedback.correct ? 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200'
                    }`}>
                        {feedback.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionScreen;
