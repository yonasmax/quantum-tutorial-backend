const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const GeezNumber = require('../src/models/GeezNumber');

const NUMBERS = [
  // መሠረታዊ
  { value: 1, symbol: '፩', amharicWord: 'አንድ', geezWord: 'አሐዱ', category: 'መሠረታዊ' },
  { value: 2, symbol: '፪', amharicWord: 'ሁለት', geezWord: 'ክልኤቱ', category: 'መሠረታዊ' },
  { value: 3, symbol: '፫', amharicWord: 'ሦስት', geezWord: 'ሠለስቱ', category: 'መሠረታዊ' },
  { value: 4, symbol: '፬', amharicWord: 'አራት', geezWord: 'አርባዕቱ', category: 'መሠረታዊ' },
  { value: 5, symbol: '፭', amharicWord: 'አምስት', geezWord: 'ኀምስቱ', category: 'መሠረታዊ' },
  { value: 6, symbol: '፮', amharicWord: 'ስድስት', geezWord: 'ስድስቱ', category: 'መሠረታዊ' },
  { value: 7, symbol: '፯', amharicWord: 'ሰባት', geezWord: 'ሰብዓቱ', category: 'መሠረታዊ' },
  { value: 8, symbol: '፰', amharicWord: 'ስምንት', geezWord: 'ሰመንቱ', category: 'መሠረታዊ' },
  { value: 9, symbol: '፱', amharicWord: 'ዘጠኝ', geezWord: 'ተስዓቱ', category: 'መሠረታዊ' },
  { value: 10, symbol: '፲', amharicWord: 'ዐሥር', geezWord: 'ዐሠርቱ', category: 'መሠረታዊ' },

  // ዐሥርት
  { value: 20, symbol: '፳', amharicWord: 'ሃያ', geezWord: 'ዕሥራ', category: 'ዐሥርት' },
  { value: 30, symbol: '፴', amharicWord: 'ሠላሳ', geezWord: 'ሠላሳ', category: 'ዐሥርት' },
  { value: 40, symbol: '፵', amharicWord: 'አርባ', geezWord: 'አርብዓ', category: 'ዐሥርት' },
  { value: 50, symbol: '፶', amharicWord: 'ሃምሳ', geezWord: 'ኀምሳ', category: 'ዐሥርት' },
  { value: 60, symbol: '፷', amharicWord: 'ስልሳ', geezWord: 'ስሳ', category: 'ዐሥርት' },
  { value: 70, symbol: '፸', amharicWord: 'ሰባ', geezWord: 'ሰብዓ', category: 'ዐሥርት' },
  { value: 80, symbol: '፹', amharicWord: 'ሰማንያ', geezWord: 'ሰማንያ', category: 'ዐሥርት' },
  { value: 90, symbol: '፺', amharicWord: 'ዘጠና', geezWord: 'ተስዓ', category: 'ዐሥርት' },

  // መቶአት
  { value: 100, symbol: '፻', amharicWord: 'መቶ', geezWord: 'ምእት', category: 'መቶአት' },

  // ሺዎች
  { value: 1000, symbol: '፲፻', amharicWord: 'ሺ', geezWord: 'ዐሠርቱ እልፍ', category: 'ሺዎች' },
  { value: 10000, symbol: '፼', amharicWord: 'ዐሥር ሺ', geezWord: 'እልፍ', category: 'እልፍ' },
  { value: 1000000, symbol: '፻፼', amharicWord: 'አንድ ሚሊዮን', geezWord: 'እልፍ', category: 'ሚሊዮን' },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    await GeezNumber.deleteMany({});
    console.log('🗑️  Cleared old numbers data');

    for (const n of NUMBERS) {
      await GeezNumber.create(n);
    }

    console.log(`✅ Seeded ${NUMBERS.length} Geez numbers`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

run();