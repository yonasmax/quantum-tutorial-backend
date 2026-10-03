const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SpiritualContent = require('../models/SpiritualContent');

const content = [
  {
    title: "Psalm 23 (መዝሙር 23)",
    type: "bible",
    category: "Old Testament",
    description: "The Lord is my Shepherd",
    reference: "Psalm 23:1-6",
    content: "The Lord is my shepherd; I shall not want.\nHe makes me lie down in green pastures.\nHe leads me beside still waters.\nHe restores my soul.\nHe leads me in paths of righteousness for his name's sake.\nEven though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.\nYou prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.\nSurely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever.",
    amharicContent: "እግዚአብሔር አርያዬ ነው፥ የሚያሳጣኝም የለም።\nበለመለመ መስክ ያሳድረኛል፥ በዕረፍት ውኃ አጠጣኝ።\nነፍሴን ይመልሳል፤ ስለ ስሙ በጽድቅ መንገድ ይመራኛል።"
  },
  {
    title: "The Lord's Prayer (ጸሎተ ሃይማኖት)",
    type: "devotion",
    category: "Prayer",
    description: "The prayer taught by Jesus Christ",
    reference: "Matthew 6:9-13",
    content: "Our Father, who art in heaven, hallowed be thy name.\nThy kingdom come, thy will be done, on earth as it is in heaven.\nGive us this day our daily bread.\nAnd forgive us our trespasses, as we forgive those who trespass against us.\nAnd lead us not into temptation, but deliver us from evil.\nFor thine is the kingdom, and the power, and the glory, forever. Amen.",
    amharicContent: "አባታችን ሆይ፥ በሰማይ የምትኖር፥ ስምህ ይቀደስ፤\nመንግሥትህ ይምጣ፤ ፈቃድህ በሰማይ እንደ ሆነች እንዲሁ በምድር ሁን፤\nየዕለት ኑሮአችንን ዛሬ ስጠን፤\nእኛም የበደሉንን ይቅር እንደምንል በደላችንን ይቅር በለን፤\nከክፉም አድነን። አሜን።"
  },
  {
    title: "Hymn to St. Mary (ውዳሴ ማርያም)",
    type: "hymn",
    category: "Hymn",
    description: "Traditional Ethiopian Orthodox hymn to the Virgin Mary",
    content: "O Mary, Mother of God, our intercessor before your Son, pray for us.\nYou are the burning bush that was not consumed.\nYou are the ladder that reaches to heaven.\nYou are the door of salvation.\nWe honor you, O blessed one, full of grace. Amen.",
    amharicContent: "ኦ ማርያም የእግዚአብሔር እናት፥ ስለ እኛ ለልጅሽ የምትማልደው፥\nየማትቃጠል የእሳት ቁጥቋጦ ነሽ።\nወደ ሰማይ የምትደርስ መሰላል ነሽ።\nየመዳን በር ነሽ። አሜን።"
  },
  {
    title: "The Ethiopian Orthodox Tewahedo Church History",
    type: "history",
    category: "Church History",
    description: "The ancient history of the Ethiopian Orthodox Church",
    content: "The Ethiopian Orthodox Tewahedo Church is one of the oldest Christian churches in the world, founded in the 4th century AD when King Ezana of Axum converted to Christianity.\n\nThe church has preserved ancient Christian traditions, including the Ark of the Covenant (traditionally kept in Axum), and is known for its unique liturgy, music, and fasting practices.\n\nEthiopia is home to many ancient monasteries and churches, including the rock-hewn churches of Lalibela, which are UNESCO World Heritage Sites.\n\nThe EOTC has its own calendar, liturgy, and canonical books, including the Fetha Negast (Law of the Kings) and the Kebra Nagast (Glory of Kings).",
    amharicContent: "የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን በዓለም ላይ ካሉት ጥንታዊ የክርስትና አብያተ ክርስቲያናት አንዷ ናት።"
  },
  {
    title: "Saint Frumentius (አቡነ ሰላማ)",
    type: "saint",
    category: "Saints",
    description: "The first bishop of Ethiopia",
    content: "Saint Frumentius, known as Abune Selama in Ethiopia, was a Syrian Christian who brought Christianity to the Kingdom of Axum in the 4th century.\n\nHe was consecrated as the first bishop of Ethiopia by Saint Athanasius of Alexandria. He established the Ethiopian Orthodox Church and served as its first leader.\n\nHis feast day is celebrated on December 18 (ታኅሣሥ 9). He is remembered as the apostle of Ethiopia and a foundational figure in Ethiopian Christian history.",
    amharicContent: "አቡነ ሰላማ የኢትዮጵያ የመጀመሪያ ጳጳስ ናቸው። በ4ኛው ክፍለ ዘመን ክርስትናን ወደ ኢትዮጵያ አምጥተዋል።"
  },
  {
    title: "Morning Prayer (የንጋት ጸሎት)",
    type: "devotion",
    category: "Prayer",
    description: "Traditional morning prayer",
    content: "O Lord, we thank you for this new day.\nGrant us your grace to walk in your ways.\nBless our studies and our work.\nProtect our families and our nation.\nGuide us with your Holy Spirit.\nThrough the intercession of Saint Mary and all the saints, Amen.",
    amharicContent: "ኦ ጌታ ሆይ፥ ስለዚህ አዲስ ቀን እናመሰግንሃለን።\nበመንገድህ እንድንመላለስ ጸጋህን ስጠን።\nትምህርታችንንና ሥራችንን ባርክ።\nቤተሰቦቻችንንና አገራችንን ጠብቅ። አሜን።"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const item of content) {
      const existing = await SpiritualContent.findOne({ title: item.title });
      if (existing) {
        console.log(`⏭️  Skipped: ${item.title}`);
        continue;
      }
      await SpiritualContent.create(item);
      console.log(`✅ Added: ${item.title}`);
    }

    console.log('\n🎉 Done seeding spiritual content!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();