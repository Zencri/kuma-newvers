"use client"



import { useState, useRef, useEffect } from "react";

import { useCurrentUser } from "../context/currentuser";

import { useQuiz } from "../context/quiz";

import LoginModal from "./LoginModal";

import LogoutModal from "./LogoutModal"; // Import the new modal



type SidebarProps = {

  sideBarCollapsed: boolean;

  setSideBarCollapsed: (collapsed: boolean) => void;

};



export default function Sidebar({ sideBarCollapsed, setSideBarCollapsed }: SidebarProps) {

    const { currentUser, isGuest, logout } = useCurrentUser();

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

                                    <div

                                        className="flex-1 truncate cursor-pointer flex items-center gap-2"

                                        onClick={() => loadSession(sess.id)}

                                    >

                                        {isPinned && <span className="text-[10px]">📌</span>}

                                        <span className="truncate">{sess.title}</span>

                                    </div>

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

        </>

    )

}