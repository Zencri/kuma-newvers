"use client"

import { useStats } from "../context/stats";
import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCurrentUser } from "../context/currentuser";
import { useQuiz } from "../context/quiz"; 
import LoginModal from "./LoginModal"; 
import LogoutModal from "./LogoutModal"; 
import Header from "./Header"; 

import { doc, setDoc, onSnapshot } from "firebase/firestore"; 
import { db } from "../firebase";

// Formatting Imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-ignore
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";


type ChatProps = {
    username?: string;
    content?: string;
};

// --- SUB-COMPONENT: Chat Bubble ---
function Chat({ username, content }: ChatProps) {
    const isAI = username === "Kikuchiyo" || username === "Kuma";
    const { setQuizMode, setModeType } = useQuiz(); 

    const isQuizTrigger = content?.includes("[OPEN_QUIZ_CARD]");
    const isFlashcardTrigger = content?.includes("[OPEN_FLASHCARD_CARD]");

    if (isFlashcardTrigger) {
        return (
            <div className="mb-6 pl-[5px]">
                 <span className="text-[14px] font-semibold text-blue-400">System <span className="text-[8px] text-[#808080]">now</span></span>
                 <div className="mt-2 bg-[#181818] border border-green-900/50 p-4 rounded-2xl flex items-center justify-between max-w-md shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-900/20 rounded-lg flex items-center justify-center text-xl">🎴</div>
                        <div>
                            <h3 className="font-bold text-gray-200 text-sm">Study Flashcards Ready</h3>
                            <p className="text-[10px] text-gray-500">Review Terms & Concepts</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setModeType("FLASHCARDS"); setQuizMode(true); }}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors shadow-md"
                    >
                        Open Cards
                    </button>
                </div>
            </div>
        );
    }

    if (isQuizTrigger) {
        return (
            <div className="mb-6 pl-[5px]">
                 <span className="text-[14px] font-semibold text-blue-400">System <span className="text-[8px] text-[#808080]">now</span></span>
                 <div className="mt-2 bg-[#181818] border border-blue-900/50 p-4 rounded-2xl flex items-center justify-between max-w-md shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-900/20 rounded-lg flex items-center justify-center text-xl">📝</div>
                        <div>
                            <h3 className="font-bold text-gray-200 text-sm">Study Quiz Ready</h3>
                            <p className="text-[10px] text-gray-500">Test Your Knowledge</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setModeType("QUIZ"); setQuizMode(true); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors shadow-md"
                    >
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            <div className="pl-[5px]">
                <span className="text-[14px] font-semibold">{username} <span className="text-[8px] text-[#808080]">now</span></span>
                <br />
                <div className={`text-[14px] ${isAI ? "prose prose-invert prose-sm max-w-none [&>p]:my-1" : "text-white whitespace-pre-wrap"}`}>
                    {isAI ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                                    ) : (
                                        <code className="bg-[#444] px-1 rounded text-xs" {...props}>{children}</code>
                                    )
                                }
                            }}
                        >
                            {content || ""}
                        </ReactMarkdown>
                    ) : (
                        <span>{content}</span>
                    )}
                </div>
            </div>
            <hr className="my-1 mr-[15px] border-gray-300 opacity-20" />
        </div>
    )
}

