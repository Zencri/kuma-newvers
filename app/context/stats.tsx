"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useCurrentUser } from "./currentuser";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// --- TYPES ---
export type NotificationItem = {
    id: number;
    text: string;
    time: string;
    type: "file" | "star" | "habit";
    read: boolean;
};

type UserStats = {
    xp: number;
    level: number;
    totalMinutes: number;
    todayMinutes: number;
    streak: number;
    lastStudyDate: string;
    history: { [date: string]: number };
};

type StatsContextType = {
    stats: UserStats;
    setStats: (stats: UserStats) => void;
    notifications: NotificationItem[];
    addXp: (amount: number) => void;
    pushNotification: (text: string, type: "file" | "star" | "habit") => void;
    markAllNotifsRead: () => void;
    toggleNotifRead: (id: number) => void; // <--- NEW FUNCTION
    deleteNotification: (id: number) => void;
    getLevelProgress: () => number;
    getRankTitle: () => string;
    isTimerActive: boolean;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
    const { firebaseUser } = useCurrentUser();
    
    // --- STATS STATE ---
    const [stats, setStats] = useState<UserStats>({
        xp: 0,
        level: 1,
        totalMinutes: 0,
        todayMinutes: 0,
        streak: 0,
        lastStudyDate: new Date().toISOString().split('T')[0],
        history: {}
    });

    // --- NOTIFICATIONS STATE ---
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        { id: 1, text: "Welcome to Kuma AI!", time: "Just now", type: "star", read: false }
    ]);

    const [isTimerActive, setIsTimerActive] = useState(false);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const studyIntervalRef = useRef<NodeJS.Timeout | null>(null);

   

    // --- HELPER: PUSH NOTIFICATION ---
    const pushNotification = (text: string, type: "file" | "star" | "habit") => {
        const newNotif: NotificationItem = {
            id: Date.now(),
            text,
            time: "Just now",
            type,
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markAllNotifsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // --- NEW: TOGGLE SINGLE READ STATUS ---
    const toggleNotifRead = (id: number) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: !n.read } : n
        ));
    };

    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // --- XP & LEVEL LOGIC ---
    const addXp = (amount: number) => {
        setStats(prev => {
            let newXp = prev.xp + amount;
            let newLevel = prev.level;
            const xpNeeded = newLevel * 100;

            if (newXp >= xpNeeded) {
                newXp -= xpNeeded;
                newLevel++;
                pushNotification(`Level Up! You are now Level ${newLevel}`, "star");
            }

            const newStats = { ...prev, xp: newXp, level: newLevel };
            if (firebaseUser && !firebaseUser.isAnonymous) {
                setDoc(doc(db, "users", firebaseUser.uid), { stats: newStats }, { merge: true });
            }
            return newStats;
        });
    };

    // --- TIMER LOGIC ---
    const resetIdleTimer = () => {
        setIsTimerActive(true);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => setIsTimerActive(false), 2 * 60 * 1000); 
    };

    useEffect(() => {
        window.addEventListener("mousemove", resetIdleTimer);
        window.addEventListener("keypress", resetIdleTimer);
        return () => {
            window.removeEventListener("mousemove", resetIdleTimer);
            window.removeEventListener("keypress", resetIdleTimer);
        };
    }, []);

    useEffect(() => {
        if (isTimerActive) {
            studyIntervalRef.current = setInterval(() => {
                const today = new Date().toISOString().split('T')[0];
                setStats(prev => {
                    // Simple in-memory update for responsiveness
                    // In a real app, you'd sync this to DB periodically
                    return { ...prev, todayMinutes: prev.todayMinutes + 1, totalMinutes: prev.totalMinutes + 1 };
                });
            }, 60 * 1000);
        } else {
            if (studyIntervalRef.current) clearInterval(studyIntervalRef.current);
        }
        return () => { if (studyIntervalRef.current) clearInterval(studyIntervalRef.current); };
    }, [isTimerActive]);

    const getLevelProgress = () => {
        const xpNeeded = stats.level * 100;
        return (stats.xp / xpNeeded) * 100;
    };

    const getRankTitle = () => {
        if (stats.level >= 50) return "Cyber Sensei 🤖";
        if (stats.level >= 20) return "Grand Master 🥋";
        if (stats.level >= 10) return "Scholar 🎓";
        if (stats.level >= 5) return "Apprentice 📚";
        return "Novice Bear 🐻";
    };

    return (
        <StatsContext.Provider value={{ 
            stats, setStats, notifications, addXp, pushNotification, 
            markAllNotifsRead, toggleNotifRead, deleteNotification, // <--- EXPORTED HERE
            getLevelProgress, getRankTitle, isTimerActive 
        }}>
            {children}
        </StatsContext.Provider>
    );
}

export function useStats() {
    const context = useContext(StatsContext);
    if (!context) throw new Error("useStats must be used within a StatsProvider");
    return context;
}