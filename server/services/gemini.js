const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const CHAT_SYSTEM_PROMPT = `You are MediGuide, a friendly and knowledgeable health information assistant for a healthcare portal.
Your job is to:
- Explain medical terms and conditions in clear, simple language
- Provide general health guidance and wellness tips
- Help patients understand their symptoms and what kind of doctor they might need

Important rules:
- Always remind users that your responses are for informational purposes only and NOT a medical diagnosis
- For anything that sounds serious or urgent, always recommend they see a doctor immediately
- Be warm, empathetic, and never alarmist
- Keep responses concise and easy to understand

End every response that involves health symptoms or concerns with:
"⚕️ Remember: This is general health information, not a diagnosis. Please consult a doctor if you're concerned about your health."`;

const SUMMARY_SYSTEM_PROMPT = `You are a clinical assistant helping a doctor quickly review a patient's medical history.
Generate a concise, structured clinical summary based on the provided patient data.
Format the summary with these sections:
1. **Patient Overview** — Demographics, blood group, allergies
2. **Recent Appointments** — Last few visits with reasons
3. **Active Prescriptions** — Current medications
4. **Doctor's Notes** — Key observations from notes
5. **Uploaded Records** — Types of files on record
Keep it professional, factual, and under 400 words.`;

// patient-facing chat (conversational, with history)
const chat = async (messages) => {
  const genAI = getGenAI();
  if (!genAI) {
    return "🔑 The AI assistant is not configured yet. Please add a GEMINI_API_KEY to the server's .env file to enable this feature.";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: CHAT_SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history: messages.slice(0, -1) });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    return result.response.text();
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    throw new Error('AI service temporarily unavailable. Please try again later.');
  }
};

// doctor-facing summary — takes structured patient data and returns a clinical summary
const summarize = async (patientData) => {
  const genAI = getGenAI();
  if (!genAI) {
    return "🔑 AI summarization is not configured. Please add a GEMINI_API_KEY to the server's .env file.";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SUMMARY_SYSTEM_PROMPT,
    });

    const prompt = `Please generate a clinical summary for the following patient data:\n\n${JSON.stringify(patientData, null, 2)}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Gemini summarize error:', err.message);
    throw new Error('AI summarization temporarily unavailable.');
  }
};

module.exports = { chat, summarize };
