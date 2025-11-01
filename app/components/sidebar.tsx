"use client"

type SidebarProps = {
  sideBarCollapsed: boolean;
  setSideBarCollapsed: (collapsed: boolean) => void;
};

export default function Sidebar({ sideBarCollapsed, setSideBarCollapsed }: SidebarProps) {
    return (
        sideBarCollapsed ? (
            <div className="w-[300px] h-full p-4 dark:bg-[#3c3c3c] rounded-br-[10px] rounded-tr-[10px]">
            <div className="relative w-full h-full">
                <div className="p-[5px] bg-[#222222] rounded-[20px] text-center select-none cursor-pointer text-[10px]">
                    Username
                </div>
                <div className="absolute right-[-35px] top-[-10px] rounded-tr-full rounded-br-full pr-[15px] pl-[5px] hover:dark:bg-[#3c3c3c] cursor-pointer w-[15px] text-center" onClick={() => setSideBarCollapsed(!sideBarCollapsed)}>
                    &lt;
                </div>

                <div className="mt-4 select-none text-[20px] flex items-center justify-between">
                    <span>Chats:</span>
                    <span className="cursor-pointer hover:dark:bg-[#565656] w-[30px] text-center rounded-full">+</span>
                </div>

                <ul className="mt-1 flex flex-col gap-[1px]">
                    <li className="pl-[5px] p-[4px] h-[30px] select-none cursor-pointer hover:dark:bg-[#565656] rounded-[10px] overflow-hidden"><a href="#" className="">Chat Thread</a></li>
                </ul>
            </div>
        </div>) : (
        <div className="w-[40px] h-[100dvh] p-4 dark:bg-[#3c3c3c] rounded-br-[10px] rounded-tr-[10px] fixed flex items-start justify-center">
            <div className="hover:dark:bg-[#565656] px-[10px] text-lg cursor-pointer rounded-full" onClick={() => setSideBarCollapsed(!sideBarCollapsed)}>
                &gt;
            </div>
        </div>)
    )
}