/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
const conversationHistory = [
    {
        role: "system",
        content: "You are Claire, a friendly L'Oréal Beauty Consultant. Only answer questions about beauty, skincare, haircare, makeup, fragrances, and L'Oréal products. Politely decline unrelated questions."
    }
]; //empty array act as memory for conversation


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

    return data.choices[0].message.content;
}


//initial greeting

addMessage(
    "assistant",
    "Hi! I'm Claire, your L'Oréal Beauty Consultant. Ask me anything about skincare, makeup, haircare, or fragrances!"
);

//chat memory

const message=[
    {
        role: "System",
        content: `You are a friendly L'Oréal Beauty Consultant.

                    Only answer questions about:
                    - skincare
                    - makeup
                    - haircare
                    - fragrances
                    - beauty routines
                    - L'Oréal products

                    Politely refuse unrelated questions.

                    Keep answers friendly, professional, and concise.`        
    }
];

//add message function


function addMessage (role, text) {

    chatWindow.innerHTML += 
    `
        <div class ="msg ${role}">
           ${role}:  ${text}
        </div>
    `;

    chatWindow.scrollTop = chatWindow.scrollHeight;
    }
   


submitButton.addEventListener("click", async () => {

    const userInput = messageInput.value.trim();

    if (!userInput) return;

    conversationHistory.push({
        role: "user",
        content: userInput
    });

    addMessage("user", userInput);

    messageInput.value = "";

    const aiResponse = await getAIResponse();

    conversationHistory.push({
        role: "assistant",
        content: aiResponse
    });

    addMessage("assistant", aiResponse);

});
