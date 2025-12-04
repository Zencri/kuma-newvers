"use client"

import { useState } from "react";
import Sidebar from "./components/sidebar";
import Chatbox from "./components/chatbox";
import QuizPanel from "./components/QuizPanel";         
import FlashcardPanel from "./components/FlashcardPanel";
import { CurrentUserProvider } from "./context/currentuser";
import { QuizProvider, useQuiz } from "./context/quiz";
import { StatsProvider } from "./context/stats"; // <--- 1. IMPORT THIS

function MainContent() {
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  const [chatSendEnabled, setChatSendEnabled] = useState(true);
  
  const { quizMode, modeType } = useQuiz();

  return (
    <main className="">
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar sideBarCollapsed={sideBarCollapsed} setSideBarCollapsed={setSideBarCollapsed} />

        <div className="flex-1 flex relative transition-all duration-500 ease-in-out">
          
          <div className={`transition-all duration-500 ease-in-out h-full ${quizMode ? "w-1/2" : "w-full"}`}>
            <Chatbox
              sideBarCollapsed={sideBarCollapsed}
              chatSendEnabled={chatSendEnabled}
              setChatSendEnabled={setChatSendEnabled}
            />
          </div>

          <div className={`
            absolute top-0 right-0 bottom-0 h-full bg-[#1e1e1e] border-l border-gray-700
            transition-all duration-500 ease-in-out
            ${quizMode ? "w-1/2 translate-x-0 shadow-xl" : "w-1/2 translate-x-full"}
          `}>
              {modeType === "FLASHCARDS" ? <FlashcardPanel /> : <QuizPanel />}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <div className="">
      <CurrentUserProvider>
        <QuizProvider>   {/* ✅ Parent (Stable) */}
            <StatsProvider> {/* ✅ Child (Can update freely) */}
               <MainContent />
            </StatsProvider>
        </QuizProvider>
      </CurrentUserProvider>
    </div>
  );
}