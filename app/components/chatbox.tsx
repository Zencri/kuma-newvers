"use client"

import { useStats } from "../context/stats";
import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCurrentUser } from "../context/currentuser";
import { useQuiz } from "../context/quiz"; 
import LoginModal from "./LoginModal"; 
import LogoutModal from "./LogoutModal"; 
import Header from "./Header"; 

import { doc, setDoc, onSnapshot, collection, query, where } from "firebase/firestore";
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
    // FIXED: Suppressing TypeScript error so the function is recognized at runtime
    // @ts-ignore 
    const { setQuizMode, setModeType, startTargetedRetry } = useQuiz();

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

    const isRetryTrigger = content?.includes("[OPEN_RETRY_BUTTON]");

    if (isRetryTrigger) {
        const cleanContent = content?.replace("[OPEN_RETRY_BUTTON]", "") || "";
        return (
            <div className="mb-6 pl-[5px]">
                 <span className="text-[14px] font-semibold text-blue-400">Kikuchiyo <span className="text-[8px] text-[#808080]">now</span></span>
                 <div className="prose prose-invert prose-sm max-w-none [&>p]:my-1 mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
                 </div>
                 <div className="bg-[#181818] border border-orange-900/50 p-4 rounded-2xl flex items-center justify-between max-w-md shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-900/20 rounded-lg flex items-center justify-center text-xl">💪</div>
                        <div>
                            <h3 className="font-bold text-gray-200 text-sm">Review Complete?</h3>
                            <p className="text-[10px] text-gray-500">Retry the quiz with these topics.</p>
                        </div>
                    </div>
                    <button 
                       onClick={startTargetedRetry} 
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors shadow-md"
                    >
                        Retry Now
                    </button>
                </div>
            </div>
        );
    }


    // --- CITATION HELPER (Preserves your Syntax Highlighting) ---
    const renderWithCitations = (text: string) => {
        const parts = text.split(/(\[(?:Page|p\.?)\s*\d+\])/g);
        return parts.map((part, i) => {
            const match = part.match(/\[(?:Page|p\.?)\s*(\d+)\]/);
            // 1. If it's a citation, render the button
            if (match) {
                return (
                    <button key={i}
                        onClick={() => window.dispatchEvent(new CustomEvent('PDF_JUMP', { detail: { page: parseInt(match[1]) } }))}
                        className="mx-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600/30 text-blue-200 hover:bg-blue-600 hover:text-white border border-blue-500/50 transition-all select-none align-middle cursor-pointer"
                    >📄 P.{match[1]}</button>
                );
            }
            // 2. If it's text, render YOUR existing Markdown logic
            return (
                <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={{
                    // YOUR EXISTING CODE BLOCK STYLING
                    code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                        ) : (<code className="bg-[#444] px-1 rounded text-xs" {...props}>{children}</code>)
                    },
                    // NEW: Render paragraphs as spans so the buttons sit inline with text
                    p: ({node, ...props}) => <span {...props} /> 
                }}>{part}</ReactMarkdown>
            );
        });
    };

    return (
        <div className="">
            <div className="pl-[5px]">
                <span className="text-[14px] font-semibold">{username} <span className="text-[8px] text-[#808080]">now</span></span>
                <br />
                <div className={`text-[14px] ${isAI ? "prose prose-invert prose-sm max-w-none [&>p]:my-1" : "text-white whitespace-pre-wrap"}`}>
                {isAI ? (
                    <div className="leading-7">
                        {renderWithCitations(content || "")}
                    </div>
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
        documents: rawDocuments, // 1. Rename the incoming variable
        addDocument, messages, setMessages,
        sessions, setSessions, 
        sessionTitle, setSessionTitle, clearAllSessions,
        // @ts-ignore
        reviewTrigger, setReviewTrigger,
        // @ts-ignore
        startTargetedRetry, 
        // @ts-ignore
        currentSessionId 
    } = useQuiz();

    // 2. Safety Check: If it's undefined, make it an empty array []
    const documents = rawDocuments || [];

    // --- 2. ADD THIS CALCULATION (Fixes the disappearing header bar) ---
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const currentTopicTitle = currentSession?.title || (documents[0]?.name ?? "Active Topic");
    // Default to 0 if undefined so it doesn't crash
    const currentTopicMastery = currentSession?.masteryScore || 0;

    useEffect(() => {
        if (reviewTrigger && documents.length > 0) {
            const generateReview = async () => {
                // 1. Show "Thinking..." state
                setMessages(m => [...m, { username: "System", content: "Analyzing your mistakes & generating study guide..." }]);
                
                try {
                    // 2. Call the AI
                    const reply = await invoke<string>("send_message", { prompt: reviewTrigger });
                    
                    // 3. Show AI Result
                    setMessages(m => [...m, { username: "Kikuchiyo", content: reply }]);
                    
                    // 4. Reset Trigger
                    if (setReviewTrigger) setReviewTrigger(null);
                } catch (e) {
                    console.error(e);
                }
            };
            generateReview();
        }
    }, [reviewTrigger, documents]);

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
                    // --- EXISTING USER: Load their data ---
                    const data = docSnap.data();

                    if (data.chatHistory) setMessages(data.chatHistory);
                    if (data.stats && setStats) setStats(data.stats); 
                    if (data.sessions && setSessions) setSessions(data.sessions);
                    
                    setIsDataLoaded(true);
                } else {
                    // --- NEW USER (CRITICAL FIX) ---
                    // If no DB doc exists, we MUST wipe any stale data from the previous user
                    // before we allow the "Master Saver" to run.
                    console.log("🆕 New User Detected - Resetting State");
                    
                    setMessages([{ username: "Kikuchiyo", content: "Hello! Upload your lecture notes (PDF), then ask for **Flashcards** or a **Quiz**." }]);
                    setSessions([]);
                    setSessionTitle("New Session");
                    
                    // WIPE STATS
                    if (setStats) {
                        setStats({ xp: 0, level: 1, streaks: 0, friends: [], todayMinutes: 0,weeklyGoal: 120 });
                    }
                    
                    // NOW it is safe to save (It will save the clean state)
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
        // Stop if not logged in or data hasn't loaded
        if (!firebaseUser?.uid || isGuest || !isDataLoaded) return;

        const safeStats = stats || { xp: 0, level: 1, streaks: 0 }; 
        const safeNotifs = notifications || [];
        const safeSessions = sessions || []; 

        const saveData = async () => {
            // HELPER: Removes 'undefined' values which crash Firestore
            const cleanData = (data: any) => JSON.parse(JSON.stringify(data));

            try {
                // @ts-ignore
                const currentSession = sessions.find(s => s.id === currentSessionId);
                const isShared = currentSession?.isShared || false;

                if (isShared) {
                    // --- OPTION A: SAVE TO SHARED DB ---
                    // Note: We don't use cleanData on 'lastUpdated' because we want the real Date object
                    await setDoc(doc(db, "shared_chats", currentSessionId), { 
                        messages: cleanData(messages),
                        participants: currentSession?.participants || [],
                        lastUpdated: new Date()
                    }, { merge: true });

                    // --- BACKUP TO PRIVATE DB ---
                    await setDoc(doc(db, "users", firebaseUser.uid), { 
                        name: currentUser || "User", // <--- FIX: Prevents undefined name crash
                        stats: safeStats, 
                        notifications: safeNotifs,
                        sessions: cleanData(safeSessions) // <--- FIX: Removes undefined fields
                    }, { merge: true });

                } else {
                    // --- OPTION B: SAVE TO PRIVATE DB ---
                    await setDoc(doc(db, "users", firebaseUser.uid), { 
                        name: currentUser || "User", // <--- FIX: Prevents undefined name crash
                        chatHistory: cleanData(messages),
                        stats: safeStats, 
                        notifications: safeNotifs,
                        sessions: cleanData(safeSessions) // <--- FIX: Removes undefined fields
                    }, { merge: true });
                }
            } catch (err) {
                console.error("❌ Auto-Save Failed:", err);
            }
        };

        // Debounce: Wait 500ms after typing stops to save (Prevents fighting with the listener)
        const timer = setTimeout(() => saveData(), 500);
        return () => clearTimeout(timer);
        
    }, [messages, stats, notifications, sessions, firebaseUser, isGuest, isDataLoaded, currentSessionId]);

    // ---------------------------------------------------------
    // --- 3. ACTIVE ROOM LISTENER (Makes it "Live") ---
    // ---------------------------------------------------------
    useEffect(() => {
        // @ts-ignore
        const currentSession = sessions.find(s => s.id === currentSessionId);

        // Only listen if this specific chat is SHARED
        if (currentSession?.isShared) {
            console.log("🔌 Connected to Live Room:", currentSessionId);
            
            const unsub = onSnapshot(doc(db, "shared_chats", currentSessionId), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // ONLY update if the messages are actually different (Prevents loops)
                    if (data.messages && JSON.stringify(data.messages) !== JSON.stringify(messages)) {
                        console.log("📨 Received new messages from friend!");
                        setMessages(data.messages);
                    }
                }
            });
            return () => unsub();
        }
    // @ts-ignore
    }, [currentSessionId, sessions]); // Re-connect if we switch chats

    // ---------------------------------------------------------
    // --- 4. DISCOVERY LISTENER (Finds new invites) ---
    // ---------------------------------------------------------
    useEffect(() => {
        if (!firebaseUser?.uid) return;

        // Query: Find chats where I am a participant
        const q = query(
            collection(db, "shared_chats"), 
            where("participants", "array-contains", firebaseUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const foundSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (foundSessions.length > 0) {
                setSessions(prev => {
                    const newSessions = [...prev];
                    let hasChanges = false;

                    foundSessions.forEach((sharedSess: any) => {
                        const index = newSessions.findIndex(s => s.id === sharedSess.id);
                        
                        if (index === -1) {
                            // NEW INVITE FOUND
                            sharedSess.isShared = true; 
                            
                            // --- FIX: Safe Title Handling ---
                            const safeTitle = sharedSess.title || "Shared Chat";
                            if (!safeTitle.includes("(SHARED)")) {
                                sharedSess.title = `(SHARED) ${safeTitle.replace("SHARED:", "").trim()}`;
                            } else {
                                sharedSess.title = safeTitle;
                            }
                            // --------------------------------

                            newSessions.push(sharedSess);
                            hasChanges = true;
                        } else {
                            // UPDATE EXISTING (Sync Title/Shared Status)
                            if (!newSessions[index].isShared) {
                                newSessions[index].isShared = true;
                                hasChanges = true;
                            }
                        }
                    });

                    return hasChanges ? newSessions : prev;
                });
            }
        });

        return () => unsubscribe();
    }, [firebaseUser]);
        
    // --- FREEMIUM LOGIC STATES ---
    const [messageCount, setMessageCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [hasBypassedLimit, setHasBypassedLimit] = useState(false);

    // --- LOGOUT STATE ---
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- NEW: MULTIPLAYER LISTENER ---
    // This listens to the "shared_chats" collection ONLY if the current session is shared.
    useEffect(() => {
        const currentSession = sessions.find(s => s.id === currentSessionId);
        
        // Only run this if the session is marked as SHARED
        if (currentSession?.isShared) {
            console.log("🔌 Connecting to Shared Room:", currentSessionId);
            
            // Connect to public 'shared_chats' collection
            const unsub = onSnapshot(doc(db, "shared_chats", currentSessionId), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Sync messages from the shared DB to your screen
                    if (data.messages) {
                        setMessages(data.messages);
                    }
                }
            });
            return () => unsub();
        }
    }, [currentSessionId, sessions]);


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

    // --- LOGOUT HANDLER (FIXED) ---
    const handleLogoutConfirm = async () => {
        // 1. LOCK THE GATE (Stop saving immediately)
        setIsDataLoaded(false);

        // 2. WIPE THE UI MANUALLY
        setMessages([{ username: "Kikuchiyo", content: "Hello! Upload your lecture notes (PDF), then ask for **Flashcards** or a **Quiz**." }]);
        setSessions([]);
        setSessionTitle("New Session");
        
        // --- FIX: WIPE STATS & MEMORY ---
        // This prevents User A's rank/friends from leaking to User B
        if (setStats) {
             // Reset to Level 1, 0 XP, No friends
             setStats({ xp: 0, level: 1, streaks: 0, friends: [] , todayMinutes: 0, weeklyGoal: 120}); 
        }
        
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