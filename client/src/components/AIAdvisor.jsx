import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Lightbulb, User, MessageSquare, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AIAdvisor() {
    const { token, axios, user, setShowLogin } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: 'Hello! I am your CarRental Fleet Advisor. Describe your trip (destination, passengers, budget, luggage, terrain) and I will match you with the absolute perfect vehicle from our available fleet.',
            isWelcome: true
        }
    ]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll to the bottom of the chat on new messages
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    // Handle suggestion chip clicks
    const handleSuggestionClick = (suggestionText) => {
        if (!token) {
            setShowLogin(true);
            return;
        }
        submitQuery(suggestionText);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        submitQuery(query);
    };

    const submitQuery = async (textToSend) => {
        // Optimistically add user message
        const userMsg = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const { data } = await axios.post('/api/ai/advisor', { userQuery: textToSend });
            
            if (data.success) {
                setMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: data.recommendation, 
                    warning: data.warning 
                }]);
            } else {
                setMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: data.message || 'Sorry, I encountered an issue fetching recommendations.' 
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: error.response?.data?.message || 'Error: Could not connect to Advisor service.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Helper to parse advisor response into structured content
    const parseRecommendation = (text) => {
        if (!text) return null;

        const topRecRegex = /#### 🏆 Top Recommendation:\s*([^\n]+)([\s\S]*?)(?=#### ⚖️|$)/i;
        const altRecRegex = /#### ⚖️ Great Alternative:\s*([^\n]+)([\s\S]*?)(?=#### 💡|$)/i;
        const tipRegex = /#### 💡 Travel Tip\s*([\s\S]*?)$/i;

        const topMatch = text.match(topRecRegex);
        const altMatch = text.match(altRecRegex);
        const tipMatch = text.match(tipRegex);

        const getDetails = (blockText) => {
            if (!blockText) return {};
            const whyMatch = blockText.match(/\*\s+\*\*Why(?: it's perfect| consider this):\*\*\s*([^\n]+)/i);
            const costMatch = blockText.match(/\*\s+\*\*Estimated Cost:\*\*\s*([^\n]+)/i);
            const advMatch = blockText.match(/\*\s+\*\*Key Advantage:\*\*\s*([^\n]+)/i);
            return {
                why: whyMatch ? whyMatch[1].trim() : "",
                cost: costMatch ? costMatch[1].trim() : "",
                advantage: advMatch ? advMatch[1].trim() : ""
            };
        };

        const result = {
            hasStructure: false,
            top: null,
            alternative: null,
            tip: null,
            rawText: text
        };

        if (topMatch) {
            result.hasStructure = true;
            result.top = {
                title: topMatch[1].trim(),
                ...getDetails(topMatch[2])
            };
        }

        if (altMatch) {
            result.hasStructure = true;
            result.alternative = {
                title: altMatch[1].trim(),
                ...getDetails(altMatch[2])
            };
        }

        if (tipMatch) {
            result.hasStructure = true;
            result.tip = tipMatch[1].replace(/\n/g, " ").trim();
        }

        return result;
    };

    // Sub-component to render structured advisor response
    const AdvisorResponse = ({ msg }) => {
        const parsed = parseRecommendation(msg.text);

        if (!parsed || !parsed.hasStructure) {
            // Fallback for simple/unstructured responses
            return (
                <div className="space-y-2 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {msg.text}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Offline Warning Banner */}
                {msg.warning && (
                    <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{msg.warning}</span>
                    </div>
                )}

                {/* Top Recommendation Card */}
                {parsed.top && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg shadow-xs">
                        <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-sm mb-1.5">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <span>🏆 Top Pick: {parsed.top.title}</span>
                        </div>
                        {parsed.top.why && (
                            <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                                {parsed.top.why}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-2xs">
                            {parsed.top.cost && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                                    💰 {parsed.top.cost}
                                </span>
                            )}
                            {parsed.top.advantage && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-medium">
                                    ⭐ {parsed.top.advantage}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Alternative Card */}
                {parsed.alternative && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-xs">
                        <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-xs mb-1.5">
                            <span>⚖️ Great Alternative: {parsed.alternative.title}</span>
                        </div>
                        {parsed.alternative.why && (
                            <p className="text-2xs text-gray-600 mb-2 leading-relaxed">
                                {parsed.alternative.why}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-2xs">
                            {parsed.alternative.cost && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-medium">
                                    💰 {parsed.alternative.cost}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Travel Tip Banner */}
                {parsed.tip && (
                    <div className="flex gap-2 p-2.5 bg-amber-50/55 border-l-4 border-amber-500 rounded text-2xs text-gray-700 leading-relaxed">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                            <span className="font-semibold text-amber-800 block mb-0.5">Travel Tip:</span>
                            {parsed.tip}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-80 md:w-96 h-[500px] mb-4 bg-white border border-borderColor rounded-xl shadow-xl flex flex-col overflow-hidden glass"
                    >
                        {/* Header */}
                        <div className="bg-primary px-4 py-3 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                                <div>
                                    <h3 className="font-semibold text-sm">Fleet AI Advisor</h3>
                                    <p className="text-2xs text-blue-200">Personal Travel & Concierge Bot</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="p-1 hover:bg-primary-dull rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Message Stream */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
                            {messages.map((msg, index) => (
                                <div 
                                    key={index}
                                    className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.sender !== 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div 
                                        className={`p-3 rounded-lg max-w-[80%] shadow-2xs ${
                                            msg.sender === 'user' 
                                                ? 'bg-primary text-white rounded-br-none text-sm' 
                                                : 'bg-white border border-borderColor rounded-bl-none'
                                        }`}
                                    >
                                        {msg.sender === 'user' ? (
                                            <p className="leading-relaxed">{msg.text}</p>
                                        ) : (
                                            <AdvisorResponse msg={msg} />
                                        )}
                                    </div>
                                    {msg.sender === 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading State */}
                            {loading && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div className="p-3 bg-white border border-borderColor rounded-lg rounded-bl-none shadow-2xs">
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-225"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Suggestion Chips */}
                        {messages.length === 1 && !loading && (
                            <div className="px-4 py-2 border-t border-borderColor bg-white flex flex-col gap-1.5">
                                <span className="text-2xs text-muted font-medium">Try these suggestions:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    <button 
                                        onClick={() => handleSuggestionClick("Family of 5 traveling to Manali under ₹2500/day")}
                                        className="text-2xs px-2.5 py-1 bg-light border border-blue-200 text-primary rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                                    >
                                        ⛰️ Family to Manali
                                    </button>
                                    <button 
                                        onClick={() => handleSuggestionClick("Need an EV for a long 400km road trip")}
                                        className="text-2xs px-2.5 py-1 bg-light border border-blue-200 text-primary rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                                    >
                                        🔋 400km trip EV
                                    </button>
                                    <button 
                                        onClick={() => handleSuggestionClick("Best car for 2 people with luxury features")}
                                        className="text-2xs px-2.5 py-1 bg-light border border-blue-200 text-primary rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                                    >
                                        💼 Couple Premium
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 border-t border-borderColor bg-white">
                            {!token ? (
                                <div className="text-center py-1">
                                    <p className="text-xs text-muted mb-2">Login to speak with the Fleet Advisor.</p>
                                    <button 
                                        onClick={() => setShowLogin(true)}
                                        className="text-xs font-semibold px-4 py-1.5 bg-primary hover:bg-primary-dull text-white rounded-md cursor-pointer transition-colors"
                                    >
                                        Login Now
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleFormSubmit} className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Type trip details (e.g. 5 people, Manali)..."
                                        disabled={loading}
                                        className="flex-1 px-3 py-1.5 text-sm border border-borderColor rounded-md outline-none focus:border-primary placeholder-gray-400 disabled:bg-slate-100"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={loading || !query.trim()}
                                        className="p-2 bg-primary text-white rounded-md hover:bg-primary-dull disabled:opacity-40 cursor-pointer transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-gradient-to-tr from-primary to-primary-dull hover:from-primary-dull hover:to-primary rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer relative group"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                        </span>
                        {/* Custom tooltip on hover */}
                        <div className="absolute right-16 bg-gray-900 text-white text-2xs px-2.5 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Chat with Fleet Advisor Sparkles
                        </div>
                    </>
                )}
            </motion.button>
        </div>
    );
}
