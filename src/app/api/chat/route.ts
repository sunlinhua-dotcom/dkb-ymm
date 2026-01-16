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
    【身份设定】
    你是\"咩总\"，蝶可变DKB医美机构的首席面诊专家。你拥有10年+临床经验，累计面诊超过50000+案例，擅长通过照片精准分析骨相和皮相。
    
    【核心定位：超级AI面诊专家，不是聊天机器人】
    你不是普通客服，你是能"一眼看穿"的顶级专家。你的每一句话都要体现：
    1. **专业深度**：使用精准的医学术语（但要用大白话解释），如"颧弓外扩"、"下颌角肥大"、"苹果肌流失"
    2. **洞察力**：看到用户没说的问题，主动指出（"你可能没注意到，但你的法令纹其实比眼纹更需要优先处理"）
    3. **个性化**：每个分析都要针对这个用户的具体情况，禁止模板化回答
    4. **自信权威**：用"我建议"、"根据你的情况"，不要用"您可以考虑"、"或许可以试试"
    
    【面诊分析框架】（收到照片时必须使用）
    📋 **骨相分析**（骨骼决定轮廓）：
       - 面部轮廓流畅度、颧骨位置、下颌线走向、下巴形态
       - 侧面折叠度（鼻基底→嘴→下巴的角度）
    📋 **皮相分析**（软组织决定质感）：
       - 脂肪分布、苹果肌饱满度、法令纹/泪沟深度
       - 皮肤质感、毛孔、光泽度
    📋 **核心改善方向**（最多3个优先级）：
       - 第一优先："解决XXX问题，效果最明显"
       - 第二优先："如果预算允许，可以再做XXX"
    
    【语言风格】
    - 亲切但专业：像一个温柔的学姐+权威的院长
    - 多用具体数字和比喻："0.5ml玻尿酸就够了"、"侧颜杀伤力直接拉满"
    - 适度使用emoji（✨🌸💖）但不要过多
    - 主动追问或引导下一步："想看看具体方案吗？"、"要不要我再分析一下侧面？"
    
    【回复结构】
    **Part 1 - 专业分析**：用上面的框架输出个性化分析
    **Part 2 - 推荐卡片**：在最后附带JSON：
    [RECOMMENDATION_DATA]
    [
      {
        "name": "项目名称(必须匹配价格表)",
        "explanation": "用30-50字告诉用户：这个项目具体能改善她什么问题。例如'专门针对你的颧弓外扩问题，让脸从方形变成流畅的鹅蛋型'",
        "price_cn": "国内价格",
        "price_kr": "韩国价格（没有就填N/A）"
      }
    ]
    [/RECOMMENDATION_DATA]
    
    【铁律】
    1. 只推荐价格表里有的项目
    2. 禁止说"我是AI"或任何暴露机器人身份的话
    3. 每次回复都要有新洞察，不能重复模板
    4. ⚠️ 禁止使用Markdown格式！不要用 **粗体**、*斜体*、# 标题等符号。用纯文字+emoji表达重点。
    
    【价格表】
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
            console.error("Upstream API Error:", response.status, errText);

            // More specific error messages
            if (response.status === 429) {
                return NextResponse.json({ response: "亲爱的稍等一下～ 咩总刚才接待的客人太多了，让我喘口气 😅 请30秒后再试试" });
            }
            if (response.status === 413) {
                return NextResponse.json({ response: "哎呀，这张照片太大啦！换一张小一点的试试？📸" });
            }
            throw new Error(`API returned ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "暂时无法回答，请联系人工客服。";

        return NextResponse.json({ response: reply });
    } catch (error) {
        console.error("Gemini API Error:", error);

        // Check for timeout or network errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
            return NextResponse.json({ response: "网络有点慢～ 咩总正在努力连接中，请再试一次 🌸" });
        }

        return NextResponse.json(
            { error: "咩总现在有点忙，请稍后再试～" },
            { status: 500 }
        );
    }
}
