'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import styles from './ChatInterface.module.css';

interface Message {
    role: 'user' | 'model';
    text: string;
}

import ProductCard from './ProductCard';

interface RecommendationItem {
    name: string;
    explanation: string;
    price_cn: string | number;
    price_kr: string | number;
}

interface Message {
    role: 'user' | 'model';
    text: string;
    recommendations?: RecommendationItem[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: '你好呀！我是蝶可变DKB的首席顾问总监 咩总 ✨\n欢迎来到这里～ 有什么变美计划想聊聊吗？🌸' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Filter out JSON blocks for history context to save tokens/avoid confusion, 
            // OR keep them. Better to keep them so model remembers what it suggested.
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }] // Note: We might want to pass the original raw text if we stored it
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: history
                }),
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const rawResponse = data.response;
            let displayResponse = rawResponse;
            let recommendations: RecommendationItem[] = [];

            // Parse [RECOMMENDATION_DATA]
            const regex = /\[RECOMMENDATION_DATA\]([\s\S]*?)\[\/RECOMMENDATION_DATA\]/;
            const match = rawResponse.match(regex);

            if (match && match[1]) {
                try {
                    recommendations = JSON.parse(match[1]);
                    displayResponse = rawResponse.replace(regex, '').trim();
                } catch (e) {
                    console.error("Failed to parse recommendations JSON", e);
                }
            }

            setMessages(prev => [...prev, {
                role: 'model',
                text: displayResponse,
                recommendations: recommendations
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: '哎呀，网络有点小差错，请稍后再试一下～ 🥺' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={styles.chatContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.avatarContainer}>
                    <img src="/images/avatar.jpg" alt="Mie Zong" className={styles.avatar} />
                    <div className={styles.statusDot} />
                </div>
                <div className={styles.headerInfo}>
                    <h1>咩总 Mie Zong</h1>
                    <p><Sparkles size={12} color="#FB6F92" /> 蝶可变DKB 首席顾问总监</p>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesWindow}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.user : styles.model}`}>
                        {msg.role === 'model' && (
                            <img src="/images/avatar.jpg" alt="Avatar" className="w-8 h-8 rounded-full mr-2 self-end mb-1 border border-white shadow-sm" style={{ width: 32, height: 32 }} />
                        )}
                        <div className={styles.bubble}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                            {msg.recommendations && msg.recommendations.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {msg.recommendations.map((item, i) => (
                                        <ProductCard key={i} {...item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className={`${styles.messageRow} ${styles.model}`}>
                        <img src="/images/avatar.jpg" alt="Avatar" className="w-8 h-8 rounded-full mr-2 self-end mb-1 border border-white shadow-sm" style={{ width: 32, height: 32 }} />
                        <div className={styles.bubble}>
                            <div className={styles.typingIndicator}>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="想咨询什么想变美的项目呢？..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className={styles.sendButton}
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
