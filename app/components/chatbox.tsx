"use client"

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCurrentUser } from "../context/currentuser";

type ChatProps = {
    username?: string;
    content?: string;
};

function Chat({ username, content }: ChatProps) {
    return (<>
        <div className="">
            <div className="pl-[5px]">
                <span className="text-[14px] font-semibold">{username} <span className="text-[8px] text-[#808080]">now</span></span>
                <br />
                <span className="">{content}</span>
            </div>
            <hr className="my-1 mr-[15px] border-gray-300" />
        </div>
    </>)
}

export default function Chatbox(
    { sideBarCollapsed, chatSendEnabled, setChatSendEnabled }: { sideBarCollapsed: boolean; chatSendEnabled?: boolean; setChatSendEnabled?: (enabled: boolean) => void }
) {
    const { currentUser } = useCurrentUser();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ username: string; content: string }[]>([
        { username: "Kikuchiyo", content: "Hello, world!" },
        { username: "Kuma", content: "Hi there!" },
    ]);
    const disabled = chatSendEnabled === false;

    const doSend = async () => {
        if (disabled || !input.trim()) return;
        const user = currentUser ?? "You";
        const userMsg = input.trim();

        setMessages(m => [...m, { username: user, content: userMsg }]);
        setInput("");

        try {
            const reply = await invoke<string>("send_message", { prompt: userMsg });
            setMessages(m => [...m, { username: "Kuma", content: reply }]);
            // optionally: call db::save_message via invoke to persist (not added here)
        } catch (e) {
            const err = typeof e === "string" ? e : JSON.stringify(e);
            setMessages(m => [...m, { username: "Kuma", content: `Error: ${err}` }]);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className={`flex-1 overflow-y-auto ${sideBarCollapsed ? "w-full pt-[20px] pl-[20px]" : "w-[calc(100%-50px)] ml-[50px]"} h-full`}>
                {/* Chat messages will go here */}
                {/*<Chat username="Kikuchiyo" content="Hello, world!" />
                <Chat username="Kuma" content="Hi there!" />*/}
                {messages.map((msg, idx) => (
                    <Chat key={idx} username={msg.username} content={msg.content} />
                ))}
            </div>
            <div className={`${sideBarCollapsed ? "w-[calc(100%-10px)]" : "w-[calc(100%-50px)]"} dark:bg-[#3e3e3e] p-[5px] rounded-tl-[10px] rounded-tr-[10px] ${sideBarCollapsed ? "ml-[10px]" : "ml-[50px]"} flex items-end gap-2`}>
                <textarea
                    placeholder="Type your message..."
                    className="flex-1 p-2 border border-gray-300 rounded-md min-h-[45px] max-h-[200px] resize-none"
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
                    tabIndex={0}
                    onClick={() => { if (!disabled) doSend(); }}
                    onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); doSend(); } }}
                    aria-disabled={disabled}
                >Send</div>
            </div>
        </div>
    );
}