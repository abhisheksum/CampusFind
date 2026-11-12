const connectDatabase = require('../config/database');
const { closeDatabaseConnection } = require('../utils/database');
const { CampusLocation, Category } = require('../models');

const categories = [
  { name: 'Electronics', description: 'Phones, laptops, chargers, headphones, and other devices.' },
  { name: 'Accessories', description: 'Bags, glasses, watches, jewelry, and personal accessories.' },
  { name: 'Cards & IDs', description: 'Student IDs, access cards, licenses, and payment cards.' },
  { name: 'Clothing', description: 'Jackets, hoodies, shoes, uniforms, and other clothing.' },
  { name: 'Books & stationery', description: 'Books, notebooks, calculators, and study materials.' },
  { name: 'Personal items', description: 'Water bottles, keys, umbrellas, and miscellaneous belongings.' }
];

const campusLocations = [
  { name: 'Central Library', building: 'Library', description: 'Main campus library and study spaces.' },
  { name: 'Student Union', building: 'Student Union', description: 'Student services, dining, and common areas.' },
  { name: 'Engineering Quad', building: 'Engineering', description: 'Engineering buildings and outdoor quad.' },
  { name: 'Science Building', building: 'Science', description: 'Science classrooms, labs, and common areas.' },
  { name: 'West Campus Gym', building: 'Recreation', description: 'Gymnasium, fitness center, and sports facilities.' },
  { name: 'Arts Courtyard', building: 'Arts Center', description: 'Arts center courtyard and surrounding studios.' }
];

async function seedCollection(Model, records) {
  for (const record of records) {
    await Model.updateOne(
      { name: record.name },
      { $set: record, $setOnInsert: { isActive: true } },
      { upsert: true, runValidators: true }
    );
  }
}

async function seed() {
  try {
    await connectDatabase();
    await seedCollection(Category, categories);
    await seedCollection(CampusLocation, campusLocations);
    console.log(`Seeded ${categories.length} categories and ${campusLocations.length} campus locations.`);
  } catch (error) {
    console.error('Database seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

seed();

