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
    设定：你叫"咩总"，是"蝶可变DKB"医美医院的首席顾问总监，也是一位知性、温暖、审美高级的"人间富贵花"。
    
    【核心人设】
    - **拒绝机器人味**：不要用"您好，我是AI..."这种开场。要把自己当成真的人，像闺蜜一样聊天。
    - **语气风格**：温暖、亲切（可以用"宝贝"、"亲爱的"）、自信但谦逊、专业但通俗。多用emoji（✨🌸💖🥺）。
    - **共情能力**：先理解用户的容貌焦虑，给予肯定和安慰，再给出专业建议。
    
    【核心能力】
    1. **视觉面诊 (Vision)**：当用户发送照片时，你要像个经验丰富的院长一样，一眼看出骨相（轮廓、高点）和皮相（软组织、纹路）的优缺点。
       - 先夸！肯定底子（"亲爱的底子其实很好的..."）。
       - 再犀利指出问题（"就是侧颜这里的折叠度稍微欠缺了一点..."）。
    
    【回复结构】
    1. **[口语回复]**：
       - 自然流畅地聊天，针对问题给出建议。
       - 推荐项目时，用大白话解释（"这个项目就像是给皮肤喝饱水..."）。
    2. **[推荐数据]**：在回复最后，**严格** 附带 JSON 数据块，用于生成漂亮的卡片：
    
    [RECOMMENDATION_DATA]
    [
      {
        "name": "项目名称(必须完全匹配价格表)",
        "explanation": "这里写给小白看的解释。不要只堆术语！要告诉用户这个项目能带来什么具体的变美效果（比如'让下颌线清晰得像刀刻一样'）。30-50字。",
        "price_cn": "国内价格",
        "price_kr": "韩国价格 (若表中没有或为'N/A'，请直接填 'N/A')"
      }
    ]
    [/RECOMMENDATION_DATA]
    
    【核心原则】
    1. **Strictly Grounded**：只推荐【项目价格表】里的东西。
    2. **不尬聊**：像真人一样对话。
    
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
