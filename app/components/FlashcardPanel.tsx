"use client"
import { useState, useEffect } from "react";
import { useQuiz } from "../context/quiz";

export default function FlashcardPanel() {
    const { setQuizMode, flashcards } = useQuiz(); // USE CONTEXT DATA
    const [cardIndex, setCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Reset when flashcards change
    useEffect(() => {
        setCardIndex(0);
        setIsFlipped(false);
    }, [flashcards]);

    const handleNextCard = () => {
        if (cardIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCardIndex(cardIndex + 1), 150);
        }
    };

    const handlePrevCard = () => {
        if (cardIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCardIndex(cardIndex - 1), 150);
        }
    };

    if (flashcards.length === 0) return <div className="p-6 text-white">No flashcards generated yet.</div>;

    const currentCard = flashcards[cardIndex];
    const progress = ((cardIndex + 1) / flashcards.length) * 100;

    return (
        <div className="h-full w-full bg-[#1e1e1e] border-l border-gray-700 p-6 text-white flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-green-400">Study Flashcards</h2>
                <button onClick={() => setQuizMode(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="w-full bg-gray-800 h-1 rounded-full mb-8">
                <div className="bg-green-500 h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative perspective-1000">
                <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full max-w-md aspect-[3/2] cursor-pointer group"
                    style={{ perspective: "1000px" }}
                >
                    <div className={`
                        relative w-full h-full duration-500 transform-style-3d transition-all
                        ${isFlipped ? "rotate-y-180" : ""}
                    `}
                    style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                    >
                        {/* FRONT */}
                        <div className="absolute inset-0 w-full h-full bg-[#2a2a2a] border border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center backface-hidden"
                             style={{ backfaceVisibility: "hidden" }}>
                            <h3 className="text-xl font-bold text-gray-100 overflow-y-auto max-h-full scrollbar-hide">
                                {currentCard.front}
                            </h3>
                            <p className="absolute bottom-4 text-xs text-gray-500 uppercase tracking-widest">Tap to Flip</p>
                        </div>

                        {/* BACK */}
                        <div className="absolute inset-0 w-full h-full bg-[#1a1a1a] border border-green-500/50 rounded-2xl p-8 flex items-center justify-center text-center backface-hidden"
                             style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                            <p className="text-lg text-green-200 leading-relaxed font-medium overflow-y-auto max-h-full scrollbar-hide">
                                {currentCard.back}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 mt-12">
                    <button 
                        onClick={handlePrevCard}
                        disabled={cardIndex === 0}
                        className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        ←
                    </button>
                    <span className="text-sm font-mono text-gray-400">
                        {cardIndex + 1} / {flashcards.length}
                    </span>
                    <button 
                        onClick={handleNextCard}
                        disabled={cardIndex === flashcards.length - 1}
                        className="p-4 rounded-full bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg transition-all"
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    );
}