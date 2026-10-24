const OpenAI = require('openai');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const CurriculumBook = require('../models/CurriculumBook');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

async function generateLessonAgent(teacherId, courseId, topic, grade, subject) {
  try {
    let targetCourseId = courseId;
    if (!targetCourseId || targetCourseId === 'auto') {
      let course = await Course.findOne({ title: `Grade ${grade} ${subject}`, subject: subject, grade: grade });
      if (!course) {
        course = await Course.create({
          title: `Grade ${grade} ${subject}`,
          description: `Complete curriculum for Grade ${grade} ${subject}`,
          subject: subject,
          grade: grade,
          teacher: teacherId,
          isPublished: true
        });
      }
      targetCourseId = course._id;
    }

    const units = await CurriculumBook.find({ subject, grade });
    let textbookContext = "";
    let assignedUnitNumber = 1; 
    let assignedUnitTitle = "";

    let matchedUnit = units.find(u => 
      u.unitTitle.toLowerCase().includes(topic.toLowerCase()) || 
      (u.subtopics || []).some(s => s.toLowerCase().includes(topic.toLowerCase()))
    );

    if (!matchedUnit) {
      let maxScore = 0;
      const searchTerms = topic.toLowerCase().split(' ').filter(w => w.length > 2);
      for (const unit of units) {
        let score = 0;
        const unitTitleLower = unit.unitTitle.toLowerCase();
        const subtopicsLower = (unit.subtopics || []).map(s => s.toLowerCase());
        for (const term of searchTerms) {
          if (unitTitleLower.includes(term)) score += 3;
          if (subtopicsLower.some(sub => sub.includes(term))) score += 5;
        }
        if (score > maxScore) {
          maxScore = score;
          matchedUnit = unit;
        }
      }
    }

    if (matchedUnit) {
      assignedUnitNumber = matchedUnit.unitNumber;
      assignedUnitTitle = matchedUnit.unitTitle;
      textbookContext = `
        OFFICIAL CHAPTER: ${matchedUnit.unitTitle}
        REQUIRED SUBTOPICS: ${(matchedUnit.subtopics || []).join(', ')}
        SYLLABUS CONTENT: ${matchedUnit.content}
      `;
    } else {
      textbookContext = "No specific syllabus chapter found for this exact topic.";
      assignedUnitTitle = topic;
    }

    // ==========================================================
    // MASTER PROMPT WITH LATEX COVERAGE TABLE
    // ==========================================================
    const prompt = `
      You are a Master Ethiopian Curriculum Teacher and Expert in ${subject} for Grade ${grade}.
      Write a highly detailed, structured lesson on the specific subtopic: "${topic}".
      
      Here is the exact official syllabus context you MUST follow:
      ---
      ${textbookContext}
      ---

      CRITICAL INSTRUCTIONS FOR STRUCTURE:
      1. The lesson "title" MUST be exactly: "${topic}".
      2. You are writing a lesson for the chapter: "${assignedUnitTitle}". 
      3. The "notes" array MUST cover the specific subtopic thoroughly.
      4. Include a "callout" linking this specific topic to the broader chapter.
      5. Provide a "videoSearchQuery" for finding a relevant YouTube video.
      
      CRITICAL LATEX COVERAGE TABLE (Use these exact packages and structures):
      
      | Subject | LaTeX Coverage Level | Primary Packages | Key Use Cases |
      |---|---|---|---|
      | Mathematics | 100% | amsmath, amssymb, tikz | Algebraic proofs, matrix systems, trigonometric identities, limits, integrals, and vector notation. |
      | Physics | 90% | amsmath, siunitx, circuitikz | Motion equations, force vectors, thermodynamics, circuit diagrams, electromagnetic wave equations, and nuclear decay. |
      | Chemistry | 85% | mhchem, chemfig, amsmath | Balanced chemical equations, stoichiometry, electron configurations, reaction kinetics, and organic chemical structures. |
      | Biology | 35-40% | mhchem, array, forest, amsmath | Photosynthesis/respiration equations, Punnett squares, Hardy-Weinberg formulas, and phylogenetic tree diagrams. |

      SUBJECT-SPECIFIC FORMATTING RULES:

      [MATHEMATICS]
      - Use LaTeX for ALL math.
      - Inline: $x^2 + y^2 = r^2$
      - Block: $$\\int_{a}^{b} f(x) dx$$
      - Fractions: $\\frac{a}{b}$
      - Matrices: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$
      - Vector notation: $\\vec{v}$, $\\hat{i}$, $\\hat{j}$

      [PHYSICS]
      - Formulas must be in LaTeX.
      - Inline: $F = ma$
      - Block: $$v = u + at$$
      - Vectors: $\\vec{F}$
      - Units: Always use siunitx style: $9.8 \\text{ m/s}^2$, $6.67 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$
      - Circuit diagrams: Describe with text or use placeholders.

      [CHEMISTRY - ADVANCED LATEX RULES]
      1. ATOMIC & MASS NUMBER: Use ${}^{A}_{Z}\\text{X}$. Example: ${}^{23}_{11}\\text{Na}$
      2. ORBITAL SHAPES: Describe s, p, d, f orbitals using text and subscripts ($\\text{p}_x, \\text{p}_y, \\text{p}_z$, $\\text{d}_{xy}$, $\\text{d}_{x^2-y^2}$).
      3. ELECTRON CONFIGURATION: Use superscripts: $1\\text{s}^2 2\\text{s}^2 2\\text{p}^6 3\\text{s}^1$
      4. CHEMICAL FORMULAS: Use standard subscripts: H₂O, CO₂, H₂SO₄, C₆H₁₂O₆
      5. CHEMICAL REACTIONS: Use mhchem style: 
         - Reaction: $\\rightarrow$
         - Equilibrium: $\\rightleftharpoons$
         - Gas: $\\uparrow$
         - Precipitate: $\\downarrow$
         Example: 2H₂ + O₂ $\\rightarrow$ 2H₂O
      6. STOICHIOMETRY: $n = \\frac{m}{M}$, $N_A = 6.022 \\times 10^{23} \\text{ mol}^{-1}$
      7. ORGANIC COMPOUNDS: Use text: CH₃-CH₂-OH (Ethanol)

      [BIOLOGY]
      - Use mhchem for equations: 6CO₂ + 6H₂O $\\rightarrow$ C₆H₁₂O₆ + 6O₂
      - Punnett squares: Use Markdown tables (e.g., | | A | a |)
      - Hardy-Weinberg: $p^2 + 2pq + q^2 = 1$
      - Scientific names in italic: *Homo sapiens*
      - Phylogenetic trees: Describe with text or use this image format: ![Figure: Phylogenetic Tree](https://picsum.photos/800/400?random=1)

      [ALL SUBJECTS]
      - ALWAYS include at least one Markdown table comparing concepts.
      - Generate EXACTLY 5 quiz questions. The correctAnswer MUST be the exact string of the correct option.
      
      Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
      {
        "title": "${topic}",
        "description": "Short summary.",
        "videoSearchQuery": "Search query for a relevant YouTube video",
        "objectives": ["obj 1", "obj 2"],
        "notes": [
          { "type": "heading", "text": "Introduction" },
          { "type": "paragraph", "text": "Detailed explanation..." },
          { "type": "callout", "text": "Chapter Context: How this relates to ${assignedUnitTitle}" },
          { "type": "heading", "text": "Core Principles" },
          { "type": "bullets", "items": ["Point 1", "Point 2"] },
          { "type": "heading", "text": "Summary" },
          { "type": "paragraph", "text": "In conclusion..." }
        ],
        "quiz": {
          "questions": [
            { "question": "Q1?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Why A." },
            { "question": "Q2?", "options": ["A", "B", "C", "D"], "correctAnswer": "B", "explanation": "Why B." },
            { "question": "Q3?", "options": ["A", "B", "C", "D"], "correctAnswer": "C", "explanation": "Why C." },
            { "question": "Q4?", "options": ["A", "B", "C", "D"], "correctAnswer": "D", "explanation": "Why D." },
            { "question": "Q5?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Why A." }
          ]
        }
      }
    `;

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama3-70b-8192",
      messages: [
        { role: "system", content: "You are a helpful assistant designed to output JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    let rawContent = response.choices[0].message.content;
    const lessonData = JSON.parse(rawContent);

    const newLesson = await Lesson.create({
      title: lessonData.title || topic, 
      description: lessonData.description || `A lesson on ${topic}`,
      course: targetCourseId,
      subject: subject,
      grade: grade,
      unitNumber: assignedUnitNumber,
      objectives: lessonData.objectives || [],
      notes: lessonData.notes || [],
      quiz: lessonData.quiz || { questions: [] },
      videoUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(lessonData.videoSearchQuery || topic + ' ' + subject + ' Grade ' + grade),
      status: 'pendingReview',
      createdBy: teacherId,
      isPublished: false,
    });

    return {
      success: true,
      title: newLesson.title, 
      message: `✅ Agent successfully generated a lesson for Grade ${grade} Unit ${assignedUnitNumber}: "${newLesson.title}".`,
      lessonId: newLesson._id
    };

  } catch (error) {
    console.error('[Agent Error]', error);
    throw new Error(error.message);
  }
}

module.exports = { generateLessonAgent };
