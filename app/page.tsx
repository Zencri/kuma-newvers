"use client"

import Image from "next/image";
import Sidebar from "./components/sidebar";
import Chatbox from "./components/chatbox";
import { useEffect, useState } from "react";

export default function Home() {
  const [sideBarCollapsed, setSideBarCollapsed] = useState(true)

  return (
    <div className="">
      <main className="">
        <div className="flex h-[100dvh]">
          <Sidebar sideBarCollapsed={sideBarCollapsed} setSideBarCollapsed={setSideBarCollapsed} />
          <Chatbox sideBarCollapsed={sideBarCollapsed} />
        </div>
      </main>
    </div>
  );
}
