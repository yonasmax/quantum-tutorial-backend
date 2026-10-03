// backend/scripts/seedChemistryLessons.js
// Populates Chemistry Grade 9 course lessons with real content

require('dotenv').config();
const mongoose = require('mongoose');

const COURSE_ID = '6ab17b334459f8e767b84b15';

// Inline Course schema — same as routes
const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    objectives: [{ type: String }],
    keyTerms: [{ type: String }],
    quiz: {
      questions: [
        {
          question: String,
          options: [String],
          correctAnswer: Number,
          marks: { type: Number, default: 1 },
          explanation: String,
        },
      ],
      passingMarks: { type: Number, default: 50 },
    },
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: String,
    subject: String,
    grade: String,
    description: String,
    price: Number,
    currency: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lessons: [lessonSchema],
    isPublished: Boolean,
    thumbnail: String,
    studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);

const LESSONS = [
  {
    title: 'Lesson 1: What is Chemistry?',
    order: 1,
    duration: 25,
    objectives: [
      'Define chemistry and its scope',
      'Explain why chemistry is called the central science',
      'Identify real-world applications of chemistry',
    ],
    keyTerms: ['Chemistry', 'Matter', 'Atom', 'Molecule', 'Central Science'],
    content: `Chemistry is the branch of science that studies the composition, structure, properties, and changes of matter. It is often called the "central science" because it bridges physics with biology, geology, and other natural sciences.

WHY IS CHEMISTRY IMPORTANT?

Chemistry explains the world around us. Every time you cook food, take medicine, breathe air, or clean your home, chemical reactions are happening. Understanding chemistry helps us:
- Develop new medicines and vaccines
- Create better materials (plastics, metals, fabrics)
- Solve environmental problems (pollution, climate change)
- Produce food more efficiently

THE SCOPE OF CHEMISTRY

Chemistry is divided into several branches:
1. Organic Chemistry — the study of carbon compounds
2. Inorganic Chemistry — the study of non-carbon compounds
3. Physical Chemistry — the study of how matter behaves at the physical level
4. Analytical Chemistry — the study of how to identify and measure substances
5. Biochemistry — the study of chemical processes in living things`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'What is chemistry?',
          options: [
            'The study of living things',
            'The study of the composition and changes of matter',
            'The study of numbers',
            'The study of stars',
          ],
          correctAnswer: 1,
          marks: 1,
          explanation:
            'Chemistry studies the composition, structure, properties, and changes of matter.',
        },
        {
          question: 'Why is chemistry called the "central science"?',
          options: [
            'It is taught in the center of the school',
            'It bridges physics with biology and other sciences',
            'It is the easiest science',
            'It has the most students',
          ],
          correctAnswer: 1,
          marks: 1,
          explanation:
            'Chemistry connects physics to biology, geology, and other natural sciences.',
        },
      ],
    },
  },
  {
    title: 'Lesson 2: Matter and Its Properties',
    order: 2,
    duration: 30,
    objectives: [
      'Define matter',
      'Distinguish between physical and chemical properties',
      'Classify matter as element, compound, or mixture',
    ],
    keyTerms: ['Matter', 'Mass', 'Volume', 'Physical Property', 'Chemical Property'],
    content: `Matter is anything that has mass and occupies space (has volume). Everything you can see, touch, smell, or taste is made of matter — including the air you breathe.

PHYSICAL PROPERTIES

Physical properties can be observed or measured without changing the substance's identity:
- Color (red, blue, colorless)
- Density (how heavy for its size)
- Melting point (temperature at which solid → liquid)
- Boiling point (temperature at which liquid → gas)
- Hardness (how easily scratched)
- Conductivity (does it conduct electricity?)

CHEMICAL PROPERTIES

Chemical properties describe how a substance reacts with other substances:
- Flammability (does it burn?)
- Reactivity with water, oxygen, or acids
- Toxicity (is it poisonous?)
- Acidity or basicity (pH level)

CLASSIFICATION OF MATTER

Pure Substances:
- Elements (e.g., gold, oxygen) — one type of atom
- Compounds (e.g., water, salt) — two or more elements bonded together

Mixtures:
- Homogeneous (e.g., salt water) — uniform throughout
- Heterogeneous (e.g., sand and iron) — not uniform`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'Which of these is a chemical property?',
          options: ['Color', 'Melting point', 'Flammability', 'Density'],
          correctAnswer: 2,
          marks: 1,
          explanation:
            'Flammability describes how a substance reacts, making it a chemical property.',
        },
      ],
    },
  },
  {
    title: 'Lesson 3: Atoms and Molecules',
    order: 3,
    duration: 28,
    objectives: [
      'Describe the structure of an atom',
      'Identify protons, neutrons, and electrons',
      'Explain what a molecule is',
    ],
    keyTerms: ['Atom', 'Proton', 'Neutron', 'Electron', 'Nucleus', 'Molecule'],
    content: `The atom is the smallest unit of matter that retains the properties of an element. Atoms are the building blocks of everything in the universe.

STRUCTURE OF AN ATOM

An atom consists of:
- NUCLEUS — the center, containing protons and neutrons
- ELECTRONS — tiny particles orbiting the nucleus in shells

The three subatomic particles:
| Particle | Charge | Location | Mass |
|----------|--------|----------|------|
| Proton   | +1     | Nucleus  | 1    |
| Neutron  | 0      | Nucleus  | 1    |
| Electron | -1     | Orbitals | ~0   |

ATOMIC NUMBER AND MASS NUMBER

Atomic Number (Z) = number of protons in an atom
Mass Number (A) = protons + neutrons

Example: Carbon-12
- 6 protons
- 6 neutrons
- 6 electrons
- Atomic number = 6
- Mass number = 12

MOLECULES

A molecule is a group of two or more atoms bonded together. Examples:
- H₂O (water) — 2 hydrogen + 1 oxygen
- O₂ (oxygen gas) — 2 oxygen atoms
- CO₂ (carbon dioxide) — 1 carbon + 2 oxygen`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'Which particles are found in the nucleus of an atom?',
          options: [
            'Electrons only',
            'Protons and neutrons',
            'Protons and electrons',
            'Neutrons and electrons',
          ],
          correctAnswer: 1,
          marks: 1,
          explanation: 'The nucleus contains protons (positive) and neutrons (neutral).',
        },
      ],
    },
  },
  {
    title: 'Lesson 4: The Periodic Table',
    order: 4,
    duration: 32,
    objectives: [
      'Understand the organization of the periodic table',
      'Identify groups and periods',
      'Recognize metals, nonmetals, and metalloids',
    ],
    keyTerms: ['Periodic Table', 'Group', 'Period', 'Metal', 'Nonmetal', 'Metalloid'],
    content: `The Periodic Table arranges all known elements by their atomic number, electron configuration, and chemical properties.

HISTORY

Dmitri Mendeleev (1869) created the first widely accepted periodic table. He arranged elements by atomic mass and left gaps for elements not yet discovered.

ORGANIZATION

The table is organized into:
- GROUPS (columns) — elements with similar properties
- PERIODS (rows) — elements with the same number of electron shells

KEY GROUPS:
- Group 1: Alkali metals (Li, Na, K) — very reactive
- Group 2: Alkaline earth metals (Mg, Ca)
- Group 17: Halogens (F, Cl, Br) — reactive nonmetals
- Group 18: Noble gases (He, Ne, Ar) — very stable, unreactive

METALS vs NONMETALS vs METALLOIDS

METALS (left side, majority):
- Shiny, malleable, ductile
- Good conductors of heat and electricity
- Examples: Iron, Copper, Gold

NONMETALS (right side):
- Dull, brittle
- Poor conductors (except graphite)
- Examples: Oxygen, Sulfur, Chlorine

METALLOIDS (staircase line):
- Properties between metals and nonmetals
- Examples: Silicon, Germanium`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'Which group contains the noble gases?',
          options: ['Group 1', 'Group 2', 'Group 17', 'Group 18'],
          correctAnswer: 3,
          marks: 1,
          explanation: 'Group 18 contains helium, neon, argon, etc. — the noble gases.',
        },
      ],
    },
  },
  {
    title: 'Lesson 5: Chemical Bonds',
    order: 5,
    duration: 30,
    objectives: [
      'Explain why atoms form bonds',
      'Distinguish ionic and covalent bonds',
      'Predict bond types from element positions',
    ],
    keyTerms: ['Ionic Bond', 'Covalent Bond', 'Valence Electron', 'Ion', 'Octet Rule'],
    content: `Chemical bonds are the attractive forces that hold atoms together. Atoms bond to achieve a stable electron configuration — usually 8 electrons in the outer shell (the octet rule).

WHY ATOMS BOND

Atoms with incomplete outer shells are unstable. They gain, lose, or share electrons to become stable, like the noble gases.

TYPES OF BONDS

1. IONIC BONDS
- Formed between metals and nonmetals
- Metal LOSES electrons → becomes positive ion (cation)
- Nonmetal GAINS electrons → becomes negative ion (anion)
- Ions attract each other electrostatically
- Example: NaCl (table salt) — Na⁺ and Cl⁻

2. COVALENT BONDS
- Formed between two nonmetals
- Atoms SHARE electrons
- Neither atom fully gains or loses electrons
- Example: H₂O, CO₂, CH₄

3. METALLIC BONDS
- Formed between metal atoms
- Electrons move freely between atoms (sea of electrons)
- Explains why metals conduct electricity

PREDICTING BOND TYPE

Look at the periodic table:
- Metal + Nonmetal → Ionic
- Nonmetal + Nonmetal → Covalent
- Metal + Metal → Metallic`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'What type of bond forms between sodium and chlorine?',
          options: ['Covalent', 'Ionic', 'Metallic', 'Hydrogen'],
          correctAnswer: 1,
          marks: 1,
          explanation:
            'Sodium is a metal, chlorine is a nonmetal, so they form an ionic bond.',
        },
      ],
    },
  },
  {
    title: 'Lesson 6: Chemical Reactions',
    order: 6,
    duration: 30,
    objectives: [
      'Identify signs of a chemical reaction',
      'Balance simple chemical equations',
      'Recognize different reaction types',
    ],
    keyTerms: ['Reactant', 'Product', 'Chemical Equation', 'Coefficient', 'Catalyst'],
    content: `A chemical reaction is a process where one or more substances (reactants) change into new substances (products).

SIGNS OF A CHEMICAL REACTION

How to tell a chemical reaction has occurred:
- Color change
- Gas production (bubbles)
- Precipitate formation (solid appears)
- Temperature change (heat released or absorbed)
- Light emission

CHEMICAL EQUATIONS

A chemical equation uses symbols to show what happens:
2H₂ + O₂ → 2H₂O

- LEFT side = reactants (H₂, O₂)
- RIGHT side = products (H₂O)
- ARROW (→) means "yields" or "produces"
- COEFFICIENTS (2, 1, 2) show the ratio of molecules

BALANCING EQUATIONS

Matter cannot be created or destroyed (Law of Conservation of Mass). So the number of atoms of each element must be equal on both sides.

Steps to balance:
1. Write the unbalanced equation
2. Count atoms of each element on both sides
3. Add coefficients to balance
4. Recount to verify

TYPES OF REACTIONS

1. Synthesis: A + B → AB
2. Decomposition: AB → A + B
3. Single Replacement: A + BC → AC + B
4. Double Replacement: AB + CD → AD + CB
5. Combustion: Fuel + O₂ → CO₂ + H₂O`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'Which of these is a sign of a chemical reaction?',
          options: [
            'Ice melting',
            'Water boiling',
            'Gas bubbles forming',
            'Sugar dissolving',
          ],
          correctAnswer: 2,
          marks: 1,
          explanation:
            'Gas production is a classic sign of a chemical reaction.',
        },
      ],
    },
  },
  {
    title: 'Lesson 7: Acids, Bases, and Salts',
    order: 7,
    duration: 28,
    objectives: [
      'Define acids and bases',
      'Use the pH scale',
      'Understand neutralization reactions',
    ],
    keyTerms: ['Acid', 'Base', 'pH', 'Neutralization', 'Indicator', 'Salt'],
    content: `Acids and bases are two important classes of chemical compounds that we encounter every day.

ACIDS

Properties:
- Sour taste (think lemon juice)
- Turn blue litmus paper RED
- React with metals to produce hydrogen gas
- Have pH less than 7

Examples: HCl (stomach acid), H₂SO₄ (car battery), CH₃COOH (vinegar)

BASES (ALKALIS)

Properties:
- Bitter taste
- Slippery feel (like soap)
- Turn red litmus paper BLUE
- Have pH greater than 7

Examples: NaOH (drain cleaner), NH₃ (ammonia), Mg(OH)₂ (milk of magnesia)

THE pH SCALE

The pH scale measures how acidic or basic a solution is:
- pH 0–6: Acidic
- pH 7: Neutral (pure water)
- pH 8–14: Basic

NEUTRALIZATION

When an acid reacts with a base, they neutralize each other:
Acid + Base → Salt + Water

Example: HCl + NaOH → NaCl + H₂O

This is why antacids (bases) relieve stomach acid.`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'What is the pH of a neutral solution?',
          options: ['0', '7', '14', '1'],
          correctAnswer: 1,
          marks: 1,
          explanation: 'Pure water has a pH of 7 — neutral.',
        },
      ],
    },
  },
  {
    title: 'Lesson 8: Chemistry in Everyday Life',
    order: 8,
    duration: 26,
    objectives: [
      'Identify chemistry in everyday products',
      'Understand industrial applications',
      'Appreciate chemistry in Ethiopian context',
    ],
    keyTerms: ['Polymer', 'Pharmaceutical', 'Fertilizer', 'Alloy', 'Detergent'],
    content: `Chemistry is everywhere — in food, medicine, cleaning products, and even in Ethiopian agriculture and industry.

CHEMISTRY IN FOOD

- Cooking is chemistry: heat causes proteins to denature, sugars to caramelize
- Fermentation (injera, tella, tej) — yeast converts sugars to alcohol and CO₂
- Preservation — salt, sugar, and acid slow bacterial growth

CHEMISTRY IN MEDICINE

- Pharmaceuticals: aspirin, paracetamol, antibiotics
- Vaccines: chemistry preserves and stabilizes
- Diagnostic tests: blood sugar, pregnancy tests

CHEMISTRY IN AGRICULTURE (Ethiopia)

- Fertilizers: N, P, K — nitrogen, phosphorus, potassium
- Pesticides and herbicides
- Soil pH testing and correction
- Coffee processing: fermentation, drying, roasting are all chemistry

CHEMISTRY IN INDUSTRY

- Cement production (Ethiopia has many cement plants)
- Textile dyeing
- Plastic and polymer production
- Metal alloys (steel, bronze, brass)

CHEMISTRY IN THE HOME

- Cleaning products: soaps, detergents, bleach
- Cooking: baking soda, vinegar
- Batteries: chemical energy storage`,
    videoUrl: '',
    quiz: {
      passingMarks: 50,
      questions: [
        {
          question: 'Which process makes injera rise?',
          options: [
            'Boiling',
            'Fermentation',
            'Freezing',
            'Melting',
          ],
          correctAnswer: 1,
          marks: 1,
          explanation:
            'Fermentation by yeast produces CO₂ bubbles that make injera rise.',
        },
      ],
    },
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const course = await Course.findById(COURSE_ID);
    if (!course) {
      console.error('❌ Course not found:', COURSE_ID);
      process.exit(1);
    }

    console.log(`Found course: ${course.title}`);
    console.log(`Current lessons: ${course.lessons.length}`);

    // Replace lessons entirely with new content
    course.lessons = LESSONS;
    await course.save();

    console.log('✅ Successfully populated all 8 lessons!');
    console.log('   → Run the seed script with: node scripts/seedChemistryLessons.js');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();