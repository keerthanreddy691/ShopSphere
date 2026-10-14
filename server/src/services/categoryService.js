
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';
import { categories as defaultCategories } from '../seed/data.js';

export async function list({ includeInactive = false } = {}) {
  let filter = includeInactive ? {} : { isActive: true };

  let categories = await Category.find(filter)
    .sort({ name: 1 })
    .lean();

  // Create real MongoDB categories if no active categories exist.
  // Never return fake IDs such as "default-1".
  if (categories.length === 0 && !includeInactive) {
    for (const item of defaultCategories) {
      const slug = item.name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await Category.updateOne(
        { slug },
        {
          $setOnInsert: {
            ...item,
            name: item.name,
            slug,
            isActive: true,
          },
        },
        { upsert: true }
      );
    }

    categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();
  }

  const counts = await Product.aggregate([
    {
      $match: {
        moderationStatus: 'APPROVED',
        status: 'ACTIVE',
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  const productCountMap = new Map(
    counts.map((item) => [
      String(item._id),
      item.count,
    ])
  );

  return categories.map((category) => ({
    ...category,
    productCount:
      productCountMap.get(String(category._id)) || 0,
  }));
}

export async function getBySlug(slug) {
  const category = await Category.findOne({
    slug,
    isActive: true,
  }).lean();

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return category;
}

export async function create(data) {
  const slug = await uniqueSlug(Category, data.name);

  return Category.create({
    ...data,
    slug,
  });
}

export async function update(id, data) {
  const category = await Category.findById(id);

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  if (data.name && data.name !== category.name) {
    category.slug = await uniqueSlug(
      Category,
      data.name,
      id
    );
  }

  Object.assign(category, data);

  await category.save();

  return category;
}

export async function remove(id) {
  const category = await Category.findById(id);

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  const inUse = await Product.countDocuments({
    category: id,
  });

  if (inUse) {
    throw ApiError.conflict(
      `Category has ${inUse} product(s). Deactivate it instead of deleting.`
    );
  }

  await category.deleteOne();

  return category;
}
