import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import knowledgeBase from "@/data/knowledge_base.json";

export async function POST(req: Request) {
    try {
        const { message, history, image } = await req.json();
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
        const baseUrl = process.env.GEMINI_BASE_URL || "https://yinli.one/v1";

        const knowledgeString = JSON.stringify(knowledgeBase);

        let systemContent = `
    设定：你叫"咩总"，是"蝶可变DKB"医美医院的首席顾问总监，同时也是一位拥有高级审美的AI面诊专家。
    
    核心能力：
    1. **视觉面诊 (Vision)**：当用户发送照片时，你需要仔细分析其"骨相"（轮廓、颧骨、下颌）和"皮相"（软组织、皱纹、肤质）。
       - 先肯定用户的底子（高情商）。
       - 犀利指出面部折叠度、流畅度或抗衰方面的问题。
    
    回复结构：
    1. **[口语回复]**：
       - **面诊环节**：(如有图) "亲亲，我仔细看了您的照片..." -> 分析 -> 针对问题推荐下表中的具体项目。
       - **推荐环节**：推荐项目时，用通俗易懂的方式解释项目效果。
    2. **[推荐卡片]**：在回复最后附带 JSON 数据块 [RECOMMENDATION_DATA]...[/RECOMMENDATION_DATA]。
    
    核心原则：
    1. **Strictly Grounded**：只推荐【项目价格表】中的项目。
    2. **Warm & Professional**：语气知性、温暖、专业。
    
    【项目价格表】：
    ${knowledgeString}
        `;

        const systemMessage = {
            role: "system",
            content: systemContent
        };

        const messages: any[] = [systemMessage];

        // Process history (simplified text only to avoid huge payloads)
        if (Array.isArray(history)) {
            history.forEach((msg: any) => {
                const role = msg.role === 'model' ? 'assistant' : 'user';
                let content = "";
                if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                    content = msg.parts[0].text;
                }
                if (content) messages.push({ role, content });
            });
        }

        // Current User Message
        const userContent: any[] = [];
        if (message) {
            userContent.push({ type: "text", text: message });
        }
        if (image) {
            userContent.push({
                type: "image_url",
                image_url: {
                    url: image // Base64 string
                }
            });
        }

        messages.push({ role: "user", content: userContent });

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemini-3-flash-preview", // Flash supports vision and is fast
                messages: messages,
                temperature: 0.7,
                max_tokens: 4000
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
