"use client"

import { useState } from "react";
import { useCurrentUser } from "../context/currentuser";
import { useQuiz } from "../context/quiz"; // Import Context

type LoginModalProps = {
    onClose: () => void;
    onContinueGuest: () => void;
    preserveSession?: boolean; // NEW PROP
};

export default function LoginModal({ onClose, onContinueGuest, preserveSession = false }: LoginModalProps) {
    const { registerWithEmail, loginWithEmail } = useCurrentUser();
    const { enableDataPreservation } = useQuiz(); // Get Flag Function
    
    const [isSignup, setIsSignup] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // IF PRESERVE IS ON (Upsell Mode), ENABLE FLAG BEFORE LOGIN
            if (preserveSession) {
                enableDataPreservation();
            }

            if (isSignup) {
                if (!name) throw new Error("Please enter your name.");
                await registerWithEmail(name, email, password);
            } else {
                await loginWithEmail(email, password);
            }
            onClose(); 
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") setError("Email already used.");
            else if (err.code === "auth/invalid-credential") setError("Wrong email or password.");
            else if (err.code === "auth/weak-password") setError("Password is too weak (use 6+ chars).");
            else setError(err.message || "Failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#181818] border border-gray-700 w-full max-w-sm rounded-2xl p-8 shadow-2xl relative">
                
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {isSignup ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="text-gray-400 text-xs mt-2">
                        {isSignup ? "Save your notes & quizzes forever." : "Login to access your saved chats."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Name</label>
                            <input 
                                type="text" 
                                className="w-full bg-[#2a2a2a] text-white border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-[#2a2a2a] text-white border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-[#2a2a2a] text-white border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Processing..." : (isSignup ? "Sign Up" : "Log In")}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button onClick={() => { setIsSignup(!isSignup); setError(""); }} className="text-blue-400 hover:underline">
                            {isSignup ? "Log In" : "Sign Up"}
                        </button>
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                    <button 
                        onClick={onContinueGuest}
                        className="text-xs text-gray-500 hover:text-white transition-colors underline"
                    >
                        Continue as Guest
                    </button>
                </div>

            </div>
        </div>
    );
}