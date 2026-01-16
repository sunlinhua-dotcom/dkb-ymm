'use client';

import { useRef, useState, useEffect } from 'react';
import { Send, Sparkles, Image as ImageIcon, X } from 'lucide-react'; // Imports for icons
import styles from './ChatInterface.module.css';
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
    imageUrl?: string; // Add support for image display
}

// Random thinking messages for loading state
const thinkingMessages = [
    '正在用我的火眼金睛分析中... 👀',
    '让我仔细看看你的骨相... 🔍',
    '嗯...有意思，让我想想最适合你的方案 💭',
    '正在调用10年临床经验数据库... 🧠',
    '等我3秒，马上给你专业分析 ✨',
    '在认真看你的脸，别催～ 🌸',
    '正在计算最佳变美路径... 📐',
    '哇，让我好好研究一下 💖',
    '思考中...美丽需要认真对待 🦋',
    '正在为你定制专属方案... 💫'
];

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: '嗨亲爱的～ 我是咩总 ✨\n\n不是普通客服哦，我是蝶可变DKB的首席面诊专家，看过5万张脸，一眼就能看透你的骨相和皮相 👀\n\n📸 发张照片，我来帮你做个专业面诊\n💬 或者告诉我你的变美困扰\n\n准备好被我"看透"了吗？😏' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null); // State for image preview
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input value so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const clearSelectedImage = () => {
        setSelectedImage(null);
    };

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && !selectedImage) || isLoading) return;

        const userMessageText = inputValue.trim();
        const currentImage = selectedImage;

        setInputValue('');
        setSelectedImage(null); // Clear preview immediately

        // Add user message to history
        setMessages(prev => [...prev, {
            role: 'user',
            text: userMessageText,
            imageUrl: currentImage || undefined
        }]);

        setIsLoading(true);

        try {
            // Filter out JSON blocks for history context
            const history = messages.map(m => {
                const parts: any[] = [];
                if (m.text) parts.push({ text: m.text });
                if (m.imageUrl) parts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: m.imageUrl.split(',')[1]
                    }
                }); // Note: Client history tracking needs to adapt to what API expects or just persist text history
                // ACTUALLY: For this simple implementation, let's just send previous text history. 
                // Large images in history might consume too much token/bandwidth for this context.
                // UNLESS the previous turn involved the image.
                // For simplicity/stability, we currently only send JSON text history, 
                // BUT we send the CURRENT image in the `message` payload.
                return {
                    role: m.role,
                    parts: [{ text: m.text }]
                };
            });

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessageText, // Text part
                    image: currentImage,      // Image part (Base64)
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
            setMessages(prev => [...prev, { role: 'model', text: '哎呀，咩总这边网速有点慢，请稍后再试一下～ 🥺' }]);
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
                            {msg.imageUrl && (
                                <div
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        minWidth: '120px',
                                        minHeight: '120px',
                                        borderRadius: '8px',
                                        backgroundImage: `url(${msg.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        marginBottom: '8px',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        cursor: 'pointer'
                                    }}
                                    title="查看大图"
                                />
                            )}
                            {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
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
                            <div className={styles.thinkingText}>
                                {thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)]}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
                {/* Image Preview Overlay */}
                {selectedImage && (
                    <div className="absolute bottom-full left-0 m-4 p-2 bg-white rounded-lg shadow-lg border border-pink-100 flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200 z-10">
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '6px',
                                backgroundImage: `url(${selectedImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '1px solid #eee'
                            }}
                        />
                        <button onClick={clearSelectedImage} className="text-gray-400 hover:text-red-500">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className={styles.inputContainer}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />

                    <button
                        className={styles.iconButton}
                        onClick={triggerFileInput}
                        title="上传照片"
                    >
                        <ImageIcon size={20} color="#666" />
                    </button>

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
                        disabled={(!inputValue.trim() && !selectedImage) || isLoading}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