export default function Chatbox(
    { sideBarCollapsed, chatSendEnabled, setChatSendEnabled }: { sideBarCollapsed: boolean; chatSendEnabled?: boolean; setChatSendEnabled?: (enabled: boolean) => void }
) { 
    const { currentUser, isGuest, logout, firebaseUser } = useCurrentUser();
    const { addXp, pushNotification, stats, setStats, notifications } = useStats();
    
    const { 
        setQuizMode, setModeType, setFlashcards, setQuizQuestions, 
        documents, addDocument, messages, setMessages,
        sessions, setSessions, 
        sessionTitle, setSessionTitle, clearAllSessions
    } = useQuiz();

    const [input, setInput] = useState("");
    // --- NEW: SAFETY FLAG ---
    // This prevents the app from saving "0 XP" before the real XP has loaded from DB
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const disabled = chatSendEnabled === false;

    // ---------------------------------------------------------
    // --- 1. MASTER LOADER (Restores Data) ---
    // ---------------------------------------------------------
    useEffect(() => {
        if (firebaseUser?.uid && !isGuest) {
            const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // A. Restore Chat
                    if (data.chatHistory && messages.length === 0) {
                        setMessages(data.chatHistory);
                    }
                    // B. Restore Stats
                    if (data.stats && setStats) { 
                        setStats(data.stats); 
                    }
                    // C. Restore Sidebar
                    if (data.sessions && setSessions) {
                        setSessions(data.sessions);
                    }
                    
                    // D. MARK AS LOADED
                    // Now it is safe to start auto-saving
                    setIsDataLoaded(true);
                } else {
                    // New user? Safe to save.
                    setIsDataLoaded(true);
                }
            });
            return () => unsub();
        }
    }, [firebaseUser, isGuest]);

    // ---------------------------------------------------------
    // --- 2. MASTER SAVER (Syncs Everything) ---
    // ---------------------------------------------------------
    useEffect(() => {
        // 1. STOP if not logged in, is guest, OR DATA HAS NOT LOADED YET
        if (!firebaseUser?.uid || isGuest || !isDataLoaded) return;

        const safeStats = stats || { xp: 0, level: 1, streaks: 0 }; 
        const safeNotifs = notifications || [];
        const safeSessions = sessions || []; 

        const saveData = async () => {
            try {
                await setDoc(doc(db, "users", firebaseUser.uid), { 
                    name: currentUser, // <--- ADD THIS LINE (Fixes Search & Leaderboard)
                    chatHistory: messages,
                    stats: safeStats, 
                    notifications: safeNotifs,
                    sessions: safeSessions 
                }, { merge: true });
            } catch (err) {
                console.error("❌ Auto-Save Failed:", err);
            }
        };

        const timer = setTimeout(() => saveData(), 1000);
        return () => clearTimeout(timer);
        
    }, [messages, stats, notifications, sessions, firebaseUser, isGuest, isDataLoaded]);
        
    // --- FREEMIUM LOGIC STATES ---
    const [messageCount, setMessageCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [hasBypassedLimit, setHasBypassedLimit] = useState(false);

    // --- LOGOUT STATE ---
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        addXp(50); 
        pushNotification(`System uploaded ${file.name}`, "file");

        setMessages(m => [...m, { username: "System", content: `Reading ${file.name}...` }]);
        try {
            const pdfjsLib = await import("pdfjs-dist");
            // @ts-ignore
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                fullText += text.items.map((item: any) => item.str).join(" ");
            }

            addDocument({ name: file.name, content: fullText });

            const summaryPrompt = `
CONTEXT: PDF Content: """${fullText.substring(0, 10000)}""" (truncated)
INSTRUCTIONS: 
1. Provide a concise, executive-level summary.
2. Ask: "Would you like **Flashcards** or a **Quiz** based on your ${documents.length + 1} documents?"
`;
            
            const reply = await invoke<string>("send_message", { prompt: summaryPrompt });
            setMessages(m => [...m, { username: "Kikuchiyo", content: reply }]);
        } catch (e) {
            console.error(e);
            setMessages(m => [...m, { username: "System", content: "Error reading PDF." }]);
        }
    };

    const doSend = async () => {
        if (disabled || !input.trim()) return;

        if (isGuest && !hasBypassedLimit && messageCount >= 2) {
            setShowLoginModal(true); 
            return; 
        }

        const user = currentUser ?? "You";
        const userMsg = input.trim();
        const lowerMsg = userMsg.toLowerCase();
        const globalContext = documents.map(d => `Document [${d.name}]: ${d.content}`).join("\n\n");

        if ((lowerMsg.includes("flashcard") || lowerMsg.includes("quiz")) && documents.length === 0) {
            setMessages(m => [...m, { username: user, content: userMsg }]);
            setTimeout(() => {
                setMessages(m => [...m, { username: "Kikuchiyo", content: "Please upload a PDF first! 📄" }]);
            }, 500);
            setInput("");
            return;
        }

        setMessageCount(prev => prev + 1);
        addXp(2); 

        if (sessionTitle === "New Session" && documents.length === 0) {
            let newTitle = userMsg.slice(0, 25);
            if (userMsg.length > 25) newTitle += "...";
            setSessionTitle(newTitle);
        }

        setMessages(m => [...m, { username: user, content: userMsg }]);
        setInput("");

        // LOGIC: Flashcards
        if (lowerMsg.includes("flashcard") && documents.length > 0) {
            setMessages(m => [...m, { username: "System", content: "Generating flashcards..." }]);
            const flashcardPrompt = `
CONTEXT: """${globalContext.substring(0, 20000)}"""
TASK: Generate flashcards.
OUTPUT: Strict JSON Array ONLY. Format: [{"id": 1, "front": "Term", "back": "Definition"}]
Make at least 10 cards.
`;
            try {
                const jsonStr = await invoke<string>("send_message", { prompt: flashcardPrompt });
                const cleanJson = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
                const cards = JSON.parse(cleanJson);
                if (Array.isArray(cards)) {
                    setFlashcards(cards);
                    setModeType("FLASHCARDS");
                    setMessages(m => [...m, { username: "Kikuchiyo", content: "✅ Generated! [OPEN_FLASHCARD_CARD]" }]);
                    setQuizMode(true);
                }
            } catch (e) { console.error(e); }
            return;
        }

        // LOGIC: Quiz
        if (lowerMsg.includes("quiz") && documents.length > 0) {
            setMessages(m => [...m, { username: "System", content: "Generating quiz..." }]);
            const quizPrompt = `
CONTEXT: """${globalContext.substring(0, 20000)}"""
TASK: Generate 5 multiple-choice questions.
OUTPUT FORMAT: Strict JSON Array ONLY.
EACH object MUST include: "id", "question", "options" (4 strings), "correctIndex", "hint", "explanation", "topic".
`;
            try {
                const jsonStr = await invoke<string>("send_message", { prompt: quizPrompt });
                const cleanJson = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
                const questions = JSON.parse(cleanJson);
                if (Array.isArray(questions)) {
                    setQuizQuestions(questions); 
                    setModeType("QUIZ");
                    setMessages(m => [...m, { username: "Kikuchiyo", content: "✅ Generated! [OPEN_QUIZ_CARD]" }]);
                    setQuizMode(true); 
                }
            } catch (e) { console.error(e); }
            return;
        }

        // LOGIC: Normal Chat
        try {
            let promptToSend = userMsg;
            if (documents.length > 0) {
                promptToSend = `
[SYSTEM MEMORY]
The user has uploaded ${documents.length} files.
Content Sample: """${globalContext.substring(0, 6000)}"""
User said: "${userMsg}"
`;
            }
            const reply = await invoke<string>("send_message", { prompt: promptToSend });
            setMessages(m => [...m, { username: "Kikuchiyo", content: reply }]);
        } catch (e) {
            setMessages(m => [...m, { username: "Kuma", content: `Error: ${e}` }]);
        }
    };

    // --- LOGOUT HANDLER (UPDATED) ---
    const handleLogoutConfirm = async () => {
        // 1. LOCK THE GATE (Stop saving immediately)
        setIsDataLoaded(false);

        // 2. WIPE THE UI MANUALLY (Instantly clears old user's chat)
        setMessages([{ username: "Kikuchiyo", content: "Hello! Upload your lecture notes (PDF), then ask for **Flashcards** or a **Quiz**." }]);
        setSessions([]);
        setSessionTitle("New Session");
        
        // 3. CLEAR CONTEXT & LOGOUT
        clearAllSessions(); 
        await logout();
        setShowLogoutModal(false);
    };

    return (
        <div className="flex-1 flex flex-col h-full relative bg-[#212121]">
            {showLoginModal && (
                <LoginModal 
                    preserveSession={true} 
                    onClose={() => setShowLoginModal(false)}
                    onContinueGuest={() => {
                        setShowLoginModal(false);
                        setHasBypassedLimit(true);
                    }}
                />
            )}
            {showLogoutModal && <LogoutModal onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutModal(false)} />}
            <Header onLogout={() => setShowLogoutModal(true)} />

            <div className={`flex-1 overflow-y-auto ${sideBarCollapsed ? "w-full pt-[20px] pl-[20px]" : "w-[calc(100%-50px)] ml-[50px]"} h-full`}>
                {messages.map((msg, idx) => (
                    <Chat key={idx} username={msg.username} content={msg.content} />
                ))}
                <div ref={bottomRef} />
            </div>
            
            <div className={`${sideBarCollapsed ? "w-[calc(100%-10px)]" : "w-[calc(100%-50px)]"} dark:bg-[#3e3e3e] p-[5px] rounded-tl-[10px] rounded-tr-[10px] ${sideBarCollapsed ? "ml-[10px]" : "ml-[50px]"} flex items-end gap-2`}>
                <input type="file" ref={fileInputRef} accept="application/pdf" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 mb-1 text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    📎 {documents.length > 0 && <span className="text-[10px] bg-blue-600 text-white rounded-full px-1">{documents.length}</span>}
                </button>

                <textarea
                    placeholder={documents.length > 0 ? "Ask about your notes..." : "Upload a PDF to start..."}
                    className="flex-1 p-2 bg-transparent text-white border border-gray-500 rounded-md min-h-[45px] max-h-[200px] resize-none focus:outline-none focus:border-blue-500"
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } }}
                    onInput={e => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                    }}
                />
                
                <div className={`px-4 py-2 bg-blue-600 text-white rounded-md select-none ${!chatSendEnabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
                    role="button"
                    onClick={() => { if (!disabled) doSend(); }}
                >Send</div>
            </div>
                
        </div>
    );
}