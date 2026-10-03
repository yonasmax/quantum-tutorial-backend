const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const PhilosophyTradition = require('../src/models/PhilosophyTradition');
const PhilosophyText = require('../src/models/PhilosophyText');

const TRADITIONS = [
  // ================================================================
  // EASTERN TRADITIONS
  // ================================================================
  {
    category: 'eastern',
    name: 'Confucius',
    nameAmharic: 'ኮንፉሺየስ',
    icon: '🏮',
    era: '551–479 BCE',
    region: 'China',
    tradition: 'Confucianism',
    shortDescription: 'Chinese philosopher of ethics, family, and social harmony.',
    description:
      'Confucius (Kong Qiu) taught that a well-ordered society begins with personal virtue. His teachings, compiled in the Analects, emphasize filial piety, ritual propriety (li), and the cultivation of the "gentleman" (junzi).',
    keyIdeas: [
      'Ren (仁) — humaneness / benevolence',
      'Li (礼) — ritual propriety',
      'Junzi (君子) — the exemplary person',
      'Filial piety as the root of all virtue',
      'Rectification of names',
    ],
    keyWorks: [
      { title: 'Analects', originalTitle: '論語', year: 'c. 5th c. BCE' },
    ],
    quotes: [
      {
        text: 'Do not do to others what you do not want done to yourself.',
        source: 'Analects 15:24',
        translation: 'በሌሎች ላይ ለራስህ የማትፈልገውን አታድርግባቸው።',
      },
      {
        text: 'The man who moves a mountain begins by carrying away small stones.',
        source: 'Attributed',
        translation: 'ተራራን የሚያንቀሳቅስ ሰው ትንንሽ ድንጋዮችን በማንሳት ይጀምራል።',
      },
    ],
    order: 1,
  },
  {
    category: 'eastern',
    name: 'Laozi',
    nameAmharic: 'ላው ጽ',
    icon: '☯️',
    era: 'c. 6th c. BCE',
    region: 'China',
    tradition: 'Taoism',
    shortDescription: 'Founder of Taoism and author of the Tao Te Ching.',
    description:
      'Laozi taught that the Tao (the Way) is the underlying principle of the universe. By aligning with it through wu wei (effortless action), one achieves harmony.',
    keyIdeas: [
      'Tao (道) — the ineffable Way',
      'Wu wei (無為) — effortless action',
      'Yin and Yang — complementary opposites',
      'Simplicity and humility',
      'The soft overcomes the hard',
    ],
    keyWorks: [{ title: 'Tao Te Ching', originalTitle: '道德經', year: 'c. 6th c. BCE' }],
    quotes: [
      {
        text: 'A journey of a thousand miles begins with a single step.',
        source: 'Tao Te Ching, Ch. 64',
        translation: 'የሺህ ማይል ጉዞ በአንድ እርምጃ ይጀመራል።',
      },
      {
        text: 'Knowing others is intelligence; knowing yourself is true wisdom.',
        source: 'Tao Te Ching, Ch. 33',
        translation: 'ሌሎችን ማወቅ ብልህነት ነው፤ ራስን ማወቅ ግን እውነተኛ ጥበብ ነው።',
      },
    ],
    order: 2,
  },
  {
    category: 'eastern',
    name: 'Buddha',
    nameAmharic: 'ቡዳ',
    icon: '☸️',
    era: 'c. 563–483 BCE',
    region: 'India / Nepal',
    tradition: 'Buddhism',
    shortDescription: 'The Awakened One; teacher of the Four Noble Truths.',
    description:
      'Siddhartha Gautama, the Buddha, taught that suffering arises from craving and can be ended by the Noble Eightfold Path.',
    keyIdeas: [
      'The Four Noble Truths',
      'The Noble Eightfold Path',
      'Anatta (non-self)',
      'Anicca (impermanence)',
      'Compassion (karuna)',
    ],
    keyWorks: [{ title: 'Dhammapada', year: 'c. 3rd c. BCE' }],
    quotes: [
      {
        text: 'The mind is everything. What you think you become.',
        source: 'Dhammapada',
        translation: 'አእምሮ ሁሉ ነው። የምታስበው ትሆናለህ።',
      },
      {
        text: 'Hatred is never appeased by hatred; by love alone is it appeased.',
        source: 'Dhammapada 5',
        translation: 'ጥላቻ በጥላቻ አይቀርም፤ በፍቅር ብቻ ነው የሚቀረው።',
      },
    ],
    order: 3,
  },
  {
    category: 'eastern',
    name: 'Zen',
    nameAmharic: 'ዜን',
    icon: '🪷',
    era: '6th c. CE onward',
    region: 'China / Japan',
    tradition: 'Zen Buddhism',
    shortDescription: 'Direct insight through meditation and paradox.',
    description:
      'Zen emphasizes direct experience over doctrine. Koans, zazen (sitting meditation), and simplicity are its hallmarks.',
    keyIdeas: ['Zazen (sitting meditation)', 'Koans', 'Sudden enlightenment (satori)', 'Beginner\'s mind'],
    keyWorks: [{ title: 'Gateless Gate (Mumonkan)', year: '1228 CE' }],
    quotes: [
      {
        text: 'Before enlightenment: chop wood, carry water. After enlightenment: chop wood, carry water.',
        source: 'Zen proverb',
        translation: 'ከመብራህ በፊት፦ እንጨት ስረዝ፣ ውሃ ቀዳ። ከመብራህ በኋላ፦ እንጨት ስረዝ፣ ውሃ ቀዳ።',
      },
    ],
    order: 4,
  },
  {
    category: 'eastern',
    name: 'Bhagavad Gita',
    nameAmharic: 'ብሃጋቫድ ጊታ',
    icon: '🕉️',
    era: 'c. 2nd c. BCE',
    region: 'India',
    tradition: 'Hinduism',
    shortDescription: 'Dialogue between Krishna and Arjuna on duty and devotion.',
    description:
      'A 700-verse Hindu scripture on karma yoga, bhakti yoga, and jnana yoga. The Gita teaches acting without attachment to results.',
    keyIdeas: [
      'Karma yoga — the path of action',
      'Bhakti yoga — the path of devotion',
      'Dharma — one\'s duty',
      'Act without attachment to results',
    ],
    keyWorks: [{ title: 'Bhagavad Gita', year: 'c. 2nd c. BCE' }],
    quotes: [
      {
        text: 'You have the right to work, but never to the fruit of work.',
        source: 'Bhagavad Gita 2:47',
        translation: 'ለሥራ መብት አለህ፣ ለፍሬው ግን ፈጽሞ የለህም።',
      },
    ],
    order: 5,
  },
  {
    category: 'eastern',
    name: 'Upanishads',
    nameAmharic: 'ኡፓኒሻድ',
    icon: '🕉️',
    era: 'c. 800–200 BCE',
    region: 'India',
    tradition: 'Vedanta',
    shortDescription: 'Philosophical texts on the nature of the Self and Brahman.',
    description:
      'The Upanishads teach that the innermost Self (Atman) is identical with the Absolute (Brahman). "Tat tvam asi" — Thou art That.',
    keyIdeas: ['Atman = Brahman', 'Maya (illusion)', 'Reincarnation and liberation (moksha)', 'The Neti-Neti method'],
    keyWorks: [{ title: 'Chandogya Upanishad', year: 'c. 8th c. BCE' }],
    quotes: [
      {
        text: 'Tat tvam asi — Thou art That.',
        source: 'Chandogya Upanishad 6.8.7',
        translation: 'አንተ ያ ነህ።',
      },
    ],
    order: 6,
  },

  // ================================================================
  // WESTERN TRADITIONS
  // ================================================================
  {
    category: 'western',
    name: 'Pre-Socratics',
    nameAmharic: 'ቅድመ-ሶቅራጦስ',
    icon: '🌊',
    era: '6th–5th c. BCE',
    region: 'Greece',
    tradition: 'Ionian / Eleatic / Atomist',
    shortDescription: 'The first philosophers of the Western tradition.',
    description:
      'Thales, Anaximander, Heraclitus, Parmenides, and Democritus sought the fundamental principle (arche) of all things — water, fire, being, atoms.',
    keyIdeas: [
      'Thales — all is water',
      'Heraclitus — all is flux, logos',
      'Parmenides — Being is, non-Being is not',
      'Democritus — atomism',
    ],
    keyWorks: [{ title: 'Fragments', year: 'c. 600–400 BCE' }],
    quotes: [
      {
        text: 'No man ever steps in the same river twice.',
        source: 'Heraclitus',
        translation: 'ማንም ሰው ሁለት ጊዜ በአንድ ወንዝ አይገባም።',
      },
    ],
    order: 1,
  },
  {
    category: 'western',
    name: 'Socrates',
    nameAmharic: 'ሶቅራጦስ',
    icon: '🏛️',
    era: '470–399 BCE',
    region: 'Athens',
    tradition: 'Classical Greek',
    shortDescription: 'The father of Western ethics and the Socratic method.',
    description:
      'Socrates taught through questioning. He claimed to know only that he knew nothing. He was condemned to death for "corrupting the youth" and drank hemlock in 399 BCE.',
    keyIdeas: [
      'Socratic method (elenchus)',
      '"Know thyself"',
      '"The unexamined life is not worth living"',
      'Virtue is knowledge',
      'Care for the soul',
    ],
    keyWorks: [
      { title: 'Apology (by Plato)', year: 'c. 399 BCE' },
      { title: 'Phaedo (by Plato)', year: 'c. 360 BCE' },
    ],
    quotes: [
      {
        text: 'The unexamined life is not worth living.',
        source: 'Apology 38a',
        translation: 'ያልተመረመረ ሕይወት ለመኖር የማይገባ ነው።',
      },
      {
        text: 'I know that I know nothing.',
        source: 'Attributed',
        translation: 'ምንም እንደማላውቅ አውቃለሁ።',
      },
    ],
    order: 2,
  },
  {
    category: 'western',
    name: 'Plato',
    nameAmharic: 'ፕላቶ',
    icon: '📜',
    era: '428–348 BCE',
    region: 'Athens',
    tradition: 'Platonism',
    shortDescription: 'Founder of the Academy; teacher of Aristotle.',
    description:
      'Plato taught that true reality consists of eternal Forms, of which our world is a shadow. His dialogues are foundational to Western thought.',
    keyIdeas: [
      'Theory of Forms',
      'Allegory of the Cave',
      'The tripartite soul',
      'Philosopher-kings',
      'Immortality of the soul',
    ],
    keyWorks: [
      { title: 'Republic', year: 'c. 375 BCE' },
      { title: 'Symposium', year: 'c. 385 BCE' },
      { title: 'Phaedo', year: 'c. 360 BCE' },
    ],
    quotes: [
      {
        text: 'The safest general characterization of the European philosophical tradition is that it consists of a series of footnotes to Plato.',
        source: 'A.N. Whitehead (about Plato)',
        translation: 'የአውሮፓ ፍልስፍና ባጠቃላይ ለፕላቶ የተጻፉ ማስታወሻዎች ናቸው።',
      },
    ],
    order: 3,
  },
  {
    category: 'western',
    name: 'Aristotle',
    nameAmharic: 'አርስቶትል',
    icon: '📚',
    era: '384–322 BCE',
    region: 'Greece',
    tradition: 'Aristotelianism',
    shortDescription: 'Tutor of Alexander the Great; founder of logic and biology.',
    description:
      'Aristotle systematized logic, ethics, politics, biology, and metaphysics. He taught that virtue is a mean between extremes.',
    keyIdeas: [
      'Virtue ethics — the golden mean',
      'Four causes',
      'Logic (syllogism)',
      'Eudaimonia (human flourishing)',
      'Teleology — everything has a purpose',
    ],
    keyWorks: [
      { title: 'Nicomachean Ethics', year: 'c. 340 BCE' },
      { title: 'Politics', year: 'c. 335 BCE' },
      { title: 'Metaphysics', year: 'c. 350 BCE' },
    ],
    quotes: [
      {
        text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
        source: 'Attributed (via Will Durant)',
        translation: 'እኛ በየተደጋጋሚ የምናደርገው ነገር ነን። ብቃት ተግባር አይደለም፣ ልምድ ነው።',
      },
    ],
    order: 4,
  },
  {
    category: 'western',
    name: 'Stoics',
    nameAmharic: 'ስቶይኮች',
    icon: '🛡️',
    era: '3rd c. BCE – 2nd c. CE',
    region: 'Greece / Rome',
    tradition: 'Stoicism',
    shortDescription: 'Philosophy of virtue, self-control, and accepting fate.',
    description:
      'Stoics taught that we should focus only on what we can control — our judgments and actions — and accept what we cannot (fate).',
    keyIdeas: [
      'Live according to nature',
      'Control what you can; accept what you can\'t',
      'Virtue is the only good',
      'The dichotomy of control',
      'Cosmopolitanism',
    ],
    keyWorks: [
      { title: 'Meditations', author: 'Marcus Aurelius', year: 'c. 170 CE' },
      { title: 'Enchiridion', author: 'Epictetus', year: 'c. 125 CE' },
      { title: 'Letters to Lucilius', author: 'Seneca', year: 'c. 65 CE' },
    ],
    quotes: [
      {
        text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
        source: 'Marcus Aurelius',
        translation: 'በአእምሮህ ላይ ኃይል አለህ እንጂ በውጫዊ ክስተቶች ላይ አይደለም።',
      },
    ],
    order: 5,
  },

  // ================================================================
  // CLASSICS LIBRARY
  // ================================================================
  {
    category: 'classics',
    name: 'Homer — Odyssey',
    nameAmharic: 'ሆሜር — ኦዲሴይ',
    icon: '⛵',
    era: 'c. 8th c. BCE',
    region: 'Greece',
    tradition: 'Epic Poetry',
    shortDescription: 'The epic journey of Odysseus home from Troy.',
    description:
      'The Odyssey recounts the ten-year journey of Odysseus (Ulysses) from the Trojan War back to Ithaca, encountering Cyclopes, Sirens, and the underworld.',
    keyIdeas: ['Nostos (homecoming)', 'Cunning (metis)', 'Hospitality (xenia)', 'Fate vs. free will', 'Endurance'],
    keyWorks: [{ title: 'Odyssey', year: 'c. 8th c. BCE' }],
    quotes: [
      {
        text: 'Tell me, O Muse, of that ingenious hero who travelled far and wide after he had sacked the famous town of Troy.',
        source: 'Odyssey, Book 1 (opening)',
        translation: 'ኦ ሙዝ፣ ታዋቂውን ትሮይን ካጠፋ በኋላ ብዙ ተጉዞ የነበረውን ብልሁ ጀግና ንገረኝ።',
      },
    ],
    order: 1,
  },
  {
    category: 'classics',
    name: 'Homer — Iliad',
    nameAmharic: 'ሆሜር — ኢሊያድ',
    icon: '⚔️',
    era: 'c. 8th c. BCE',
    region: 'Greece',
    tradition: 'Epic Poetry',
    shortDescription: 'The wrath of Achilles and the Trojan War.',
    description:
      'The Iliad covers a few weeks of the tenth year of the Trojan War, focusing on Achilles\' rage and its devastating consequences.',
    keyIdeas: ['Kleos (glory)', 'Wrath (menis)', 'Honor', 'Mortality', 'The human cost of war'],
    keyWorks: [{ title: 'Iliad', year: 'c. 8th c. BCE' }],
    quotes: [
      {
        text: 'Sing, O goddess, the anger of Achilles son of Peleus.',
        source: 'Iliad, Book 1 (opening)',
        translation: 'ኦ ጣዖት፣ የፔሌዮስ ልጅ የአኪለስን ቁጣ ዘምሪ።',
      },
    ],
    order: 2,
  },
  {
    category: 'classics',
    name: 'Virgil — Aeneid',
    nameAmharic: 'ቨርጅል — ኢኒያድ',
    icon: '🏛️',
    era: '29–19 BCE',
    region: 'Rome',
    tradition: 'Epic Poetry',
    shortDescription: 'The founding of Rome through Aeneas.',
    description:
      'Virgil\'s Aeneid tells how Aeneas fled Troy and founded Rome. It is the Roman answer to Homer.',
    keyIdeas: ['Pietas (duty)', 'Fate of Rome', 'Founding myths', 'Furor vs. pietas'],
    keyWorks: [{ title: 'Aeneid', year: '19 BCE' }],
    quotes: [
      {
        text: 'Arms and the man I sing.',
        source: 'Aeneid, Book 1 (opening)',
        translation: 'ጦርንና ሰውየውን እዘምራለሁ።',
      },
    ],
    order: 3,
  },
  {
    category: 'classics',
    name: 'Sophocles — Oedipus Rex',
    nameAmharic: 'ሶፎክልስ — ኦዲፐስ ሬክስ',
    icon: '🎭',
    era: 'c. 429 BCE',
    region: 'Greece',
    tradition: 'Tragedy',
    shortDescription: 'The tragic story of Oedipus and fate.',
    description:
      'Oedipus, king of Thebes, unwittingly fulfills a prophecy that he will kill his father and marry his mother. A meditation on fate, blindness, and self-knowledge.',
    keyIdeas: ['Fate vs. free will', 'Tragic flaw (hamartia)', 'Blindness and insight', 'Catharsis'],
    keyWorks: [{ title: 'Oedipus Rex', year: 'c. 429 BCE' }],
    quotes: [
      {
        text: 'Count no man happy until he dies.',
        source: 'Oedipus Rex (final chorus)',
        translation: 'ሰው እስከሚሞት ድረስ ደስተኛ አትበለው።',
      },
    ],
    order: 4,
  },
  {
    category: 'classics',
    name: 'Euripides — Medea',
    nameAmharic: 'ዩሪፒዲስ — ሜዲያ',
    icon: '🎭',
    era: '431 BCE',
    region: 'Greece',
    tradition: 'Tragedy',
    shortDescription: 'A woman\'s revenge on her unfaithful husband.',
    description:
      'Medea, betrayed by Jason, takes a terrible revenge. The play explores gender, justice, and the psychology of rage.',
    keyIdeas: ['Revenge', 'Gender and power', 'The outsider', 'Passion vs. reason'],
    keyWorks: [{ title: 'Medea', year: '431 BCE' }],
    quotes: [
      {
        text: 'Of all creatures that have life and reason, we women are the most miserable.',
        source: 'Medea, line 230',
        translation: 'በሕይወት ካሉ ፍጥረታት ሁሉ እኛ ሴቶች በጣም አሳዛኞች ነን።',
      },
    ],
    order: 5,
  },

  // ================================================================
  // POETS OF WISDOM
  // ================================================================
  {
    category: 'poets',
    name: 'Omar Khayyam',
    nameAmharic: 'ኦማር ኻያም',
    icon: '🍷',
    era: '1048–1131 CE',
    region: 'Persia',
    tradition: 'Sufi / Freethinker',
    shortDescription: 'Persian mathematician and poet of the Rubaiyat.',
    description:
      'Omar Khayyam was a mathematician, astronomer, and poet. His Rubaiyat (quatrains) celebrate wine, love, and the fleeting nature of life, with deep philosophical undertones.',
    keyIdeas: ['Carpe diem', 'Skepticism', 'The impermanence of life', 'Wine as a symbol of divine love'],
    keyWorks: [{ title: 'Rubaiyat', year: 'c. 1100 CE' }],
    quotes: [
      {
        text: 'A Book of Verses underneath the Bough, / A Jug of Wine, a Loaf of Bread — and Thou.',
        source: 'Rubaiyat, stanza 12 (FitzGerald)',
        translation: 'ከዛፉ ሥር የግጥም መጽሐፍ፣ የወይን ጠጅ፣ አንድ እንጀራ — አንቺም።',
      },
    ],
    order: 1,
  },
  {
    category: 'poets',
    name: 'Rumi',
    nameAmharic: 'ሩሚ',
    icon: '💫',
    era: '1207–1273 CE',
    region: 'Persia / Turkey',
    tradition: 'Sufism',
    shortDescription: 'Persian Sufi mystic and poet of divine love.',
    description:
      'Jalal al-Din Rumi founded the Mevlevi Sufi order (Whirling Dervishes). His poetry expresses the soul\'s longing for union with the Divine.',
    keyIdeas: ['Divine love', 'The inner journey', 'Sama (spiritual listening)', 'Union with the Beloved'],
    keyWorks: [
      { title: 'Masnavi', year: 'c. 1270 CE' },
      { title: 'Divan-e Shams-e Tabrizi', year: 'c. 1260 CE' },
    ],
    quotes: [
      {
        text: 'The wound is the place where the Light enters you.',
        source: 'Rumi',
        translation: 'ቁስሉ ብርሃን ወደ ውስጥህ የሚገባበት ቦታ ነው።',
      },
    ],
    order: 2,
  },
  {
    category: 'poets',
    name: 'Hafiz',
    nameAmharic: 'ሓፊዝ',
    icon: '🌹',
    era: '1315–1390 CE',
    region: 'Persia',
    tradition: 'Sufism',
    shortDescription: 'The "Tongue of the Hidden" — Persian lyric poet.',
    description:
      'Hafiz wrote ghazals of love, wine, and divine mystery. His Divan is used for divination in Iran.',
    keyIdeas: ['The beloved', 'Wine and tavern', 'Divine and human love intertwined', 'The hypocrisy of the pious'],
    keyWorks: [{ title: 'Divan-e Hafiz', year: 'c. 1380 CE' }],
    quotes: [
      {
        text: 'I wish I could show you, when you are lonely or in darkness, the astonishing light of your own being.',
        source: 'Hafiz',
        translation: 'ብቻህን ሆነህ ወይም በጨለማ ሳለህ የራስህን አስደናቂ ብርሃን ላሳይህ ብወድ ነበር።',
      },
    ],
    order: 3,
  },
  {
    category: 'poets',
    name: "Al-Ma'arri",
    nameAmharic: 'አል-መዓሪ',
    icon: '⚖️',
    era: '973–1057 CE',
    region: 'Syria',
    tradition: 'Rationalist / Freethinker',
    shortDescription: 'Arab philosopher-poet, pacifist, and vegetarian.',
    description:
      'Al-Ma\'arri was a blind Arab philosopher-poet known for his skepticism, vegetarianism, and critique of religious dogmatism.',
    keyIdeas: ['Pacifism', 'Vegetarianism', 'Religious skepticism', 'Reason over tradition'],
    keyWorks: [{ title: 'The Epistle of Forgiveness', year: 'c. 1033 CE' }],
    quotes: [
      {
        text: 'Do not unjustly eat what the earth and the sea have given.',
        source: 'Al-Ma\'arri',
        translation: 'ምድርና ባሕር የሰጡትን በአመጽ አትብላ።',
      },
    ],
    order: 4,
  },

  // ================================================================
  // ETHIOPIAN WISDOM
  // ================================================================
  {
    category: 'ethiopian',
    name: 'ተረት (Ethiopian Fables)',
    nameAmharic: 'ተረት',
    icon: '🦁',
    era: 'Ancient–present',
    region: 'Ethiopia',
    tradition: 'Oral Wisdom',
    shortDescription: 'Traditional Ethiopian folk tales with moral lessons.',
    description:
      'ተረት (teret) are Ethiopian fables told for generations. Many share themes with Aesop, often featuring animals as moral teachers.',
    keyIdeas: ['Animal fables', 'Moral lessons', 'Oral tradition', 'Wit over strength'],
    keyWorks: [{ title: 'Collected Ethiopian Teret', year: 'Traditional' }],
    quotes: [
      {
        text: 'The clever hare defeats the mighty lion.',
        source: 'Common Ethiopian teret theme',
        translation: 'ብልሁ ጥንቸል ኃያሉን አንበሳ ያሸንፋል።',
      },
    ],
    order: 1,
  },
  {
    category: 'ethiopian',
    name: 'Aesop in Amharic',
    nameAmharic: 'ኤዞፕ በአማርኛ',
    icon: '🐢',
    era: 'Ancient Greek → Ethiopian',
    region: 'Ethiopia',
    tradition: 'Adapted Fables',
    shortDescription: 'Aesop\'s fables translated and adapted into Amharic.',
    description:
      'Aesop\'s fables have been translated into Amharic and woven into Ethiopian storytelling, with local animals and settings.',
    keyIdeas: ['Universal moral tales', 'Adapted to Ethiopian context', 'Instruction through story'],
    keyWorks: [{ title: 'Aesop\'s Fables (Amharic)', year: 'Modern collections' }],
    quotes: [
      {
        text: 'Slow and steady wins the race.',
        source: 'The Tortoise and the Hare',
        translation: 'ቀስ በቀስ የሚሄድ ሩጫውን ያሸንፋል።',
      },
    ],
    order: 2,
  },
  {
    category: 'ethiopian',
    name: 'የጥንት ጥበብ (Ancient Wisdom)',
    nameAmharic: 'የጥንት ጥበብ',
    icon: '📜',
    era: 'Ancient–present',
    region: 'Ethiopia',
    tradition: 'Proverbs',
    shortDescription: 'Ethiopian proverbs — condensed traditional wisdom.',
    description:
      'Ethiopian proverbs (ምሳሌ) capture collective wisdom in brief, memorable form. They cover work, family, patience, and truth.',
    keyIdeas: ['Proverbial wisdom', 'Everyday ethics', 'Community values', 'Practical guidance'],
    keyWorks: [{ title: 'Ethiopian Proverb Collections', year: 'Traditional' }],
    quotes: [
      {
        text: 'የዘንጋ ልጅ ዘንጋ ነው — The child of a baboon is a baboon.',
        source: 'Ethiopian proverb',
        translation: 'Nature/nurture discussion in Ethiopian thought.',
      },
    ],
    order: 3,
  },
  {
    category: 'ethiopian',
    name: 'Ethiopian Sages',
    nameAmharic: 'የኢትዮጵያ ሊቃውንት',
    icon: '👤',
    era: '14th–20th c. CE',
    region: 'Ethiopia',
    tradition: 'Philosophy / Theology',
    shortDescription: 'Ethiopian philosophers and church scholars.',
    description:
      'From Emperor Zara Yaqob to modern thinkers, Ethiopian sages developed unique philosophical reflections on God, ethics, and society.',
    keyIdeas: [
      'Zara Yaqob — theological synthesis',
      'Walda Heywat — rationalist ethics',
      'Ethiopian church philosophy',
      'Indigenous metaphysics',
    ],
    keyWorks: [
      { title: 'Hatata (Zara Yaqob)', year: 'c. 1660 CE' },
      { title: 'Hatata (Walda Heywat)', year: 'c. 1670 CE' },
    ],
    quotes: [
      {
        text: 'God created all things for the good of man; hence the one who does evil harms himself first.',
        source: 'Walda Heywat, Hatata',
        translation: 'እግዚአብሔር ሁሉንም ነገር ለሰው መልካም ነገር ፈጠረ፤ ስለዚህ ክፉ የሚሠራ ለራሱ ይጎዳል።',
      },
    ],
    order: 4,
  },

  // ================================================================
  // COMPARATIVE THEMES
  // ================================================================
  {
    category: 'comparative',
    name: 'Ethics — Virtue Across Traditions',
    nameAmharic: 'ሥነ ምግባር',
    icon: '⚖️',
    era: 'All eras',
    region: 'Global',
    tradition: 'Comparative Ethics',
    shortDescription: 'How different traditions define the good life.',
    description:
      'From Aristotle\'s "golden mean" to Confucius\' "ren", Buddha\'s "compassion", and Christianity\'s "love" — every tradition has a moral core.',
    keyIdeas: ['Golden Rule across traditions', 'Virtue vs. duty vs. consequence', 'The nature of the good'],
    keyWorks: [{ title: 'Comparative Ethics Reader', year: 'Modern' }],
    quotes: [
      {
        text: 'Do unto others as you would have them do unto you.',
        source: 'Across traditions',
        translation: 'ሌሎች ለእናንተ እንዲያደርጉላችሁ የምትፈልጉትን ሁሉ እናንተም እንዲሁ አድርጉላቸው።',
      },
    ],
    order: 1,
  },
  {
    category: 'comparative',
    name: 'Metaphysics — What Is Real?',
    nameAmharic: 'ሜታፊዚክስ',
    icon: '🌌',
    era: 'All eras',
    region: 'Global',
    tradition: 'Comparative Metaphysics',
    shortDescription: 'How traditions answer: what is the ultimate nature of reality?',
    description:
      'Plato\'s Forms, Buddha\'s emptiness, Laozi\'s Tao, Vedanta\'s Brahman — each tradition offers a map of the real.',
    keyIdeas: ['Monism vs. dualism', 'Being vs. becoming', 'The One and the many'],
    keyWorks: [{ title: 'Comparative Metaphysics', year: 'Modern' }],
    quotes: [
      {
        text: 'The Tao that can be told is not the eternal Tao.',
        source: 'Tao Te Ching, Ch. 1',
        translation: 'የሚነገር ታኦ ዘላለማዊው ታኦ አይደለም።',
      },
    ],
    order: 2,
  },
  {
    category: 'comparative',
    name: 'Cosmology — Origins of the Universe',
    nameAmharic: 'የዓለማት አመጣጥ',
    icon: '✨',
    era: 'All eras',
    region: 'Global',
    tradition: 'Comparative Cosmology',
    shortDescription: 'Creation myths and cosmological theories across cultures.',
    description:
      'From Genesis to the Upanishads, from the Big Bang to Buddhist cyclical time — humanity\'s origin stories.',
    keyIdeas: ['Creation from nothing', 'Cyclical vs. linear time', 'The role of the divine'],
    keyWorks: [{ title: 'Comparative Cosmology', year: 'Modern' }],
    quotes: [
      {
        text: 'In the beginning God created the heavens and the earth.',
        source: 'Genesis 1:1',
        translation: 'በመጀመሪያ እግዚአብሔር ሰማይና ምድርን ፈጠረ።',
      },
    ],
    order: 3,
  },
  {
    category: 'comparative',
    name: 'The Self — Who Am I?',
    nameAmharic: 'ማንነት',
    icon: '🧘',
    era: 'All eras',
    region: 'Global',
    tradition: 'Comparative Self',
    shortDescription: 'How different traditions answer the question of identity.',
    description:
      'The Socratic "know thyself", Buddha\'s "no-self" (anatta), Descartes\' "I think therefore I am", and Vedanta\'s "Atman is Brahman".',
    keyIdeas: ['The self as soul', 'No-self (anatta)', 'The self as illusion', 'The self as consciousness'],
    keyWorks: [{ title: 'The Self Across Cultures', year: 'Modern' }],
    quotes: [
      {
        text: 'I think, therefore I am.',
        source: 'Descartes, Meditations',
        translation: 'አስባለሁ፣ ስለዚህ አለሁ።',
      },
    ],
    order: 4,
  },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    await PhilosophyTradition.deleteMany({});
    console.log('🗑️  Cleared old philosophy data');

    for (const t of TRADITIONS) {
      await PhilosophyTradition.create(t);
    }

    console.log(`✅ Seeded ${TRADITIONS.length} philosophy traditions`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

run();