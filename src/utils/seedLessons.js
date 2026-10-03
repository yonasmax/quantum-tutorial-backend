// backend/src/utils/seedLessons.js
// Run this script to add all 18 Chemistry lessons at once

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models — these paths are correct from src/utils/
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

const COURSE_ID = '6aa1c210d0844d148fb417da'; // Your Chemistry course

const lessons = [
  {
    title: "U1L3: Properties and Composition of Substances",
    description: "Explain the property of a substance and describe the composition of various materials.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 3,
    content: "Every substance has unique properties (attributes, qualities, or characteristics) that allow us to distinguish it from others because of its unique composition and structure. Composition refers to the nature of a substance's ingredients or constituents and how mixtures or compounds are made up.\n\nExample: Table salt is chemically composed of sodium and chlorine elements. Stainless steel spoons are a solid solution (alloy) of chromium, carbon, and other elements.\n\nKey Questions:\n1. What is meant by the property of a substance?\n2. Explain the chemical composition of table salt and stainless steel.\n\nEntrance Based Question:\nThe nature of something's ingredients or how a whole mixture is made up defines its:\nA) Structure\nB) Composition\nC) Energy state\nD) Physical mass\n\nAnswer: B\n\nExplanation: Composition refers to the specific ingredients, components, or elements that make up a whole substance or mixture.",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L4: Structure and Transformation of Substances",
    description: "Define the structure of a complex system and describe how substances undergo transformations accompanied by energy changes.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 4,
    content: "Structure refers to the arrangement and relationships between the parts or elements of something complex. Transformations are marked changes in form, nature, or appearance that are always accompanied by energy changes (absorbed or released).\n\nPicture Representation: Imagine a school building made of walls, roof, and windows arranged in an orderly manner (structure), contrasted with burning wood changing its chemical nature (transformation).\n\nKey Questions:\n1. How is the structure of a substance different from its composition?\n2. What accompanies every chemical transformation of a substance?\n\nEntrance Based Question:\nThe arrangement and relationships between the parts or elements of a complex system is known as:\nA) Composition\nB) Structure\nC) Mass\nD) Element\n\nAnswer: B",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L5: Introduction to the Scope of Chemistry",
    description: "List the five main disciplines of modern chemistry and describe physical and organic chemistry.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 5,
    content: "Modern chemistry is broken down into five main disciplines:\n\nPhysical Chemistry: The study of macroscopic properties, atomic properties, and phenomena in chemical systems (e.g., reaction rates, energy transfers, molecular physical structure).\n\nOrganic Chemistry: The study of substances containing carbon. Carbon forms millions of chemicals and forms the basis of most chemicals found in living organisms.\n\nKey Questions:\n1. What are the primary areas of study for a physical chemist?\n2. Why is carbon the focal point of organic chemistry?\n\nEntrance Based Question:\nThe branch of chemistry that deals primarily with carbon-containing compounds is:\nA) Inorganic chemistry\nB) Organic chemistry\nC) Analytical chemistry\nD) Physical chemistry\n\nAnswer: B",
    duration: 40,
    isFree: true
  },
  {
    title: "U1L6: Core Disciplines: Inorganic, Analytical, & Biochemistry",
    description: "Characterize inorganic chemistry, analytical chemistry, and biochemistry.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 6,
    content: "Inorganic Chemistry: The study of substances not primarily based on carbon, commonly found in rocks, minerals, energy technology, and information systems.\n\nAnalytical Chemistry: The study of the composition of matter, focusing on separating, identifying, and quantifying chemicals in samples.\n\nBiochemistry: The study of chemical processes occurring in living things, ranging from cellular processes to disease treatments.\n\nKey Questions:\n1. What differentiates inorganic chemistry from organic chemistry?\n2. What tools might an analytical chemist use?\n\nEntrance Based Question:\nWhich branch of chemistry focuses on separating, identifying, and quantifying chemicals in a sample?\nA) Biochemistry\nB) Analytical chemistry\nC) Organic chemistry\nD) Physical chemistry\n\nAnswer: B",
    duration: 40,
    isFree: true
  },
  {
    title: "U1L7: Applications and Potential Dangers of Chemical Products",
    description: "Discuss the broad scope of chemistry in societal development and identify environmental hazards.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 7,
    content: "Chemistry affects all aspects of life, expanding into agriculture, medicine, food production, and building construction. However, it can also produce dangerous substances that negatively impact human life and the environment.\n\nChemical Categories:\n- Industrial Synthetics: Plastics, solvents, cleaners (CFCs)\n- Combustion Byproducts: Fuels, energy generation (oxides of nitrogen, carbon, and sulphur)\n\nKey Questions:\n1. How does chemistry extend its scope beyond pure laboratory science?\n2. Name three classes of harmful chemical pollutants.\n\nEntrance Based Question:\nWhich of the following is a dangerous chemical pollutant resulting from industrial processes?\nA) Oxygen gas\nB) Oxides of sulphur and nitrogen\nC) Pure water vapor\nD) Sodium chloride solution\n\nAnswer: B",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L8: Introduction to Science and Natural Sciences",
    description: "Define science and its fundamental methodology. Identify the relationship between chemistry and other natural sciences.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 8,
    content: "Science is the process by which we learn about the natural universe by observing, testing, and generating models. Because the physical universe is vast, it divides into branches such as biology (study of living things), geology (study of rocks and earth), and physics (nature and properties of matter and energy). Chemistry acts as the central science linking all these natural sciences together.\n\nKey Questions:\n1. What is science, and how do scientists study the universe?\n2. Why is chemistry often referred to as the 'central science'?\n\nEntrance Based Question:\nChemistry is often called the 'central science' because:\nA) It is the oldest science in existence.\nB) It links all other natural sciences together through its study of matter.\nC) It deals exclusively with mathematical equations.\nD) It does not overlap with biology or physics.\n\nAnswer: B",
    duration: 30,
    isFree: true
  },
  {
    title: "U1L9: Relationship Between Chemistry and Biology (Biochemistry)",
    description: "Explain the overlap between chemistry and biology. Give examples of biochemical applications.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 9,
    content: "Biochemistry is the study of chemical processes occurring in living matter. Biologists and chemists often overlap—for example, when researching the isolation, characterization, and biological activities of medicinal plant compounds. Complex life processes like photosynthesis and cellular respiration cannot be fully explained without understanding chemical reactions.\n\nKey Questions:\n1. What is biochemistry?\n2. Give an example of an overlap between chemical science and biological study.\n\nEntrance Based Question:\nThe interdisciplinary field that studies the chemical processes occurring within living matter is:\nA) Geochemistry\nB) Biochemistry\nC) Chemical physics\nD) Medicinal chemistry\n\nAnswer: B",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L10: Relationship Between Chemistry, Physics, Geology, and Medicine",
    description: "Describe geochemistry, chemical physics, and medicinal chemistry.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 10,
    content: "Geochemistry: The study of processes controlling the abundance, composition, and distribution of chemical compounds and isotopes in geologic environments.\n\nChemical Physics: Investigates physicochemical phenomena using techniques from atomic, molecular, and condensed matter physics.\n\nMedicinal Chemistry: Focuses on the design, development, and synthesis of pharmaceutical drugs bridging chemistry and medicine.\n\nKey Questions:\n1. What does geochemistry investigate?\n2. How does physics overlap with chemistry?\n\nEntrance Based Question:\nThe study of chemical compounds and isotopes within geologic environments is known as:\nA) Biochemistry\nB) Geochemistry\nC) Organic chemistry\nD) Analytical chemistry\n\nAnswer: B",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L11: The Role of Chemistry in Agriculture",
    description: "Identify chemical products used in modern agriculture. Explain how fertilizers and pesticides enhance food production.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 11,
    content: "Chemistry provides chemical fertilizers and crop protection agents to meet the ever-growing global demand for food.\n\nFertilizers: Calcium superphosphate, urea, ammonium sulphate, and sodium nitrate boost crop yields.\n\nPesticides: Divided based on targeted pests into fungicides (fungi), herbicides (weeds), and insecticides (insects). Additionally, high-quality plastic pipes improve agricultural irrigation.\n\nKey Questions:\n1. List four common chemical fertilizers used in agriculture.\n2. Distinguish between fungicides, herbicides, and insecticides.\n\nEntrance Based Question:\nWhich type of agricultural chemical is specifically designed to control and destroy unwanted weeds?\nA) Insecticide\nB) Herbicide\nC) Fungicide\nD) Fertilizer\n\nAnswer: B",
    duration: 30,
    isFree: true
  },
  {
    title: "U1L12: The Role of Chemistry in Food Production and Preservation",
    description: "Describe the role of chemistry in food preservation and quality testing.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 12,
    content: "Chemistry has led to the discovery of food preservatives that extend the shelf-life of consumable goods, along with testing methods to detect adulterants and ensure purity. Consumers benefit from improved appearance, nutritional content, and flavor. A common local example is the traditional preservation of raw meat.\n\nKey Questions:\n1. What is the primary purpose of food preservatives?\n2. Why are food adulteration tests important?\n\nEntrance Based Question:\nWhich of the following is a major contribution of chemistry to food production?\nA) Eliminating the need for crop irrigation\nB) Discovering food preservatives to extend product shelf-life\nC) Replacing natural water with synthetic drinks\nD) Removing all nutrients from food\n\nAnswer: B",
    duration: 30,
    isFree: true
  },
  {
    title: "U1L13: The Role of Chemistry in Medicine (Life-Saving Drugs)",
    description: "Name key life-saving drugs discovered through chemistry. Discuss treatments for major illnesses.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 13,
    content: "Chemistry provides life-saving medicines like sulphur drugs and penicillin (cures for dysentery and pneumonia), cisplatin and Taxol (cancer therapy), and AZT (prolongs the life of HIV/AIDS victims by fighting viral multiplication). Prevention through safe practices remains essential since HIV/AIDS has no complete cure.\n\nKey Questions:\n1. Which drugs are used for cancer therapy?\n2. What is the function of AZT in HIV-AIDS management?\n\nEntrance Based Question:\nWhich pharmaceutical drug is used to fight the multiplication of the virus in HIV-AIDS victims?\nA) Penicillin\nB) Cisplatin\nC) AZT\nD) Taxol\n\nAnswer: C",
    duration: 40,
    isFree: true
  },
  {
    title: "U1L14: Classification of Common Medical Drugs",
    description: "Classify various pharmaceutical drugs based on their medical functions.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 14,
    content: "Medical drugs are categorized by their specific therapeutic uses:\n\nDisinfectants: Kill microbes in toilets, floors, drains, and hand sanitizers\nAnalgesics: Painkillers used to achieve relief from pain\nAnesthetics: Relieve pain during medical operations\nAntibiotics: Control infections and cure bacterial diseases\nAntiseptics: Prevent wound contamination by bacteria\nTranquillizers: Reduce tension and bring calm to patients with mental illnesses\n\nKey Questions:\n1. What is the difference between an antiseptic and a disinfectant?\n2. Give the medical use of analgesics and tranquillizers.\n\nEntrance Based Question:\nDrugs used to prevent the contamination of wounds by bacteria are called:\nA) Analgesics\nB) Antiseptics\nC) Tranquillizers\nD) Anesthetics\n\nAnswer: B",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L15: Building Construction Materials & Megaprojects (GERD)",
    description: "Identify chemical construction materials. Describe major infrastructure projects in Ethiopia.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 15,
    content: "Chemistry contributes to building construction by supplying resources like glass, steel, and cement, enabling the construction of durable houses, multi-story buildings, dams, and bridges. A prime example is the Grand Ethiopian Renaissance Dam (GERD) in the Benishangul-Gumuz Region—a 6,450 MW hydropower project on the Blue Nile and Africa's largest hydropower project.\n\nKey Questions:\n1. What building resources does chemistry provide?\n2. State the location and significance of the GERD.\n\nEntrance Based Question:\nThe Grand Ethiopian Renaissance Dam (GERD) is located in which region of Ethiopia?\nA) Oromia Region\nB) Amhara Region\nC) Benishangul-Gumuz Region\nD) Tigray Region\n\nAnswer: C",
    duration: 40,
    isFree: true
  },
  {
    title: "U1L16: Introduction to Chemical Industries & Economic Processing",
    description: "Define an industry and a chemical industry. Describe the conversion of natural resources.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 16,
    content: "An industry is an economic activity concerned with processing raw materials and manufacturing goods in factories. Chemical industries convert natural resources (oil, natural gas, air, water, metals, and minerals) into diverse industrial and consumer products. The Ethiopian government has actively expanded industrial parks nationwide to boost economic development.\n\nKey Questions:\n1. How is an industry defined?\n2. What are the primary raw materials converted by chemical industries?\n\nEntrance Based Question:\nEconomic activity concerned with the processing of raw materials and manufacture of goods in factories is known as:\nA) Agriculture\nB) Industry\nC) Geology\nD) Biochemistry\n\nAnswer: B",
    duration: 30,
    isFree: true
  },
  {
    title: "U1L17: Classification of Chemical Industries and Products",
    description: "Categorize chemical industries into major industrial sectors.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 17,
    content: "Chemical industries comprise companies manufacturing inorganic/organic chemicals, polymers, agrochemicals, and ceramics. They are classified into three general product classes:\n\n1. Basic Chemicals: Alkalis, acids, organic chemicals, and salts.\n2. Manufacturing Intermediates: Plastic materials, synthetic fibers, pigments, and dry colors.\n3. Finished Consumer Products: Cosmetics, drugs, soaps, paints, fertilizers, and explosives.\n\nKey Questions:\n1. What are the three general classes of chemical products?\n2. Give two examples of basic chemicals produced by industries.\n\nEntrance Based Question:\nAlkalis, acids, and inorganic salts belong to which general class of chemical products?\nA) Finished consumer goods\nB) Basic chemicals\nC) Agricultural pesticides\nD) Synthetic textile fibers\n\nAnswer: B",
    duration: 30,
    isFree: true
  },
  {
    title: "U1L18: Large and Medium-Scale Chemical Enterprises in Ethiopia (Part 1)",
    description: "Name key chemical enterprises operating in Ethiopia. Match factories with their products.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 18,
    content: "Several medium and large-scale enterprises operate across Ethiopia, producing vital industrial and consumer chemicals:\n\n• Abijata Soda Ash Factory (Bulbula) — Trona (NaH(CO3)2.2H2O)\n• Ziway Caustic Soda Factory (Ziway) — Sodium hydroxide (Caustic soda)\n• Chorra Gas & Chemical Products (Addis Ababa) — Aluminum sulphate, sulphuric acid, petroleum\n• Adola Magnesium Oxide Factory (Adolla) — Magnesium oxide\n• Adami Tulu Pesticide Processing Plant (Adami-Tulu) — Malathion, endosulfan, diazinon, dimethoate\n\nKey Questions:\n1. What product is manufactured at Abijata Soda Ash Factory?\n2. Which enterprise produces aluminum sulphate in Addis Ababa?\n\nEntrance Based Question:\nWhich Ethiopian enterprise is primarily responsible for producing Trona soda ash?\nA) Repi Soap & Detergent PLC\nB) Abijata Soda Ash Factory\nC) Ziway Caustic Soda Factory\nD) Nefas Silk Paints Factory\n\nAnswer: B",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L19: Large and Medium-Scale Chemical Enterprises in Ethiopia (Part 2)",
    description: "Identify consumer goods and cosmetic manufacturing plants in Ethiopia.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 19,
    content: "Consumer chemical and cosmetic enterprises provide everyday household and construction products:\n\n• Repi Soap & Detergent P.L.C (Addis Ababa) — Soaps and detergents\n• Nefas Silk Paints Factory (Addis Ababa) — Paints, varnishes, antirusts, glues\n• Y.B Cosmetics (Sheger City) — Cosmetics and perfumes\n• Modern Building Industries (Addis Ababa) — Cement products, ceramics, sanitary ware\n• Mekab PLC (Addis Ababa) — Hair oil, shampoo, conditioner, lotion, vaseline\n\nKey Questions:\n1. What products are manufactured by Nefas Silk Paints Factory?\n2. Name the city and products associated with Y.B Cosmetics.\n\nEntrance Based Question:\nWhich factory produces paints, varnishes, and antirust coatings in Addis Ababa?\nA) Abijata Soda Ash Factory\nB) Nefas Silk Paints Factory\nC) Adami Tulu Pesticide Plant\nD) Ziway Caustic Soda Factory\n\nAnswer: B",
    duration: 35,
    isFree: true
  },
  {
    title: "U1L20: Other Chemical Product Industries and Unit Review",
    description: "List specialized heavy industries in Ethiopia. Summarize the core concepts of Unit 1.",
    chapter: "Unit 1: Introduction to Chemistry",
    order: 20,
    content: "Beyond standard chemical plants, Ethiopia hosts major sector-specific industries:\n\n• Cement: Mugher, Dire Dawa, Mesobo, Derba, Midroc, Dangote\n• Sugar: Metehara, Wonji, Finchaa, Omokuraz\n• Paper and Pulp: Wonji\n• Pharmaceuticals: Addis, Ethiopia, Adigrat\n• Tyre: Horizon Addis Tyre\n\nKey Questions:\n1. Name four cement-producing locations in Ethiopia.\n2. What are the major sugar-producing factories?\n\nEntrance Based Question:\nHorizon Addis Tyre is an industrial enterprise in Ethiopia primarily known for manufacturing:\nA) Pharmaceuticals and drugs\nB) Automobile tyres\nC) Soda ash and trona\nD) Chemical fertilizers\n\nAnswer: B\n\nUnit 1 Review:\nYou have learned about the fundamentals of chemistry, its branches, applications, and the chemical industry in Ethiopia. Chemistry is truly the central science that connects all aspects of life.",
    duration: 45,
    isFree: true
  }
];

async function seedLessons() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const course = await Course.findById(COURSE_ID);
    if (!course) {
      console.error('❌ Course not found! Check COURSE_ID');
      process.exit(1);
    }
    console.log(`📚 Found course: ${course.title}`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const lessonData of lessons) {
      const existing = await Lesson.findOne({
        course: COURSE_ID,
        title: lessonData.title
      });

      if (existing) {
        console.log(`⏭️  Skipped (exists): ${lessonData.title}`);
        skippedCount++;
        continue;
      }

      const lesson = await Lesson.create({
        ...lessonData,
        course: COURSE_ID
      });

      await Course.findByIdAndUpdate(COURSE_ID, {
        $push: { lessons: lesson._id }
      });

      addedCount++;
      console.log(`✅ Added: ${lessonData.title}`);
    }

    console.log(`\n🎉 DONE!`);
    console.log(`   Added: ${addedCount} lessons`);
    console.log(`   Skipped: ${skippedCount} lessons`);
    console.log(`   Total in course: ${course.lessons.length + addedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedLessons();