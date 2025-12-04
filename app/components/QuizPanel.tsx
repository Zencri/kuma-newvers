"use client"
import { useState, useEffect } from "react";
import { useQuiz } from "../context/quiz";
import FlashcardPanel from "./FlashcardPanel";

export default function QuizPanel() {
    // @ts-ignore
    // @ts-ignore
    const { modeType, setQuizMode, quizQuestions, setQuizQuestions, setReviewTrigger, saveFailedQuestions, updateSessionMastery, currentSessionId } = useQuiz();
    // --- LOCAL STATE ---
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isHintOpen, setIsHintOpen] = useState(false);
    const [wrongQuestionIds, setWrongQuestionIds] = useState<number[]>([]);

    // --- THE FIX: FORCE RESET ON NEW QUIZ LIST ---
    // This runs every time the quizQuestions list is updated (meaning a targeted retry started).
    useEffect(() => {
        // If there are questions, force reset local progress counters
        if (quizQuestions && quizQuestions.length > 0) {
            setCurrentQIndex(0);
            setScore(0);
            setShowResult(false);
            setSelectedOption(null);
            setIsCorrect(null);
            setWrongQuestionIds([]);
        }
    }, [quizQuestions]); // <--- NEW DEPENDENCY: Resets on every new quiz list

    // Safety Checks
    if (modeType === "FLASHCARDS") return <FlashcardPanel />;
    if (!quizQuestions || quizQuestions.length === 0) {
        return (
            <div className="h-full w-full bg-[#1e1e1e] border-l border-gray-700 p-6 text-white flex flex-col items-center justify-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-400">Waiting for AI to generate quiz...</p>
                <button onClick={() => setQuizMode(false)} className="mt-4 text-blue-400 hover:underline">Close</button>
            </div>
        );
    }

    const currentQuestion = quizQuestions[currentQIndex];
    const isLastQuestion = currentQIndex === quizQuestions.length - 1;

    // --- ANSWER LOGIC ---
    const handleAnswer = (index: number) => {
        if (selectedOption !== null) return; 
        setSelectedOption(index);
        
        const correct = index === currentQuestion.correctIndex;
        setIsCorrect(correct);
        
        if (correct) {
            setScore(score + 1);
        } else {
            if (!wrongQuestionIds.includes(currentQuestion.id)) {
                setWrongQuestionIds(prev => [...prev, currentQuestion.id]);
            }
        }
    };

    // --- NEXT QUESTION ---
    const handleNext = () => {
        if (isLastQuestion) {
            // --- NEW SCORING LOGIC (Start) ---
            // 1. Calculate Percentage 
            // (Assumes 'score' is already updated by your option click handler)
            const percentage = Math.round((score / quizQuestions.length) * 100);
            
            // 2. Save to Session
            if (currentSessionId) {
                // @ts-ignore
                updateSessionMastery(currentSessionId, percentage);
            }
            // --- NEW SCORING LOGIC (End) ---
            setShowResult(true);
        } else {
            setCurrentQIndex(currentQIndex + 1);
            setSelectedOption(null);
            setIsCorrect(null);
            setIsHintOpen(false); 
        }
    };

    // --- GENERATE REVIEWER LOGIC ---
    const handleGenerateReview = () => {
        const weakQs = quizQuestions.filter((q: any) => wrongQuestionIds.includes(q.id));
        
        const topicList = weakQs.map((q: any) => q.topic).join(", ");
        const detailList = weakQs.map((q: any) => `
        - Concept: ${q.topic}
        - Question: "${q.question}"
        - Correct Answer: "${q.options[q.correctIndex]}"
        - Explanation: "${q.explanation}"
        `).join("\n");

        const prompt = `
        CONTEXT: The user just failed a quiz on these topics: ${topicList}.
        
        SPECIFIC MISTAKES:
        ${detailList}

        TASK: 
        1. Explain WHY the user might have gotten these wrong.
        2. Provide a detailed "Mini-Reviewer" or study guide specifically for these concepts.
        3. Use analogies or simple terms.
        4. End the message by asking: "Type **'Ready'** or click below when you want to retry the quiz."
        5. Add this specific tag at the very end: [OPEN_RETRY_BUTTON]
        `;

        if (saveFailedQuestions) {
            saveFailedQuestions(wrongQuestionIds); 
        }
        if (setReviewTrigger) {
            setReviewTrigger(prompt); 
        }
        setQuizMode(false); 
    };

    // --- RESULTS SCREEN ---
    if (showResult) {
        const isPerfect = score === quizQuestions.length;
        return (
            <div className="h-full w-full bg-[#1e1e1e] border-l border-gray-700 p-8 text-white flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="text-6xl mb-4 animate-bounce">{isPerfect ? "🌟" : "📊"}</div>
                <h2 className="text-3xl font-bold mb-2">{isPerfect ? "Mastery Achieved!" : "Quiz Complete"}</h2>
                <p className="text-xl mb-6">Score: <span className="text-blue-400">{score} / {quizQuestions.length}</span></p>
                
                {!isPerfect && wrongQuestionIds.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6 w-full max-w-sm">
                        <p className="text-sm text-yellow-400 font-bold">Focus Areas Detected</p>
                        <p className="text-xs text-gray-400 mt-1">We found {wrongQuestionIds.length} questions to review.</p>
                    </div>
                )}

                <div className="flex flex-col gap-3 w-full max-w-xs">
                     {!isPerfect && (
                        <button 
                            onClick={handleGenerateReview} 
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                        >
                            ⚡ Generate AI Study Guide
                        </button>
                    )}
                    <button onClick={() => setQuizMode(false)} className="text-gray-500 hover:text-white mt-2 text-sm">Return to Chat</button>
                </div>
            </div>
        );
    }

    // --- QUESTION SCREEN ---
    return (
        <div className="h-full w-full bg-[#1e1e1e] border-l border-gray-700 p-6 text-white flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-blue-400">AI Quiz</h2>
                    <p className="text-xs text-gray-400">Question {currentQIndex + 1} of {quizQuestions.length} • {currentQuestion.topic}</p>
                </div>
                <button onClick={() => setQuizMode(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="w-full bg-gray-800 h-2 rounded-full mb-6">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentQIndex + 1) / quizQuestions.length) * 100}%` }} />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-xl font-medium mb-6 leading-relaxed">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                    {quizQuestions[currentQIndex].options.map((option: string, idx: number) => {
                        let btnClass = "bg-[#2a2a2a] border-gray-600 hover:border-gray-400";
                        if (selectedOption !== null) {
                            if (idx === currentQuestion.correctIndex) btnClass = "bg-green-900/40 border-green-500 text-green-200";
                            else if (idx === selectedOption && !isCorrect) btnClass = "bg-red-900/40 border-red-500 text-red-200";
                            else btnClass = "opacity-40 border-transparent";
                        }
                        return (
                            <button key={idx} onClick={() => handleAnswer(idx)} disabled={selectedOption !== null} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${btnClass}`}>
                                <span className="mr-3 font-bold opacity-50">{String.fromCharCode(65 + idx)}.</span>{option}
                            </button>
                        );
                    })}
                </div>

                {selectedOption !== null && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4">
                        <div className={`p-4 rounded-lg mb-4 border ${isCorrect ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{isCorrect ? "✅" : "❌"}</span>
                                <span className={`font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                                    {isCorrect ? "Correct" : "Incorrect"}
                                </span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {currentQuestion.explanation || "No explanation provided."}
                            </p>
                        </div>
                        <button onClick={handleNext} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">
                            {isLastQuestion ? "View Results" : "Next Question →"}
                        </button>
                    </div>
                )}

                {currentQuestion.hint && selectedOption === null && (
                    <div className="mt-8">
                        <button 
                            onClick={() => setIsHintOpen(!isHintOpen)}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-400 transition-colors mx-auto"
                        >
                            <span>{isHintOpen ? "Hide Hint ▲" : "Need a Hint? ▼"}</span>
                        </button>
                        
                        {isHintOpen && (
                            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg text-sm text-blue-200 text-center animate-in fade-in zoom-in-95 duration-200">
                                💡 {currentQuestion?.hint} {/* <--- FIXED LINE */}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}