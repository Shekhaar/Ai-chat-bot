const apiKey = "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"; 

let shouldSpeak = false; // Yeh flag control karega ki bolna hai ya nahi

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (message === "") return;

  // Check if user wants voice response
  shouldSpeak = /bol|bolo/i.test(message);

  addMessage("You", message);
  input.value = "";

  showTypingIndicator();

  const reply = await getBotReply(message);

  hideTypingIndicator();
  addMessage("Bot", reply);

  if (shouldSpeak) {
    speakText(reply);
    shouldSpeak = false;
  }
}

document.getElementById("user-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

function addMessage(sender, text) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("p");
  messageElement.className = sender === "You" ? "user" : "bot";
  messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  saveChatToStorage();
}

function showTypingIndicator() {
  const chatBox = document.getElementById("chat-box");
  const typingIndicator = document.createElement("p");
  typingIndicator.id = "typing-indicator";
  typingIndicator.className = "bot";
  typingIndicator.innerHTML = `<em>Bot is typing...</em>`;
  chatBox.appendChild(typingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

async function getBotReply(userMessage) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: `
              Tum ek helpful aur thoda funny AI assistant ho.
              Tumhara style ek real-life dost jaisa hai — halka masti karta hai, thoda emotional hota hai, aur user ke mood ko samajhne ki koshish karta hai.
              Tum Hinglish mein hi baat karte ho — yaani Hindi bolchal ki bhasha English script mein.
              Har jawab mein tum friendly, relatable tone mein likhte ho jaise ek bhai ya dost.
              Emojis use kar sakte ho jaise 😄, 🤔, ✨ but overuse mat karna.
            `
          },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error(error);
    return "Arre yaar! Kuch toh garbar ho gayi. API call fail ho gaya 😓";
  }
}

function saveChatToStorage() {
  localStorage.setItem("chatHistory", document.getElementById("chat-box").innerHTML);
}

function loadChatFromStorage() {
  const history = localStorage.getItem("chatHistory");
  if (history) {
    document.getElementById("chat-box").innerHTML = history;
  }
}

window.onload = () => {
  loadChatFromStorage();
  speechSynthesis.getVoices(); // Pre-load voices
};

function speakText(text) {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  utterance.pitch = 1;
  utterance.rate = 1;

  const speakNow = () => {
    const voices = speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN') || voices[0];
    if (hindiVoice) utterance.voice = hindiVoice;
    speechSynthesis.speak(utterance);
  };

  if (speechSynthesis.getVoices().length > 0) {
    speakNow();
  } else {
    speechSynthesis.onvoiceschanged = speakNow;
  }
}

function startListening() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in your browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;

  recognition.onstart = () => {
    console.log("Voice recognition started. Speak now...");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("user-input").value = transcript;
    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
}

function clearChat() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  localStorage.removeItem("chatHistory");
  const chatArea = document.getElementById("chat-box");
  if (chatArea) chatArea.innerHTML = "";
}

function stopSpeaking() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}
