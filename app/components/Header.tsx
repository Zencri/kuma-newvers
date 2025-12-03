"use client"

import { useState, useEffect } from "react";
import { useStats } from "../context/stats";
import { useCurrentUser } from "../context/currentuser";
import { db } from "../firebase"; 
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// --- PROFESSIONAL ICONS ---
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const DotsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>;

// --- COMPONENT: Fitness Modal ---
function FitnessModal({ onClose }: { onClose: () => void }) {
    const { stats } = useStats();
    const dailyGoal = 60;
    const progress = Math.min((stats.todayMinutes / dailyGoal) * 100, 100);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-[#181818] border border-gray-700 w-80 rounded-2xl p-6 shadow-2xl relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wider"><ActivityIcon /> Habits Tracker</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>
                
                <div className="flex justify-center mb-6 relative">
                    <div className="w-32 h-32 rounded-full border-8 border-[#333] flex items-center justify-center relative">
                        <div 
                            className="absolute w-full h-full border-8 border-green-500 rounded-full border-l-transparent border-b-transparent transition-all duration-1000 ease-out" 
                            style={{ transform: `rotate(${45 + (progress * 3.6)}deg)` }} 
                        ></div>
                        <div className="text-center z-10">
                            <div className="text-3xl font-bold text-white">{stats.todayMinutes}</div>
                            <div className="text-[10px] text-gray-400 uppercase">Minutes</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-[#222] p-3 rounded-xl flex justify-between items-center">
                        <span className="text-gray-400 text-xs uppercase">Daily Goal ({dailyGoal}m)</span>
                        <span className="text-green-400 font-bold text-sm">{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-[#222] p-3 rounded-xl flex justify-between items-center">
                        <span className="text-gray-400 text-xs uppercase">Current Streak</span>
                        <span className="text-orange-400 font-bold text-sm">{stats.streak} Days</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT: Leaderboard Modal ---
function LeaderboardModal({ onClose }: { onClose: () => void }) {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useCurrentUser();

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const q = query(collection(db, "users"), orderBy("stats.xp", "desc"), limit(20));
                const snapshot = await getDocs(q);
                
                // FILTER: Only show users with valid names (No "Unknown" or "Guest")
                const validLeaders = snapshot.docs
                    .map(doc => ({ uid: doc.id, ...doc.data() } as any))
                    .filter(u => u.name && u.name !== "Guest" && u.name !== "Unknown");

                setLeaders(validLeaders);
            } catch (e) { console.error("Failed to fetch leaderboard", e); } 
            finally { setLoading(false); }
        };
        fetchLeaders();
    }, []);

    // Filter to check if "Friends" exist (excluding me)
    const hasFriends = leaders.filter(u => u.name !== currentUser).length > 0;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-[#181818] border border-gray-700 w-96 rounded-2xl p-6 shadow-2xl relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wider"><BarChartIcon /> Leaderboard</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>
                
                <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-gray-500 py-4 text-xs">Loading...</div>
                    ) : !hasFriends ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="text-3xl mb-2 opacity-30">👥</div>
                            <p className="text-gray-400 text-sm font-bold">No friends yet</p>
                            <p className="text-gray-600 text-xs mt-1">Add friends to unlock the leaderboard.</p>
                        </div>
                    ) : (
                        leaders.map((user, index) => {
                            const isMe = user.name === currentUser;
                            const displayName = user.name ? user.name : "Anonymous Student";
                            
                            return (
                                <div key={user.uid} className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? "bg-blue-900/10 border-blue-500/30" : "bg-[#222] border-transparent"}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-mono text-xs w-6 ${index < 3 ? "text-white" : "text-gray-500"}`}>#{index + 1}</span>
                                        <span className={`text-sm ${isMe ? "text-blue-200 font-bold" : "text-gray-300"}`}>{displayName}</span>
                                    </div>
                                    <span className="text-blue-400 font-mono text-xs">{Math.floor(user.stats?.xp || 0)} XP</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT: Rank Info Modal (NEW) ---
function RankInfoModal({ onClose }: { onClose: () => void }) {
    const ranks = [
        { name: "Novice Bear", level: "1-4" },
        { name: "Apprentice", level: "5-9" },
        { name: "Scholar", level: "10-19" },
        { name: "Grand Master", level: "20-49" },
        { name: "Cyber Sensei", level: "50+" },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-[#181818] border border-gray-700 w-80 rounded-2xl p-6 shadow-2xl relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wider"><TrophyIcon /> Rank Guide</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="space-y-2">
                    {ranks.map((r, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-[#222] rounded-lg">
                            <span className="text-gray-300 text-sm font-medium">{r.name}</span>
                            <span className="text-blue-400 text-xs font-mono">Lvl {r.level}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- MAIN HEADER ---
export default function Header({ onLogout }: { onLogout?: () => void }) {
    const { 
        stats, getLevelProgress, getRankTitle, 
        notifications, markAllNotifsRead, toggleNotifRead, deleteNotification 
    } = useStats(); 

    const { currentUser, isGuest } = useCurrentUser();
    
    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showNotifMenu, setShowNotifMenu] = useState(false);
    const [showFitnessModal, setShowFitnessModal] = useState(false);
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [showRankModal, setShowRankModal] = useState(false); // <--- NEW RANK MODAL STATE

    // Search States
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Notification UI State
    const [activeNotifId, setActiveNotifId] = useState<number | null>(null);
    const hasUnread = notifications.some(n => !n.read);

    // --- HELPER: Clean Rank Title ---
    const cleanRank = (title: string) => {
        return title.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
    };

    // --- SEARCH ENGINE ---
    useEffect(() => {
        const doSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setShowSearchDropdown(false);
                return;
            }
            setIsSearching(true);
            setShowSearchDropdown(true);
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("name", ">=", searchQuery), where("name", "<=", searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                const results = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any)).filter(u => u.name !== currentUser);
                setSearchResults(results);
            } catch (error) { console.error(error); } 
            finally { setIsSearching(false); }
        };
        const timeoutId = setTimeout(doSearch, 500); 
        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentUser]);

    // Close Dropdowns on Click Outside
    useEffect(() => {
        const handleClickOutside = () => { 
            if (showMoreMenu || showProfileMenu || showNotifMenu || showSearchDropdown || activeNotifId !== null) {
                setShowProfileMenu(false); setShowMoreMenu(false); setShowNotifMenu(false); setShowSearchDropdown(false); setActiveNotifId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [showMoreMenu, showProfileMenu, showNotifMenu, showSearchDropdown, activeNotifId]);

    return (
        <>
            {showFitnessModal && <FitnessModal onClose={() => setShowFitnessModal(false)} />}
            {showLeaderboardModal && <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />}
            {showRankModal && <RankInfoModal onClose={() => setShowRankModal(false)} />}

            {/* HEADER BAR */}
            <div className="h-[60px] border-b border-gray-700 flex items-center justify-between px-6 bg-[#212121] relative z-[100]">
                
                {/* SEARCH BAR */}
                <div className="relative w-64" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><SearchIcon /></div>
                    <input 
                        className="w-full bg-[#181818] text-sm text-white rounded-full py-2 pl-10 pr-4 outline-none border border-transparent focus:border-blue-500/50 transition-all placeholder:text-gray-600 focus:bg-[#222]"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if(searchQuery) setShowSearchDropdown(true); }}
                        disabled={isGuest}
                    />
                    
                    {/* SEARCH DROPDOWN */}
                    {showSearchDropdown && (
                        <div className="absolute top-12 left-0 w-80 bg-[#181818] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-[200]">
                            {isSearching ? (
                                <div className="p-4 text-center text-gray-500 text-xs">Searching...</div>
                            ) : searchResults.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <div key={user.uid} className="flex items-center justify-between p-3 hover:bg-[#222] transition-colors border-b border-gray-700/50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-gray-400"><UserIcon /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{user.name || "Anonymous Student"}</div>
                                                    <div className="text-[10px] text-blue-400">Level {user.stats?.level || 1}</div>
                                                </div>
                                            </div>
                                            <button className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors" onClick={() => alert(`Request sent to ${user.name}!`)}>Add +</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-500 text-xs">No users found.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-4">
                    
                    {/* MORE BUTTON */}
                    <div className="relative">
                        <button className={`flex items-center gap-2 text-sm font-semibold transition-colors ${isGuest ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white"}`}
                            onClick={(e) => { e.stopPropagation(); if(!isGuest) setShowMoreMenu(!showMoreMenu); setShowProfileMenu(false); }}>
                            <TrophyIcon /> <span className="hidden sm:inline">More</span>
                        </button>
                        {showMoreMenu && (
                            <div className="absolute top-[45px] right-0 w-48 bg-[#181818] border border-gray-700 rounded-xl shadow-2xl py-2 z-[999] animate-in fade-in slide-in-from-top-2">
                                <button className="w-full text-left px-4 py-3 hover:bg-[#222] text-gray-300 text-sm transition-colors flex items-center gap-2" 
                                    onClick={() => { setShowMoreMenu(false); setShowLeaderboardModal(true); }}>
                                    <BarChartIcon /> Leaderboard
                                </button>
                                <button className="w-full text-left px-4 py-3 hover:bg-[#222] text-gray-300 text-sm transition-colors flex items-center gap-2" 
                                    onClick={() => { setShowMoreMenu(false); setShowFitnessModal(true); }}>
                                    <ActivityIcon /> Habits Tracker
                                </button>
                            </div>
                        )}
                    </div>

                    {/* NOTIFICATION BELL */}
                    <div className="relative">
                        <button className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all ${isGuest ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-[#333]"}`}
                            disabled={isGuest}
                            onClick={(e) => { e.stopPropagation(); if(!isGuest) setShowNotifMenu(!showNotifMenu); setShowMoreMenu(false); setShowProfileMenu(false); }}>
                            <BellIcon />
                            {!isGuest && hasUnread && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#212121]"></div>}
                        </button>
                        
                        {showNotifMenu && (
                            <div className="absolute top-[45px] right-0 w-80 bg-[#181818] border border-gray-700 rounded-xl shadow-2xl p-4 z-[999] animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
                                    <h3 className="font-bold text-white text-xs uppercase tracking-widest">Notifications</h3>
                                    <button 
                                        className="text-[10px] text-blue-400 hover:text-blue-300"
                                        onClick={markAllNotifsRead}
                                    >
                                        Mark all read
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 text-sm">No new notifications.</div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div 
                                                key={notif.id} 
                                                className={`flex justify-between p-2 rounded-lg transition-colors cursor-pointer group ${notif.read ? "opacity-50" : "bg-[#222]/50 hover:bg-[#222]"}`}
                                            >
                                                <div className="flex gap-3 items-center">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${notif.type === 'file' ? 'bg-blue-900/20 text-blue-400' : 'bg-yellow-900/20 text-yellow-400'}`}>
                                                        {notif.type === 'file' ? <FileIcon /> : <StarIcon />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs ${notif.read ? "text-gray-500" : "text-gray-200"}`}>{notif.text}</p>
                                                        <p className="text-[10px] text-gray-600">{notif.time}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* THREE DOTS ACTION (UPDATED) */}
                                                <div className="relative">
                                                    <button 
                                                        className="text-gray-600 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveNotifId(activeNotifId === notif.id ? null : notif.id);
                                                        }}
                                                    >
                                                        <DotsIcon />
                                                    </button>
                                                    {activeNotifId === notif.id && (
                                                        <div className="absolute right-0 top-6 bg-[#181818] border border-gray-700 rounded-md shadow-xl py-1 z-50 w-32 overflow-hidden">
                                                            {/* TOGGLE READ STATUS */}
                                                            <button 
                                                                className="w-full text-left px-3 py-2 text-[10px] text-gray-300 hover:bg-[#222] flex items-center gap-2 border-b border-gray-800"
                                                                onClick={(e) => { e.stopPropagation(); toggleNotifRead(notif.id); setActiveNotifId(null); }}
                                                            >
                                                                <EyeIcon /> {notif.read ? "Mark Unread" : "Mark Read"}
                                                            </button>
                                                            {/* DELETE */}
                                                            <button 
                                                                className="w-full text-left px-3 py-2 text-[10px] text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                                                                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); setActiveNotifId(null); }}
                                                            >
                                                                <TrashIcon /> Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PROFILE BUTTON */}
                    <div className="relative">
                        <div className={`w-9 h-9 rounded-full bg-gray-600 overflow-hidden cursor-pointer border-2 border-transparent transition-all ${isGuest ? "opacity-50 cursor-not-allowed" : "hover:border-blue-500"}`}
                            onClick={(e) => { e.stopPropagation(); if(!isGuest) setShowProfileMenu(!showProfileMenu); setShowMoreMenu(false); setShowNotifMenu(false); }}>
                            <div className="w-full h-full flex items-center justify-center bg-[#333] text-gray-500"><UserIcon /></div>
                        </div>

                        {showProfileMenu && (
                            <div className="absolute top-[45px] right-0 w-64 bg-[#181818] border border-gray-700 rounded-xl shadow-2xl p-4 z-[999] animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{currentUser?.charAt(0).toUpperCase() || "U"}</div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{currentUser || "User"}</div>
                                        {/* CLICKABLE RANK HELP */}
                                        <div 
                                            className="text-xs text-blue-400 flex items-center gap-1 cursor-pointer hover:text-blue-300 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); setShowRankModal(true); setShowProfileMenu(false); }}
                                        >
                                            Level {stats.level} - {cleanRank(getRankTitle())} <HelpIcon />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-1">
                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>XP</span><span>{Math.floor(stats.xp)} / {stats.level * 100}</span></div>
                                    <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-green-400" style={{ width: `${getLevelProgress()}%` }}></div></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}