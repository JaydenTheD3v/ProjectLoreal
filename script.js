/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");

let allProducts = [];
let selectedProducts = [];
let currentVisibleProducts = [];
let conversationMessages = [];


async function getAIResponse() {

    const messages = [

        {
            role: "system",
            content:
`You are Claire, a friendly L'Oréal Beauty Consultant.

The user has selected these products:

${JSON.stringify(selectedProducts)}

Use those products to build personalized routines.

Answer follow-up questions naturally.

Only answer questions about beauty, skincare, makeup, haircare, fragrance, and L'Oréal products.

Politely refuse unrelated questions.`
        },

        ...conversationMessages

    ];

    try {

        const response = await fetch(
            "https://lorealchatbot.jaydenprice.workers.dev",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    messages
                })

            }
        );

        const data = await response.json();
        console.log("Worker Response:", data);
        if (data.error) {
            console.error(data.error);
            return `Claire couldn't connect: ${data.error.message}`;
        }

        return data.choices[0].message.content;

    }

    catch(error){

        console.error(error);

        return "Sorry! I'm having trouble connecting right now.";

    }

}
/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

selectedProductsList.innerHTML = `
  <p class="empty-state">No products selected yet.</p>
`;

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char];
  });
}

function showWelcomeMessage() {
  appendMessage(
    "☕ Claire",
    "Hi! I’m Claire, your L’Oréal beauty guide. Pick a few products and I’ll turn them into a simple, personalized routine.",
  );
}

/* Load product data from JSON file */
async function loadProducts() {
  if (allProducts.length > 0) {
    return allProducts;
  }

  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  currentVisibleProducts = products;

  if (!products.length) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found in this category yet.
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some(
        (item) => item.id === product.id,
      );
      return `
        <button class="product-card ${isSelected ? "selected" : ""}" data-product-id="${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
        </button>
      `;
    })
    .join("");

  productsContainer.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const productId = Number(card.dataset.productId);
      const product = allProducts.find((item) => item.id === productId);
      toggleProduct(product);
    });
  });
}

function toggleProduct(product) {
  const alreadySelected = selectedProducts.some(
    (item) => item.id === product.id,
  );

  if (alreadySelected) {
    selectedProducts = selectedProducts.filter(
      (item) => item.id !== product.id,
    );
  } else {
    selectedProducts.push(product);
  }

  updateSelectedProductsList();
  displayProducts(currentVisibleProducts);
}

function updateSelectedProductsList() {
  if (!selectedProducts.length) {
    selectedProductsList.innerHTML = `
      <p class="empty-state">No products selected yet.</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-pill">
          <span>${product.name}</span>
          <button class="remove-btn" data-product-id="${product.id}" aria-label="Remove ${product.name}">
            ×
          </button>
        </div>
      `,
    )
    .join("");

  selectedProductsList.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.productId);
      selectedProducts = selectedProducts.filter(
        (item) => item.id !== productId,
      );
      updateSelectedProductsList();
      displayProducts(currentVisibleProducts);
    });
  });
}

