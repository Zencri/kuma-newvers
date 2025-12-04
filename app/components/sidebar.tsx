"use client"



import { useState, useRef, useEffect } from "react";

import { useCurrentUser } from "../context/currentuser";

import { useQuiz } from "../context/quiz";

import LoginModal from "./LoginModal";

import LogoutModal from "./LogoutModal"; // Import the new modal

import { doc, getDoc } from "firebase/firestore"; // <--- CHANGE THIS LINE
import { db } from "../firebase";



type SidebarProps = {

  sideBarCollapsed: boolean;

  setSideBarCollapsed: (collapsed: boolean) => void;

};

const MasteryBar = ({ score }: { score: number }) => {
    // Color logic: Red < 50%, Yellow < 80%, Green > 80%
    const color = score < 50 ? "bg-red-500" : score < 80 ? "bg-yellow-500" : "bg-green-500";
    return (
        <div className="mt-1 w-full h-[3px] bg-gray-700/50 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
        </div>
    );
};

// Mock Friends List (You can replace this with a real DB query later)
const FRIENDS = [
    { id: "friend_1", name: "Howard" },
    { id: "friend_2", name: "Alice" },
    { id: "friend_3", name: "Bob" },
];

// --- FIXED SHARE MODAL (Reads from stats.friends) ---
const ShareModal = ({ currentUserId, onClose, onShare }: { currentUserId?: string, onClose: () => void, onShare: (uid: string) => void }) => {
    const [friends, setFriends] = useState<{id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriends = async () => {
            if (!currentUserId) return;
            
            try {
                // 1. Get YOUR User Document first
                const userDocRef = doc(db, "users", currentUserId);
                const userSnap = await getDoc(userDocRef);
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    
                    // 2. Extract the Friend UIDs array from 'stats.friends'
                    // This matches how your Header.tsx works
                    const friendIds: string[] = userData.stats?.friends || [];
                    
                    if (friendIds.length > 0) {
                        // 3. Fetch details for each friend UID
                        const friendPromises = friendIds.map(async (fid) => {
                            const fSnap = await getDoc(doc(db, "users", fid));
                            if (fSnap.exists()) {
                                const fData = fSnap.data();
                                return { 
                                    id: fid, 
                                    name: fData.username || fData.name || "Unknown Friend" 
                                };
                            }
                            return null;
                        });
                        
                        const resolvedFriends = await Promise.all(friendPromises);
                        // Filter out any nulls (deleted users)
                        setFriends(resolvedFriends.filter(f => f !== null) as any);
                    }
                }
            } catch (error) {
                console.error("Error loading friends:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, [currentUserId]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e1e1e] border border-gray-700 p-6 rounded-2xl w-[320px] shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2">Share Study Deck</h3>
                <p className="text-gray-400 text-xs mb-4">Select a friend to collaborate with.</p>
                
                <div className="flex flex-col gap-2 max-h-[200px] min-h-[100px] overflow-y-auto pr-1">
                    {loading && <div className="text-gray-500 text-xs text-center py-4">Loading friends...</div>}

                    {!loading && friends.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-24 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                            <span className="text-2xl mb-1">😢</span>
                            <span className="text-xs">No friends found.</span>
                            <span className="text-[10px] text-gray-600 mt-1">Add friends via the Header menu first!</span>
                        </div>
                    )}

                    {!loading && friends.map(f => (
                        <button key={f.id} 
                            onClick={() => onShare(f.id)}
                            className="flex items-center gap-3 p-3 text-left rounded-xl bg-[#2a2a2a] hover:bg-blue-600 group transition-all border border-transparent hover:border-blue-400"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white group-hover:bg-blue-500 transition-colors">
                                {f.name[0]?.toUpperCase()}
                            </div>
                            <span className="text-gray-200 text-sm font-medium group-hover:text-white">{f.name}</span>
                        </button>
                    ))}
                </div>

                <button onClick={onClose} className="mt-5 w-full py-2 text-xs text-gray-500 hover:text-white transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
};


export default function Sidebar({ sideBarCollapsed, setSideBarCollapsed }: SidebarProps) {

    const { currentUser, isGuest, logout, firebaseUser } = useCurrentUser();

    const {

        createNewSession, sessionTitle, sessions, loadSession, currentSessionId,

        deleteSession, renameSession, togglePinSession, clearAllSessions

    } = useQuiz();



    // Menu State

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);

    const [editName, setEditName] = useState("");

   

    // Modal States

    const [showLoginModal, setShowLoginModal] = useState(false);

    const [showLogoutModal, setShowLogoutModal] = useState(false);



    const menuRef = useRef<HTMLDivElement>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareTargetId, setShareTargetId] = useState<string | null>(null);

    // Get the helper function (Ignore TS error if it hasn't picked up the quiz.tsx changes yet)
    // @ts-ignore
    const { makeSessionShared } = useQuiz();



    // Close menu when clicking outside

    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {

                setOpenMenuId(null);

            }

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, []);



    useEffect(() => {

        if (editingId && inputRef.current) inputRef.current.focus();

    }, [editingId]);



    // SORTING: Pinned items first

    const sortedSessions = [...sessions].sort((a, b) => {

        if (a.pinned === b.pinned) return 0;

        return a.pinned ? -1 : 1;

    });



    const handleRenameSubmit = (id: string) => {

        if (editName.trim()) renameSession(id, editName);

        setEditingId(null);

    };



    // --- LOGOUT HANDLER ---

    const handleLogoutConfirm = async () => {

        // 1. Wipe the UI immediately so the Guest doesn't see User data

        clearAllSessions();

        // 2. Perform the Auth Logout

        await logout();

        // 3. Close Modal

        setShowLogoutModal(false);

    };



    return (

        <>

            {/* SIDEBAR LOGIN (MANUAL MODE) - Default preserveSession={false} */}

            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onContinueGuest={() => setShowLoginModal(false)} />}

           

            {showLogoutModal && <LogoutModal onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutModal(false)} />}

           

            {sideBarCollapsed ? (

                <div className="w-[300px] h-full p-4 dark:bg-[#3c3c3c] rounded-br-[10px] rounded-tr-[10px] flex flex-col">

               

                {/* TOP BAR */}

                <div className="relative w-full">

                    {/* Username Display */}

                    <div className="p-[5px] bg-[#222222] rounded-[20px] text-center select-none cursor-default text-[10px] px-3 font-bold text-gray-300">

                        {currentUser}

                    </div>

                   

                    <div className="absolute right-[-35px] top-[-10px] rounded-tr-full rounded-br-full pr-[15px] pl-[5px] hover:dark:bg-[#3c3c3c] cursor-pointer w-[15px] text-center" onClick={() => setSideBarCollapsed(!sideBarCollapsed)}>

                        &lt;

                    </div>



                    <div className="mt-4 select-none text-[20px] flex items-center justify-between">

                        <span>Chats:</span>

                        <span

                            onClick={createNewSession}

                            className="cursor-pointer hover:dark:bg-[#565656] w-[30px] h-[30px] flex items-center justify-center text-center rounded-full bg-[#4a4a4a] transition-colors"

                            title="Start New Session"

                        >+</span>

                    </div>

                </div>



                {/* LIST */}

                <ul className="mt-3 flex flex-col gap-[2px] overflow-y-auto flex-1 pr-1">

                    {!sessions.find(s => s.id === currentSessionId) && (

                        <li className="pl-[10px] p-[8px] select-none rounded-[4px] text-sm flex items-center bg-[#2a2a2a] border-l-4 border-blue-500 mb-1">

                            <span className="truncate font-semibold">{sessionTitle}</span>

                            <span className="ml-auto text-[10px] text-blue-300">Active</span>

                        </li>

                    )}



                    {sortedSessions.map((sess) => {

                        const isActive = sess.id === currentSessionId;

                        const isPinned = sess.pinned;

                        const isMenuOpen = openMenuId === sess.id;

                        const isEditing = editingId === sess.id;



                        return (

                            <li

                                key={sess.id}

                                className={`relative pl-[10px] p-[8px] rounded-[4px] text-sm flex items-center group transition-colors

                                    ${isActive ? "bg-[#2a2a2a] border-l-4 border-blue-500 font-semibold" : "hover:bg-[#444] text-gray-300"}

                                    ${isPinned ? "border-r-4 border-yellow-500" : ""}`}

                            >

                                {isEditing ? (

                                    <input

                                        ref={inputRef}

                                        value={editName}

                                        onChange={(e) => setEditName(e.target.value)}

                                        onBlur={() => handleRenameSubmit(sess.id)}

                                        onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit(sess.id)}

                                        className="bg-[#222] text-white w-[180px] px-1 rounded outline-none"

                                    />

                                ) : (
                                    <>
                                        {/* 1. TITLE + PROGRESS BAR CONTAINER */}
                                        <div
                                            className="flex-1 overflow-hidden cursor-pointer flex flex-col justify-center mr-2"
                                            onClick={() => loadSession(sess.id)}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                {isPinned && <span className="text-[10px] shrink-0">📌</span>}
                                                <span className="truncate">{sess.title}</span>
                                            </div>

                                            {/* MASTERY BAR: Only shows if PDF exists & score exists */}
                                            {/* @ts-ignore */}
                                            {sess.documents && sess.documents.length > 0 && sess.masteryScore !== undefined && (
                                                // @ts-ignore
                                                <MasteryBar score={sess.masteryScore} />
                                            )}
                                        </div>

                                        {/* 2. SHARE BUTTON (New) */}
                                        <div
                                            className="w-[20px] text-center cursor-pointer hover:text-blue-400 text-gray-400 mr-1 flex items-center justify-center"
                                            title="Share Study Deck"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShareTargetId(sess.id); // Remember which session we are clicking
                                                setShowShareModal(true);   // Open the modal
                                            }}
                                        >
                                            🔗
                                        </div>
                                    </>
                                )}



                                <div

                                    className="w-[20px] text-center cursor-pointer hover:text-white text-gray-400 font-bold"

                                    onClick={(e) => {

                                        e.stopPropagation();

                                        setOpenMenuId(isMenuOpen ? null : sess.id);

                                    }}

                                >

                                    ⋮

                                </div>



                                {isMenuOpen && (

                                    <div ref={menuRef} className="absolute right-0 top-[30px] w-[120px] bg-[#222] border border-gray-600 rounded-md shadow-xl z-50 overflow-hidden flex flex-col">

                                        <button

                                            className="px-3 py-2 text-left hover:bg-[#333] text-xs flex items-center gap-2"

                                            onClick={(e) => { e.stopPropagation(); togglePinSession(sess.id); setOpenMenuId(null); }}

                                        >

                                            {isPinned ? "Unpin" : "Pin"}

                                        </button>

                                        <button

                                            className="px-3 py-2 text-left hover:bg-[#333] text-xs flex items-center gap-2"

                                            onClick={(e) => { e.stopPropagation(); setEditingId(sess.id); setEditName(sess.title); setOpenMenuId(null); }}

                                        >

                                            Rename

                                        </button>

                                        <div className="h-[1px] bg-gray-600"></div>

                                        <button

                                            className="px-3 py-2 text-left hover:bg-red-900/50 text-red-400 text-xs flex items-center gap-2"

                                            onClick={(e) => { e.stopPropagation(); deleteSession(sess.id); setOpenMenuId(null); }}

                                        >

                                            Delete

                                        </button>

                                    </div>

                                )}

                            </li>

                        )

                    })}

                </ul>



                {/* BOTTOM BUTTONS */}

                <div className="mt-4 pt-4 border-t border-gray-600">

                    {isGuest ? (

                        /* SHOW SIGN UP IF GUEST */

                        <>

                            <button

                                onClick={() => setShowLoginModal(true)}

                                className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-md shadow-lg hover:opacity-90 transition-opacity"

                            >

                                Sign up for Free

                            </button>

                            <p className="text-[10px] text-center text-gray-500 mt-2">To save your chats forever</p>

                        </>

                    ) : (

                        /* SHOW LOGOUT IF LOGGED IN */

                        <button

                            onClick={() => setShowLogoutModal(true)}

                            className="w-full py-2 bg-[#2a2a2a] hover:bg-red-900/30 text-gray-400 hover:text-red-400 text-xs font-bold rounded-md border border-gray-600 transition-colors flex items-center justify-center gap-2"

                        >

                            Log Out

                        </button>

                    )}

                </div>



            </div>) : (

            <div className="w-[40px] h-[100dvh] p-4 dark:bg-[#3c3c3c] rounded-br-[10px] rounded-tr-[10px] fixed flex items-start justify-center">

                <div className="hover:dark:bg-[#565656] px-[10px] text-lg cursor-pointer rounded-full" onClick={() => setSideBarCollapsed(!sideBarCollapsed)}>

                    &gt;

                </div>

            </div>)

        }

                {showShareModal && (
                <ShareModal 
                    currentUserId={firebaseUser?.uid}
                    onClose={() => setShowShareModal(false)}
                    onShare={(friendUid) => {
                        if (shareTargetId) {
                            // 1. Update the session locally (adds "SHARED:" prefix)
                            makeSessionShared(shareTargetId, friendUid);
                            // 2. Close modal
                            setShowShareModal(false);
                            // 3. (Optional Alert for Demo)
                            alert(`Invited friend to ${shareTargetId}!`);
                        }
                    }}
                />
            )}

        </>

    )

}