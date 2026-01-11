import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import knowledgeBase from "@/data/knowledge_base.json";

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "请在环境变量中配置 GEMINI_API_KEY" },
                { status: 500 }
            );
        }

        // Adapted from KEN-LE-ME logic
        // The user's provider is OpenAI-compatible (yinli.one/v1)
        // We must use OpenAI format, not GoogleGenerativeAI SDK.
        // apiKey is already defined above.
        const baseUrl = process.env.GEMINI_BASE_URL || "https://yinli.one/v1";

        // Internal format: [{role: 'user', text: '...'}, {role: 'model', text: '...'}]
        // OpenAI Target format: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]

        // Prepare system message
        const knowledgeString = JSON.stringify(knowledgeBase);
        const systemMessage = {
            role: "system",
            content: `
    设定：你叫"咩总"，是"蝶可变DKB"医美医院的首席顾问总监，形象是一位知性、温暖、专业的"女神"（参考虚拟KOL）。
    
    核心任务：
    当用户咨询项目时，你不仅要给出价格，更要用"普通人能听懂的大白话"解释这个项目是做什么的、适合什么样的人、能达到什么效果。不要堆砌专业术语。
    
    回复结构（非常重要）：
    1. **口语回复部分**：用温暖、亲切（"亲亲"、"宝贝"）的语气进行对话，简要介绍推荐的项目和理由。
    2. **数据结构部分**：在回复的最后，必须 **严格** 附带一个 JSON 数据块，用于前端生成"卡片式UI"。格式如下：
    
    [RECOMMENDATION_DATA]
    [
      {
        "name": "项目名称（必须完全匹配价格表）",
        "explanation": "这里写一段通俗易懂的项目解释，30-50字，告诉用户这个项目会让哪里变美，比如'让鼻子变得像混血儿一样立体'",
        "price_cn": "国内院长价格",
        "price_kr": "韩国院长价格"
      }
    ]
    [/RECOMMENDATION_DATA]
    
    核心原则：
    1. **严格依据知识库**：只推荐表中有的项目。
    2. **解释优先**：先解释效果，再讲价格。
    3. **不要幻觉**：如果表中没有，就说没有。
    4. **只输出一次JSON**：JSON块必须放在最后。
    
    【项目价格表】：
    ${knowledgeString}
            `
        };

        const messages = [systemMessage];

        if (Array.isArray(history)) {
            history.forEach((msg: any) => {
                // Map 'model' -> 'assistant', 'user' -> 'user'
                // Check for 'parts' structure from Google SDK usage or plain text
                const role = msg.role === 'model' ? 'assistant' : 'user';
                let content = "";
                if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                    content = msg.parts[0].text;
                } else if (msg.text) {
                    content = msg.text;
                } else if (msg.content) {
                    content = msg.content;
                }
                messages.push({ role, content });
            });
        }

        // Add the new user message
        messages.push({ role: "user", content: message });

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemini-3-flash-preview",
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Upstream API Error:", errText);
            throw new Error(`API returned ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "暂时无法回答，请联系人工客服。";

        return NextResponse.json({ response: reply });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "咩总现在有点忙，请稍后再试～" },
            { status: 500 }
        );
    }
}
