const fetch = require('node-fetch'); // NOTE: node-fetch might not be installed in ymm-web, using global fetch if node 18+ or installing it. 
// Actually Node 18+ has fetch built-in.

const API_KEY = process.env.GEMINI_API_KEY || "sk-Yijg6QsrHpx4UTCQE6HqTRXJQ2Giqo9XvOvCoU5ZCAHFwuUA";
const BASE_URL = process.env.GEMINI_BASE_URL || "https://yinli.one/v1";

async function testModels() {
    try {
        console.log(`Testing API Key against ${BASE_URL}/models...`);
        const response = await fetch(`${BASE_URL}/models`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
            return;
        }

        const data = await response.json();
        console.log("Success! Available Models:");
        if (Array.isArray(data.data)) {
            data.data.forEach(model => {
                console.log(`- ${model.id}`);
            });
        } else {
            console.log("Raw Response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Network or execution error:", error);
    }
}

testModels();
