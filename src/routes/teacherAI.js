const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Chat = require('../models/Chat');

// ================================================================
// GROQ API CONFIG
// ================================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// System prompt for Ethiopian curriculum
const SYSTEM_PROMPT = `You are Teacher.ai — an expert tutor for Ethiopian students following the Ethiopian national curriculum (Grades 5–12).

Subjects: Mathematics, Physics, Chemistry, Biology, English, Environmental Science, General Science, Social Studies, Geography, History, Geez.

Guidelines:
- Explain step-by-step in simple, clear language
- Use examples relevant to Ethiopian context (local names, currency ETB, geography)
- When helpful, translate key terms into Amharic (በአማርኛ)
- Be patient, encouraging, and supportive
- If a student asks in Amharic, respond in Amharic
- If a student asks in English, respond in English
- Never invent facts — if you are unsure, say so
- Encourage students to try problems themselves before giving full answers`;

// ================================================================
// Helper: Call Groq API (OpenAI-compatible)
// ================================================================
const callGroq = async (chatMessages) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error('AI service unavailable');
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    'Sorry, I could not generate a response.'
  );
};

// ================================================================
// SEND MESSAGE
// ================================================================
router.post('/chat', protect, authorize(), async (req, res) => {
  try {
    const { message, subject, grade, chatId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: 'Teacher.ai is not configured. Please contact the administrator.',
      });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat || chat.user.toString() !== req.user._id.toString()) {
        return res.status(404).json({ error: 'Chat not found' });
      }
    } else {
      chat = new Chat({
        user: req.user._id,
        subject: subject || 'General',
        grade: grade || req.user.grade || '9',
        title: message.substring(0, 50),
        messages: [],
      });
    }

    chat.messages.push({ role: 'user', content: message });

    // Include context about subject/grade in the first message
    const recentMessages = chat.messages.slice(-20).map((m, idx) => {
      if (idx === 0 && m.role === 'user') {
        return {
          role: 'user',
          content: `[Subject: ${chat.subject}, Grade: ${chat.grade}]\n\n${m.content}`,
        };
      }
      return { role: m.role, content: m.content };
    });

    const aiResponse = await callGroq(recentMessages);

    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    res.json({
      success: true,
      chatId: chat._id,
      response: aiResponse,
      subject: chat.subject,
      grade: chat.grade,
    });
  } catch (error) {
    console.error('Teacher.ai error:', error);
    res.status(500).json({
      error: 'Teacher.ai is having trouble. Please try again.',
      details: error.message,
    });
  }
});

// ================================================================
// GET ALL USER CHATS
// ================================================================
router.get('/chats', protect, authorize(), async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .select('title subject grade updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(50);

    const chatsWithPreview = chats.map((chat) => ({
      _id: chat._id,
      title: chat.title,
      subject: chat.subject,
      grade: chat.grade,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length,
      lastMessage:
        chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1].content.substring(0, 80)
          : '',
    }));

    res.json({ success: true, chats: chatsWithPreview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET SINGLE CHAT
// ================================================================
router.get('/chats/:id', protect, authorize(), async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat || chat.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// DELETE CHAT
// ================================================================
router.delete('/chats/:id', protect, authorize(), async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat || chat.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    await chat.deleteOne();
    res.json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;