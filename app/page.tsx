"use client"

import Image from "next/image";
import Sidebar from "./components/sidebar";
import Chatbox from "./components/chatbox";
import { useEffect, useState } from "react";
import { CurrentUserProvider } from "./context/currentuser";

export default function Home() {
  const [sideBarCollapsed, setSideBarCollapsed] = useState(true)
  const [chatSendEnabled, setChatSendEnabled] = useState(true)

  return (
    <div className="">
      <CurrentUserProvider>
        <main className="">
          <div className="flex h-[100dvh]">
            <Sidebar sideBarCollapsed={sideBarCollapsed} setSideBarCollapsed={setSideBarCollapsed} />
            <Chatbox sideBarCollapsed={sideBarCollapsed} chatSendEnabled={chatSendEnabled} setChatSendEnabled={setChatSendEnabled} />
          </div>
        </main>
      </CurrentUserProvider>
    </div>
  );
}
