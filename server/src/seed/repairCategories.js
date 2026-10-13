
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Category } from '../models/Category.js';
import { categories } from './data.js';
import { slugify } from '../utils/slugify.js';

async function repairCategories() {
  try {
    await connectDB();

    for (const category of categories) {
      const slug = slugify(category.name);

      await Category.updateOne(
        { name: category.name },
        {
          $set: {
            slug,
            description: category.description || '',
            image: category.image || '',
            icon: category.icon || 'Package',
            isActive: true,
          },
        },
        { upsert: true }
      );

      console.log(`Processed: ${category.name}`);
    }

    console.log('All 8 categories are now available in the database.');
  } catch (error) {
    console.error('Category repair failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

repairCategories();
