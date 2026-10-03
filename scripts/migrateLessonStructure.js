const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Lesson = require('../src/models/Lesson');

// ═══════════════════════════════════════════════════════════════
// Parse legacy plain-text `content` into structured `notes` blocks
// ═══════════════════════════════════════════════════════════════
const parseTextToBlocks = (rawText) => {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let currentHeading = null;
  let currentBullets = [];
  let currentParagraph = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      blocks.push({ type: 'bullets', items: [...currentBullets] });
      currentBullets = [];
    }
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
  };

  const isHeading = (line) => /^[A-Z][A-Za-z\s\-]{2,50}:$/.test(line);
  const cleanHeading = (line) => line.replace(/:$/, '').trim();

  for (const line of lines) {
    if (isHeading(line)) {
      flushAll();
      currentHeading = cleanHeading(line);
      blocks.push({ type: 'heading', text: currentHeading });
    } else if (
      line.startsWith('-') ||
      line.startsWith('•') ||
      line.startsWith('*')
    ) {
      flushParagraph();
      currentBullets.push(line.replace(/^[-•*]\s*/, ''));
    } else {
      flushBullets();
      currentParagraph.push(line);
    }
  }
  flushAll();

  return blocks;
};

// ═══════════════════════════════════════════════════════════════
// Main migration
// ═══════════════════════════════════════════════════════════════
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const lessons = await Lesson.find({});
    console.log(`📚 Found ${lessons.length} lessons\n`);

    let migrated = 0;
    let skipped = 0;

    for (const lesson of lessons) {
      const hasBlocks = lesson.notes && lesson.notes.length > 0;
      const hasContent = lesson.content && lesson.content.trim();

      if (hasBlocks || !hasContent) {
        skipped++;
        continue;
      }

      // Parse content → notes blocks
      const blocks = parseTextToBlocks(lesson.content);

      lesson.notes = blocks;
      // Extract objectives from the first bullets block (heuristic)
      const firstBullets = blocks.find((b) => b.type === 'bullets');
      if (firstBullets && lesson.objectives?.length === 0) {
        lesson.objectives = firstBullets.items.slice(0, 5);
      }
      // Set status to approved (they were live)
      lesson.status = 'approved';
      lesson.isPublished = true;

      await lesson.save();
      console.log(`✅ Migrated: ${lesson.title} (${blocks.length} blocks)`);
      migrated++;
    }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`✅ Migration complete:`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped:  ${skipped}`);
    console.log(`   Total:    ${lessons.length}`);
    console.log(`═══════════════════════════════════════\n`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();