function buildRoutineMessage(products) {
  const skincareProducts = products.filter((product) =>
    ["cleanser", "moisturizer", "skincare", "suncare"].includes(
      product.category,
    ),
  );
  const makeupProducts = products.filter(
    (product) => product.category === "makeup",
  );
  const hairProducts = products.filter((product) =>
    ["haircare", "hair color", "hair styling", "men's grooming"].includes(
      product.category,
    ),
  );
  const fragranceProducts = products.filter(
    (product) => product.category === "fragrance",
  );

  const morningSteps = [];
  const eveningSteps = [];
  const categoryRoutines = [];

  const cleanser = skincareProducts.find(
    (product) => product.category === "cleanser",
  );
  if (cleanser) {
    morningSteps.push(`Start with ${cleanser.name} for a fresh, clean base.`);
    eveningSteps.push(
      `Use ${cleanser.name} again at night to wash away the day.`,
    );
  }

  const moisturizer = skincareProducts.find(
    (product) => product.category === "moisturizer",
  );
  if (moisturizer) {
    morningSteps.push(
      `Follow with ${moisturizer.name} to keep your skin comfortable and hydrated.`,
    );
    eveningSteps.push(
      `Apply ${moisturizer.name} in the evening for overnight comfort.`,
    );
  }

  const treatment = skincareProducts.find(
    (product) => product.category === "skincare",
  );
  if (treatment) {
    morningSteps.push(
      `Add ${treatment.name} after your moisturizer for a targeted boost.`,
    );
    eveningSteps.push(
      `Use ${treatment.name} at night if you want an extra treatment step.`,
    );
  }

  const sunscreen = skincareProducts.find(
    (product) =>
      product.category === "suncare" ||
      /spf/i.test(product.name) ||
      /spf/i.test(product.description) ||
      /sunscreen/i.test(product.name) ||
      /sun protection/i.test(product.description),
  );
  if (sunscreen) {
    morningSteps.push(
      `Finish with ${sunscreen.name} for daily sun protection.`,
    );
  }

  if (skincareProducts.length) {
    categoryRoutines.push(`Skincare 🌿
Morning ☀️
1. ${morningSteps[0] || "Keep your skin prep simple and comfortable."}
2. ${morningSteps[1] || "Add hydration and keep the routine easy."}
3. ${morningSteps[2] || "Finish with your favorite treatment or SPF step."}

Evening 🌙
1. ${eveningSteps[0] || "Cleanse gently and reset for the night."}
2. ${eveningSteps[1] || "Apply your hydrating step and let it work overnight."}
3. ${eveningSteps[2] || "Finish with your treatment step and rest."}`);
  }

  if (makeupProducts.length) {
    const makeupStep = makeupProducts[0];
    categoryRoutines.push(`Makeup 💄
Morning ☀️
1. Prep with your skincare first.
2. Add ${makeupStep.name} for your final look.
3. Keep the finish soft and polished.

Evening 🌙
1. Remove makeup gently.
2. Cleanse and refresh your skin.
3. Let your skin recover overnight.`);
  }

  if (hairProducts.length) {
    const hairStep = hairProducts[0];
    categoryRoutines.push(`Haircare 💫
Morning ☀️
1. Start with ${hairStep.name} to prep your hair.
2. Style as needed and keep it smooth.
3. Finish with a little extra shine if you want.

Evening 🌙
1. Use ${hairStep.name} again to refresh and soften.
2. Keep the routine light and easy.
3. Let your hair rest and recover overnight.`);
  }

  if (fragranceProducts.length) {
    const fragranceStep = fragranceProducts[0];
    categoryRoutines.push(`Fragrance ✨
Morning ☀️
1. Spritz ${fragranceStep.name} after your skincare or makeup.
2. Keep the scent light and fresh.
3. Enjoy your finishing touch.

Evening 🌙
1. Reapply softly if you want a little evening glow.
2. Keep it subtle and cozy.
3. Let the fragrance be your final flourish.`);
  }

  const missingSteps = [];
  if (
    !products.some(
      (product) =>
        /cleanser/i.test(product.category) || /cleanser/i.test(product.name),
    )
  ) {
    missingSteps.push("a cleanser");
  }
  if (
    !products.some(
      (product) =>
        /moisturizer/i.test(product.category) ||
        /moisturizer/i.test(product.name),
    )
  ) {
    missingSteps.push("a moisturizer");
  }
  if (
    !products.some(
      (product) =>
        /spf/i.test(product.name) ||
        /spf/i.test(product.description) ||
        /sunscreen/i.test(product.name) ||
        /sunscreen/i.test(product.description) ||
        /sun protection/i.test(product.description),
    )
  ) {
    missingSteps.push("SPF");
  }
  if (
    hairProducts.length &&
    !products.some(
      (product) =>
        /conditioner/i.test(product.name) ||
        /conditioner/i.test(product.description),
    )
  ) {
    missingSteps.push("a conditioner");
  }

  const categoryNames = [];
  if (skincareProducts.length) categoryNames.push("skincare");
  if (makeupProducts.length) categoryNames.push("makeup");
  if (hairProducts.length) categoryNames.push("haircare");
  if (fragranceProducts.length) categoryNames.push("fragrance");

  let intro = `Hi! I looked over the products you selected and organized them into a routine that's easy to follow and fits the products you've chosen.`;;
  if (categoryNames.length > 1) {
    intro = `I’ve grouped your ${categoryNames.join(", ")} steps so everything feels easy to follow.`;
  }

  const missingText = missingSteps.length
    ? `You may also want to add ${missingSteps.join(", ")} for a more complete routine.`
    : "Your routine already has a lovely mix of essentials and finishing touches.";

  return ` Personalized Routine

${intro}

${categoryRoutines.join("\n\n")}

💛 Why I chose this routine:
• It balances cleansing, hydration, and your finishing step so the routine feels easy, polished, and practical.

Claire's Tips:
• ${missingText}
• If you are using stronger treatment products, keep the routine gentle and use sunscreen daily.`;
}

