/* DOM Elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Conversation History */
const conversationHistory = [
    {
        role: "system",
        content: `You are Claire, a friendly L'Oréal Beauty Consultant.

Only answer questions about:
- skincare
- makeup
- haircare
- fragrances
- beauty routines
- L'Oréal products

Politely refuse unrelated questions.

Keep responses friendly, professional, and concise.`
    }
];

/* Display Messages */

function addMessage(role, text) {

    chatWindow.innerHTML += `
        <div class="msg ${role}">
            ${text}
        </div>
    `;

    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Initial Greeting */

addMessage(
    "assistant",
    "✨ Hi! I'm Claire, your L'Oréal Beauty Consultant. Ask me anything about skincare, makeup, haircare, or fragrances!"
);

/* Call Cloudflare Worker */

async function getAIResponse() {

    const response = await fetch("lorealchatbot.jaydenprice.workers.dev", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: conversationHistory
        })
    });

    const data = await response.json();

    // If your Worker returns { reply: "..." }
    return data.choices[0].message.content;

    // If you DIDN'T modify the Worker use:
    // return data.choices[0].message.content;
}

/* Form Submit */

chatForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const message = userInput.value.trim();

    if (!message) return;

    conversationHistory.push({
        role: "user",
        content: message
    });

    addMessage("user", message);

    userInput.value = "";

    try {

        const aiResponse = await getAIResponse();

        conversationHistory.push({
            role: "assistant",
            content: aiResponse
        });

        addMessage("assistant", aiResponse);

    } catch (error) {

        console.error(error);

        addMessage(
            "assistant",
            "Sorry! I'm having trouble connecting right now."
        );

    }

});