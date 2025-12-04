"use client"

export default function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    return (
        // DIMMED BLURRED BACKGROUND (Matches LoginModal)
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#181818] border border-gray-700 w-full max-w-sm rounded-2xl p-8 shadow-2xl relative">
                
                {/* Close X (Optional, similar to LoginModal) */}
                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                {/* Header with Icon */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Log Out?</h2>
                    <p className="text-gray-400 text-xs mt-2">
                        You are about to sign out. Your unsaved guest chats will be cleared.
                    </p>
                </div>

                {/* Buttons (Same shape/size as LoginModal) */}
                <div className="space-y-3">
                    <button 
                        onClick={onConfirm}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Yes, Log Out
                    </button>

                    <button 
                        onClick={onCancel}
                        className="w-full py-3 bg-transparent border border-gray-600 hover:bg-[#2a2a2a] text-gray-300 font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>

            </div>
        </div>
    );
}