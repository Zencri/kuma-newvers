"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useCurrentUser } from "./currentuser";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore"; 

// --- TYPES ---
export type NotificationItem = {
    id: number;
    text: string;
    time: string;
    type: "file" | "star" | "habit" | "friend"; 
    read: boolean;
    fromUid?: string; 
};

type UserStats = {
    xp: number;
    level: number;
    totalMinutes: number;
    todayMinutes: number;
    streak: number;
    lastStudyDate: string;
    history: { [date: string]: number }; // Format: "2023-10-25": 45
    friends: string[]; 
    // NEW: Track when the user studies
    timeOfDay: { morning: number; afternoon: number; night: number; }; 
};

type StatsContextType = {
    stats: UserStats;
    setStats: (stats: UserStats) => void;
    notifications: NotificationItem[];
    addXp: (amount: number) => void;
    pushNotification: (text: string, type: "file" | "star" | "habit" | "friend") => void;
    markAllNotifsRead: () => void;
    toggleNotifRead: (id: number) => void;
    deleteNotification: (id: number) => void;
    getLevelProgress: () => number;
    getRankTitle: () => string;
    isTimerActive: boolean;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
    const { firebaseUser } = useCurrentUser();
    
    const [stats, setStats] = useState<UserStats>({
        xp: 0,
        level: 1,
        totalMinutes: 0,
        todayMinutes: 0,
        streak: 0,
        lastStudyDate: new Date().toISOString().split('T')[0],
        history: {},
        friends: [],
        timeOfDay: { morning: 0, afternoon: 0, night: 0 } // Default
    });

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const studyIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- REAL-TIME LISTENER ---
    useEffect(() => {
        if (firebaseUser && !firebaseUser.isAnonymous) {
            const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.stats) setStats(data.stats);
                    if (data.notifications) setNotifications(data.notifications);
                } else {
                     setNotifications([{ id: 1, text: "Welcome to Kuma AI!", time: "Just now", type: "star", read: false }]);
                }
            });
            return () => unsub(); 
        }
    }, [firebaseUser]);

    // --- HELPER: PUSH NOTIFICATION ---
    const pushNotification = (text: string, type: "file" | "star" | "habit" | "friend") => {
        const newNotif: NotificationItem = {
            id: Date.now(),
            text,
            time: "Just now",
            type,
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markAllNotifsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const toggleNotifRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    const deleteNotification = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

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
            return { ...prev, xp: newXp, level: newLevel };
        });
    };

    // --- TIMER LOGIC (UPDATED FOR TRENDS) ---
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
                const now = new Date();
                const todayKey = now.toISOString().split('T')[0];
                const hour = now.getHours();

                setStats(prev => {
                    // 1. Update Minutes
                    const newTotal = prev.totalMinutes + 1;
                    const newToday = prev.todayMinutes + 1;
                    
                    // 2. Update History (For Calendar)
                    const newHistory = { ...prev.history, [todayKey]: newToday };

                    // 3. Update Time Trends
                    const newTimeOfDay = { ...prev.timeOfDay } || { morning: 0, afternoon: 0, night: 0 };
                    if (hour >= 5 && hour < 12) newTimeOfDay.morning += 1;
                    else if (hour >= 12 && hour < 18) newTimeOfDay.afternoon += 1;
                    else newTimeOfDay.night += 1;

                    return { 
                        ...prev, 
                        totalMinutes: newTotal, 
                        todayMinutes: newToday,
                        history: newHistory,
                        timeOfDay: newTimeOfDay
                    };
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
            markAllNotifsRead, toggleNotifRead, deleteNotification, 
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