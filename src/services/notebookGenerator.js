// ================================================================
// NOTEBOOK GENERATOR
// Takes raw text and produces structured study notes
// Works with or without DeepSeek API
// ================================================================

/**
 * Extract objectives, summary, and review questions from raw text
 * Rule-based extraction — works offline, no API needed
 */
const generateWithRules = (rawText) => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  const objectives = [];
  const summary = [];
  const reviewQuestions = [];
  let currentSection = 'notes';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section headers detected
    if (/^objectives?\s*:/i.test(line)) {
      currentSection = 'objectives';
      continue;
    }
    if (/^summary\s*:/i.test(line)) {
      currentSection = 'summary';
      continue;
    }
    if (/^(review\s*questions?|key\s*questions?|questions?)\s*:/i.test(line)) {
      currentSection = 'questions';
      continue;
    }
    if (/^(notes?|main\s*notes?)\s*:/i.test(line)) {
      currentSection = 'notes';
      continue;
    }

    // Distribute lines to sections
    if (currentSection === 'objectives') {
      objectives.push(line.replace(/^[-•*]\s*/, ''));
    } else if (currentSection === 'summary') {
      summary.push(line.replace(/^[-•*]\s*/, ''));
    } else if (currentSection === 'questions') {
      reviewQuestions.push(line.replace(/^[-•*\d.)\s]+/, ''));
    }
  }

  // If no structured sections found, auto-generate them
  if (objectives.length === 0) {
    // Take first 3 sentences as objectives
    const sentences = rawText.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
    objectives.push(...sentences.slice(0, 3).map((s) => s + '.'));
  }

  if (summary.length === 0) {
    // Take the first sentence of each paragraph
    const paragraphs = rawText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    paragraphs.slice(0, 5).forEach((p) => {
      const firstSentence = p.split(/[.!?]+/)[0];
      if (firstSentence && firstSentence.length > 20) {
        summary.push(firstSentence.trim() + '.');
      }
    });
  }

  if (reviewQuestions.length === 0) {
    // Generate review questions from objectives
    objectives.slice(0, 4).forEach((obj) => {
      const topic = obj.split(/\s+/).slice(0, 6).join(' ').replace(/[.!?]+$/, '');
      reviewQuestions.push(`Explain: ${topic}?`);
    });
  }

  return {
    objectives: objectives.slice(0, 5),
    summary: summary.slice(0, 8),
    reviewQuestions: reviewQuestions.slice(0, 6),
    fullNotes: rawText,
    generatedBy: 'rule-based'
  };
};

/**
 * Generate using DeepSeek AI (if API key exists)
 */
const generateWithDeepSeek = async (rawText, apiKey) => {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an educational content organizer. Given raw lesson notes, produce a structured student notebook.

Return ONLY valid JSON in this exact format:
{
  "objectives": ["...", "..."],
  "summary": ["...", "..."],
  "reviewQuestions": ["...", "..."]
}

Rules:
- "objectives": 3-5 key learning objectives (short, action-oriented)
- "summary": 5-8 bullet points (main ideas, one sentence each)
- "reviewQuestions": 3-6 comprehension questions
- Keep language simple for Grade 5-12 students
- If content is in Amharic, respond in Amharic
- Return ONLY the JSON, no other text`
        },
        {
          role: 'user',
          content: rawText
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    objectives: parsed.objectives || [],
    summary: parsed.summary || [],
    reviewQuestions: parsed.reviewQuestions || [],
    fullNotes: rawText,
    generatedBy: 'deepseek'
  };
};

/**
 * Main entry — tries DeepSeek, falls back to rules
 */
const generateNotebook = async (rawText) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (apiKey) {
    try {
      console.log('Generating notebook with DeepSeek...');
      return await generateWithDeepSeek(rawText, apiKey);
    } catch (err) {
      console.error('DeepSeek failed, falling back to rules:', err.message);
    }
  }

  console.log('Generating notebook with rule-based extraction...');
  return generateWithRules(rawText);
};

module.exports = { generateNotebook };