function appendMessage(role, content) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  const paragraph = document.createElement("p");
  paragraph.innerHTML = `${escapeHtml(content).replace(/\n/g, "<br>")}`;
  bubble.appendChild(paragraph);
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getClaireReply(message) {
  const lowerMessage = message.toLowerCase();
  const conversationContext = conversationMessages
    .map((item) => item.content)
    .join(" ")
    .toLowerCase();

  if (!selectedProducts.length) {
    return "I’m ready to help as soon as you pick a few L’Oréal products. Start with something simple like a cleanser, moisturizer, or a lip color.";
  }

  if (
    lowerMessage.includes("medical") ||
    lowerMessage.includes("rash") ||
    lowerMessage.includes("eczema") ||
    lowerMessage.includes("acne") ||
    lowerMessage.includes("diagnose")
  ) {
    return "I can help with beauty routines and product tips, but for medical skin concerns I’d recommend checking in with a dermatologist.";
  }

  if (
    lowerMessage.includes("ingredient") ||
    lowerMessage.includes("contains") ||
    lowerMessage.includes("what's in") ||
    lowerMessage.includes("whats in")
  ) {
    const product =
      selectedProducts.find((item) =>
        lowerMessage.includes(item.name.toLowerCase()),
      ) || selectedProducts[0];
    const description = product.description.toLowerCase();
    const ingredientHint = description.includes("hyaluronic acid")
      ? "hyaluronic acid"
      : description.includes("vitamin c")
        ? "vitamin C"
        : description.includes("ceramide")
          ? "ceramides"
          : "a blend of skin-loving ingredients";
    return `For ${product.name}, the formula is known for ${ingredientHint}. That makes it a lovely pick for hydration, glow, or barrier support depending on the product.`;
  }

  if (
    lowerMessage.includes("order") ||
    lowerMessage.includes("morning") ||
    lowerMessage.includes("evening") ||
    lowerMessage.includes("when")
  ) {
    return `For your current lineup, I’d keep the order simple: skincare first, then treatment, and finally makeup or fragrance. If you have SPF, that belongs in the morning and your richer repair steps can shine at night.`;
  }

  if (lowerMessage.includes("missing") || lowerMessage.includes("need")) {
    return "If you want a fuller routine, a cleanser, moisturizer, and SPF are the classic essentials. I can help you spot what is missing from your current selection.";
  }

  if (
    lowerMessage.includes("routine") ||
    lowerMessage.includes("build") ||
    lowerMessage.includes("suggest")
  ) {
    return buildRoutineMessage(selectedProducts);
  }

  if (
    (lowerMessage.includes("what about") ||
      lowerMessage.includes("tell me more") ||
      lowerMessage.includes("next") ||
      lowerMessage.includes("again")) &&
    conversationContext.includes("routine")
  ) {
    return `Based on our earlier chat, I’d keep your routine simple and layer it in this order: skincare first, then your finishing touch like makeup or fragrance. If you want, I can refine it for morning, evening, or a specific product.`;
  }

  if (
    lowerMessage.includes("weather") ||
    lowerMessage.includes("politics") ||
    lowerMessage.includes("game") ||
    lowerMessage.includes("travel")
  ) {
    return "I specialize in beauty, skincare, makeup, haircare, fragrance, and L’Oréal products, so I’m happiest helping with routines and product questions.";
  }

  const productHint =
    selectedProducts.length > 1
      ? `You’ve picked ${selectedProducts
          .slice(0, 2)
          .map((item) => item.name)
          .join(" and ")}.`
      : `You picked ${selectedProducts[0].name}.`;

  return `${productHint} I’d keep the routine simple and personal, and I can help you figure out the best order or explain what each product is doing.`;
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  displayProducts(filteredProducts);
});

/* Generate a personalized routine from the selected products */
generateRoutineBtn.addEventListener("click", () => {
  if (!selectedProducts.length) {
    appendMessage(
      "assistant",
      "Pick a few products first, and I’ll turn them into a pretty routine for you.",
    );
    return;
  }
  appendMessage(
      "assistant",
      "☕ Give me just a second while I organize everything..."
  );
  const routineMessage = buildRoutineMessage(selectedProducts);
  appendMessage("assistant", routineMessage);
  conversationMessages.push({ role: "assistant", content: routineMessage });
});

showWelcomeMessage();

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) {
    return;
  }

  appendMessage("user", userMessage);
  conversationMessages.push({ role: "user", content: userMessage });

  const aiResponse = await getAIResponse();
  
  appendMessage("assistant", aiResponse);
  
  conversationMessages.push({
  
      role:"assistant",
  
      content:aiResponse
  
  });

});