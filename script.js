let shouldSpeak = false;
let recognition;

document.getElementById("send-btn").onclick = sendMessage;
document.getElementById("voice-btn").onclick = startListening;
document.getElementById("stop-btn").onclick = stopSpeaking;
document.getElementById("clear-btn").onclick = clearChat;

document.getElementById("user-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

window.onload = () => {
  loadChatFromStorage();
  speechSynthesis.getVoices(); // Preload voices
};

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (message === "") return;

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
        "Authorization": `Bearer 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`,
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

function speakText(text) {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  utterance.pitch = 1;
  utterance.rate = 1;

  const voices = speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang === "hi-IN") || voices[0];
  utterance.voice = hindiVoice;

  speechSynthesis.speak(utterance);
}

function startListening() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in your browser.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;

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

function stopSpeaking() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

function clearChat() {
  stopSpeaking();
  localStorage.removeItem("chatHistory");
  document.getElementById("chat-box").innerHTML = "";
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
