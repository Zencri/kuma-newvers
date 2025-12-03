"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { useCurrentUser } from "./currentuser"; 

// Types
export type FlashcardData = { id: number; front: string; back: string; };
export type QuizQuestion = {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    hint?: string;
    explanation: string;
    topic: string;
};
export type UploadedDocument = {
    name: string;
    content: string;
};

type SavedSession = {
    id: string;
    title: string;
    messages: { username: string; content: string }[];
    documents: UploadedDocument[];
    flashcards: FlashcardData[];
    quizQuestions: QuizQuestion[];
    pinned?: boolean; 
};

type QuizContextType = {
    quizMode: boolean;
    setQuizMode: (active: boolean) => void;
    modeType: "QUIZ" | "FLASHCARDS"; 
    setModeType: (type: "QUIZ" | "FLASHCARDS") => void;
    sessionTitle: string;
    setSessionTitle: (title: string) => void;
    documents: UploadedDocument[];
    addDocument: (doc: UploadedDocument) => void;
    messages: { username: string; content: string }[];
    setMessages: React.Dispatch<React.SetStateAction<{ username: string; content: string }[]>>;
    flashcards: FlashcardData[];
    setFlashcards: (cards: FlashcardData[]) => void;
    quizQuestions: QuizQuestion[];
    setQuizQuestions: (questions: QuizQuestion[]) => void;
    sessions: SavedSession[];
    setSessions: React.Dispatch<React.SetStateAction<SavedSession[]>>; 
    currentSessionId: string; 
    createNewSession: () => void;
    loadSession: (id: string) => void;
    deleteSession: (id: string) => void;
    renameSession: (id: string, newTitle: string) => void;
    togglePinSession: (id: string) => void;
    clearAllSessions: () => void;
    enableDataPreservation: () => void;
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
    // We don't need firebaseUser here anymore because chatbox handles saving
    const DEFAULT_MSG = { username: "Kikuchiyo", content: "Hello! Upload your lecture notes (PDF), then ask for **Flashcards** or a **Quiz**." };

    const [quizMode, setQuizMode] = useState(false);
    const [modeType, setModeType] = useState<"QUIZ" | "FLASHCARDS">("QUIZ");
    const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
    const [sessionTitle, setSessionTitle] = useState("New Session");
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [messages, setMessages] = useState<{ username: string; content: string }[]>([DEFAULT_MSG]);
    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [sessions, setSessions] = useState<SavedSession[]>([]);
    
    // --- NEW: Preservation Ref ---
    const preserveDataRef = useRef(false);

    const enableDataPreservation = () => {
        console.log("Data preservation enabled for next login.");
        preserveDataRef.current = true;
    };

    // --- 3. LIVE SYNC (THE FIX) ---
    // This updates the 'sessions' list in real-time so Chatbox can see it and save it.
    useEffect(() => {
        setSessions(prev => {
            // 1. Define current session object
            const currentData: SavedSession = {
                id: currentSessionId,
                title: sessionTitle,
                messages: messages,
                documents: documents,
                flashcards: flashcards,
                quizQuestions: quizQuestions,
                pinned: prev.find(s => s.id === currentSessionId)?.pinned || false
            };

            // 2. Check if it already exists in the list
            const index = prev.findIndex(s => s.id === currentSessionId);
            
            // 3. Check if it has meaningful data (Prevent saving empty "New Session" spam)
            const isNewAndEmpty = index === -1 && 
                                  messages.length <= 1 && 
                                  documents.length === 0 &&
                                  sessionTitle === "New Session";

            if (isNewAndEmpty) return prev; // Do nothing if it's just an empty new tab

            // 4. Update or Add
            if (index !== -1) {
                // Replace existing session with live data
                const newList = [...prev];
                newList[index] = currentData;
                return newList;
            } else {
                // Add new session to the top
                return [currentData, ...prev];
            }
        });
    }, [messages, sessionTitle, documents, flashcards, quizQuestions, currentSessionId]);


    // HELPERS
    const addDocument = (doc: UploadedDocument) => {
        setDocuments(prev => [...prev, doc]);
        if (sessionTitle === "New Session") setSessionTitle(doc.name);
    };

    const getUpdatedSessions = () => {
        // Used for manual actions, keeps the logic consistent
        const currentData: SavedSession = {
            id: currentSessionId,
            title: sessionTitle,
            messages: messages,
            documents: documents,
            flashcards: flashcards,
            quizQuestions: quizQuestions,
            pinned: sessions.find(s => s.id === currentSessionId)?.pinned || false
        };
        const hasData = messages.length > 1 || documents.length > 0;
        const exists = sessions.find(s => s.id === currentSessionId);
        let newSessionList = [...sessions];
        if (exists) newSessionList = newSessionList.map(s => s.id === currentSessionId ? currentData : s);
        else if (hasData) newSessionList = [currentData, ...newSessionList];
        return newSessionList;
    };

    const loadSession = (id: string) => {
        if (id === currentSessionId) return;
        // Logic: The Live Sync effect above has already updated 'sessions', so we just switch.
        const target = sessions.find(s => s.id === id);
        if (target) {
            setCurrentSessionId(target.id);
            setSessionTitle(target.title);
            setMessages(target.messages);
            setDocuments(target.documents);
            setFlashcards(target.flashcards || []);
            setQuizQuestions(target.quizQuestions || []);
            setQuizMode(false);
        }
    };

    const createNewSession = () => {
        // The Live Sync ensures the *old* session is already saved in the list.
        // We just reset the current state.
        const newId = Date.now().toString();
        setCurrentSessionId(newId);
        setSessionTitle("New Session");
        setMessages([DEFAULT_MSG]);
        setDocuments([]);
        setFlashcards([]);
        setQuizQuestions([]);
        setQuizMode(false);
    };

    const deleteSession = (id: string) => {
        if (id === currentSessionId) {
            createNewSession();
            setSessions(prev => prev.filter(s => s.id !== id));
        } else {
            setSessions(prev => prev.filter(s => s.id !== id));
        }
    };

    const renameSession = (id: string, newTitle: string) => {
        if (id === currentSessionId) setSessionTitle(newTitle);
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    const togglePinSession = (id: string) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s));
    };

    const clearAllSessions = () => {
        setSessions([]); 
        const newId = Date.now().toString();
        setCurrentSessionId(newId);
        setSessionTitle("New Session");
        setMessages([DEFAULT_MSG]);
        setDocuments([]);
        setFlashcards([]);
        setQuizQuestions([]);
        setQuizMode(false);
    };

    return (
        <QuizContext.Provider value={{ 
            quizMode, setQuizMode, modeType, setModeType, 
            sessionTitle, setSessionTitle, documents, addDocument, messages, setMessages,
            flashcards, setFlashcards, quizQuestions, setQuizQuestions,
            sessions, setSessions, createNewSession, loadSession, currentSessionId,
            deleteSession, renameSession, togglePinSession, clearAllSessions,
            enableDataPreservation
        }}>
            {children}
        </QuizContext.Provider>
    );
}

export function useQuiz() {
    const context = useContext(QuizContext);
    if (!context) throw new Error("useQuiz must be used within a QuizProvider");
    return context;
}