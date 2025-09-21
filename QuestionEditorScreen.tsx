import React, { useState, useMemo, useEffect } from 'react';
import * as dataService from '../services/dataService';
import Layout from '../components/Layout';
import { Question, QuestionPayload, QuestionType } from '../types';
import { TrashIcon, PencilIcon, PlusCircleIcon, FolderIcon, DocumentIcon } from '../components/Icons';

type SectionsData = { [section: string]: string[] };

const QuestionForm: React.FC<{
    question?: Question;
    onSave: () => void;
    onCancel: () => void;
}> = ({ question, onSave, onCancel }) => {
    const [section, setSection] = useState(question?.section || '');
    const [chapter, setChapter] = useState(question?.chapter || '');
    const [qtype, setQtype] = useState<QuestionType>(question?.qtype || 'mcq');
    const [questionText, setQuestionText] = useState(question?.payload.question || '');
    const [answer, setAnswer] = useState(question?.qtype !== 'mcq' ? question?.payload.answer || '' : '');
    const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
    const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
    const [imageData, setImageData] = useState(question?.imageData || '');

    useEffect(() => {
        if (question?.qtype === 'mcq') {
            const initialOpts = question.payload.options || [];
            const paddedOpts = [...initialOpts, '', '', '', ''].slice(0, 4);
            setMcqOptions(paddedOpts);
            const correctIndex = initialOpts.findIndex(opt => opt.toLowerCase() === question.payload.answer.toLowerCase());
            setCorrectOptionIndex(correctIndex > -1 ? correctIndex : null);
        } else {
             setAnswer(question?.payload.answer || '');
        }
    }, [question]);

    const allQuestions = useMemo(() => dataService.getAllQuestions(), []);
    const existingSections = useMemo(() => [...new Set(allQuestions.map(q => q.section))], [allQuestions]);
    const existingChapters = useMemo(() => [...new Set(allQuestions.filter(q => q.section === section).map(q => q.chapter))], [allQuestions, section]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalAnswer = answer;
        const payload: Partial<QuestionPayload> = { question: questionText };
        
        if (qtype === 'mcq') {
            if(correctOptionIndex === null || mcqOptions[correctOptionIndex].trim() === ''){
                alert('Please select a valid correct answer for the MCQ.');
                return;
            }
            finalAnswer = mcqOptions[correctOptionIndex].trim();
            payload.options = mcqOptions.map(opt => opt.trim()).filter(opt => opt !== '');
            if(payload.options.length < 2) {
                alert('MCQ questions must have at least 2 options.');
                return;
            }
        } else if (qtype === 'tf') {
            if (!['true', 'false'].includes(answer.trim().toLowerCase())) {
                alert('For True/False questions, the answer must be "True" or "False".');
                return;
            }
        }

        if (!section || !chapter || !questionText || !finalAnswer) {
            alert('Please fill all required fields.');
            return;
        }
        
        payload.answer = finalAnswer;

        const questionData = { section, chapter, qtype, payload: payload as QuestionPayload, imageData };

        if (question) {
            dataService.updateQuestion({ ...question, ...questionData });
        } else {
            dataService.insertQuestion(questionData);
        }
        onSave();
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            if(file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("Image is too large. Please keep it under 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageData(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 space-y-4 h-full overflow-y-auto">
            <h3 className="text-xl font-semibold">{question ? 'Edit Question' : 'Add New Question'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input list="sections" placeholder="Section (e.g., Math)" value={section} onChange={e => setSection(e.target.value)} className="w-full p-2 rounded border bg-white dark:bg-slate-700 dark:border-slate-600" required />
                <datalist id="sections">
                    {existingSections.map(s => <option key={s} value={s} />)}
                </datalist>
                <input list="chapters" placeholder="Chapter (e.g., Algebra)" value={chapter} onChange={e => setChapter(e.target.value)} className="w-full p-2 rounded border bg-white dark:bg-slate-700 dark:border-slate-600" required />
                 <datalist id="chapters">
                    {existingChapters.map(c => <option key={c} value={c} />)}
                </datalist>
            </div>
            <select value={qtype} onChange={e => setQtype(e.target.value as QuestionType)} className="w-full p-2 rounded border bg-white dark:bg-slate-700 dark:border-slate-600">
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="tf">True/False</option>
                <option value="fill">Fill in the Blank</option>
            </select>
            <textarea placeholder="Question Text" value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full p-2 rounded border bg-white dark:bg-slate-700 dark:border-slate-600" rows={3} required />
            
            {qtype === 'mcq' && (
                <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Options & Correct Answer</label>
                    <p className="text-xs text-slate-500">Select the radio button for the correct answer.</p>
                    {mcqOptions.map((opt, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="correct-option"
                                checked={correctOptionIndex === index}
                                onChange={() => setCorrectOptionIndex(index)}
                                className="form-radio h-5 w-5 text-primary-600 bg-slate-200 border-slate-300 focus:ring-primary-500"
                            />
                            <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={opt}
                                onChange={(e) => {
                                    const newOpts = [...mcqOptions];
                                    newOpts[index] = e.target.value;
                                    setMcqOptions(newOpts);
                                }}
                                className="w-full p-2 rounded border bg-white dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                    ))}
                </div>
            )}

            {qtype !== 'mcq' && (
                <input type="text" placeholder="Answer" value={answer} onChange={e => setAnswer(e.target.value)} className="w-full p-2 rounded border bg-white dark:bg-slate-700 dark:border-slate-600" required />
            )}

            <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image (Optional)</label>
                 <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-800/50 dark:file:text-primary-300 dark:hover:file:bg-primary-700/50" />
                 {imageData && (
                     <div className="mt-2 relative w-fit">
                         <img src={imageData} alt="Preview" className="max-w-xs max-h-32 rounded" />
                         <button type="button" onClick={() => setImageData('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0 w-6 h-6 flex items-center justify-center text-lg">&times;</button>
                     </div>
                 )}
            </div>
            
            <div className="flex gap-2 pt-4">
                <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">Save</button>
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-400 dark:hover:bg-slate-500">Cancel</button>
            </div>
        </form>
    );
};

const QuestionView: React.FC<{
    question: Question;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ question, onEdit, onDelete }) => {
    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 space-y-4 h-full overflow-y-auto">
            <div className="flex justify-between items-start">
                 <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{question.section} &gt; {question.chapter}</p>
                 <div className="flex gap-2">
                     <button onClick={onEdit} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full" title="Edit Question"><PencilIcon className="w-5 h-5"/></button>
                     <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full" title="Delete Question"><TrashIcon className="w-5 h-5"/></button>
                 </div>
            </div>
            <h3 className="text-2xl font-semibold">{question.payload.question}</h3>
            {question.imageData && (
                <div className="my-4 max-h-64 flex justify-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                    <img src={question.imageData} alt="Question visual aid" className="max-h-full max-w-full object-contain rounded-md" />
                </div>
            )}
             <div className="space-y-3 text-lg">
                <p><span className="font-semibold text-slate-600 dark:text-slate-300">Type:</span> {question.qtype.toUpperCase()}</p>
                {question.qtype === 'mcq' && <p><span className="font-semibold text-slate-600 dark:text-slate-300">Options:</span> {question.payload.options?.join(', ')}</p>}
                <div className="p-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg">
                    <span className="font-semibold">Answer:</span> {question.payload.answer}
                </div>
            </div>
        </div>
    )
}

const QuestionEditorScreen: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>(dataService.getAllQuestions());
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
    const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view');
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState<{[key: string]: boolean}>({});
    const [searchTerm, setSearchTerm] = useState('');

    const refreshQuestions = () => {
        setQuestions(dataService.getAllQuestions());
    };

    const sectionsData = useMemo<SectionsData>(() => {
        return questions.reduce((acc, q) => {
            if (!acc[q.section]) acc[q.section] = [];
            if (!acc[q.section].includes(q.chapter)) acc[q.section].push(q.chapter);
            return acc;
        }, {} as SectionsData);
    }, [questions]);
    
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const searchMatch = !searchTerm || q.payload.question.toLowerCase().includes(searchTerm.toLowerCase()) || q.payload.answer.toLowerCase().includes(searchTerm.toLowerCase());
            const sectionMatch = !selectedSection || q.section === selectedSection;
            const chapterMatch = !selectedChapter || q.chapter === selectedChapter;
            return searchMatch && sectionMatch && chapterMatch;
        });
    }, [questions, selectedSection, selectedChapter, searchTerm]);

    const activeQuestion = useMemo(() => questions.find(q => q.id === activeQuestionId), [questions, activeQuestionId]);
    
    const handleDelete = (qid: number) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            dataService.deleteQuestion(qid);
            refreshQuestions();
            if(activeQuestionId === qid) setActiveQuestionId(null);
        }
    };

    const handleSave = () => {
        refreshQuestions();
        setMode('view');
        if(mode === 'new') {
            const latestQuestion = dataService.getAllQuestions().sort((a,b) => b.id - a.id)[0];
            if(latestQuestion) {
                 setActiveQuestionId(latestQuestion.id);
            }
        }
    };

    const handleSelectQuestion = (qid: number) => {
        setActiveQuestionId(qid);
        setMode('view');
    }

    const selectAll = () => {
        setSelectedSection(null);
        setSelectedChapter(null);
        setActiveQuestionId(null);
    }

    return (
        <Layout title="Question Bank">
            <div className="flex flex-col md:flex-row gap-4 md:h-[calc(100vh-8.5rem)]">
                {/* Left Pane: Navigation */}
                <div className="w-full md:w-1/3 lg:w-1/4 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg overflow-y-auto">
                    <h3 className="font-semibold mb-2">Categories</h3>
                    <ul className="space-y-1">
                        <li>
                            <button onClick={selectAll} className={`w-full text-left p-2 rounded-md font-semibold ${!selectedSection ? 'bg-primary-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                All Questions ({questions.length})
                            </button>
                        </li>
                        {Object.entries(sectionsData).map(([section, chapters]) => (
                            <li key={section}>
                                <button onClick={() => { setSelectedSection(section); setSelectedChapter(null); setOpenSections(s => ({...s, [section]: !s[section]}))}} className={`w-full text-left p-2 rounded-md flex items-center gap-2 font-medium ${selectedSection === section && !selectedChapter ? 'bg-primary-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                    <FolderIcon className="w-5 h-5"/> {section}
                                </button>
                                {openSections[section] && (
                                    <ul className="pl-4 mt-1 space-y-1">
                                        {chapters.map(chapter => (
                                            <li key={chapter}>
                                                 <button onClick={() => { setSelectedSection(section); setSelectedChapter(chapter); }} className={`w-full text-left p-2 rounded-md flex items-center gap-2 text-sm ${selectedChapter === chapter ? 'bg-primary-400 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                                     <DocumentIcon className="w-4 h-4"/> {chapter}
                                                 </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Right Pane: Content */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                    <div className="w-full md:w-1/2 flex flex-col gap-2">
                         <input type="search" placeholder="Search questions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 rounded border bg-white dark:bg-slate-700 dark:border-slate-600" />
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                                <button key={q.id} onClick={() => handleSelectQuestion(q.id)} className={`w-full p-3 rounded-lg text-left transition-colors ${activeQuestionId === q.id ? 'bg-primary-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                    <p className="font-semibold truncate">{q.payload.question}</p>
                                    <p className={`text-xs ${activeQuestionId === q.id ? 'text-primary-200' : 'text-slate-500'}`}>{q.section} &gt; {q.chapter}</p>
                                </button>
                            )) : <p className="text-center text-slate-500 p-4">No questions match your filter.</p>}
                        </div>
                    </div>
                     <div className="w-full md:w-1/2 min-h-0">
                        {mode === 'edit' && activeQuestion ? <QuestionForm question={activeQuestion} onSave={handleSave} onCancel={() => setMode('view')} /> :
                         mode === 'new' ? <QuestionForm onSave={handleSave} onCancel={() => setMode('view')} /> :
                         activeQuestion ? <QuestionView question={activeQuestion} onEdit={() => setMode('edit')} onDelete={() => handleDelete(activeQuestionId!)} /> :
                         (
                            <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
                                <h2 className="text-xl font-semibold">Select a question to view</h2>
                                <p className="text-slate-500">or</p>
                                <button onClick={() => setMode('new')} className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                                    <PlusCircleIcon className="w-5 h-5"/> Add New Question
                                </button>
                            </div>
                         )}
                     </div>
                </div>
            </div>
        </Layout>
    );
};

export default QuestionEditorScreen;