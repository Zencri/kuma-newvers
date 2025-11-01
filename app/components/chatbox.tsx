"use client"

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

export default function Chatbox({ sideBarCollapsed }: { sideBarCollapsed: boolean }) {
    return (
        <div className="flex-1 flex flex-col h-full">
            <div className={`flex-1 overflow-y-auto ${sideBarCollapsed ? "w-full pt-[20px] pl-[20px]" : "w-[calc(100%-50px)] ml-[50px]"} h-full`}>
                {/* Chat messages will go here */}
                <Chat username="Kikuchiyo" content="Hello, world!" />
                <Chat username="Kuma" content="Hi there!" />
            </div>
            <div className={`${sideBarCollapsed ? "w-[calc(100%-10px)]" : "w-[calc(100%-50px)]"} dark:bg-[#3e3e3e] p-[5px] rounded-tl-[10px] rounded-tr-[10px] ${sideBarCollapsed ? "ml-[10px]" : "ml-[50px]"} flex items-end gap-2`}>
                <textarea
                    placeholder="Type your message..."
                    className="flex-1 p-2 border border-gray-300 rounded-md min-h-[45px] max-h-[200px] resize-none"
                    rows={1}
                    onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                    }}
                />
                <div className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer">Send</div>
            </div>
        </div>
    );
}