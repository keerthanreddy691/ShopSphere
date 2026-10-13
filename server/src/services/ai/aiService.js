import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { Product } from '../../models/Product.js';
import { Category } from '../../models/Category.js';
import { Wishlist } from '../../models/Wishlist.js';
import { Cart } from '../../models/Cart.js';
import { OrderItem } from '../../models/OrderItem.js';
import { publicFilter, LIST_FIELDS, escapeRegex } from '../productService.js';

// Calls Gemini and parses its JSON reply. The key goes in a header: newer "AQ." keys are rejected as a ?key= param.
async function callGeminiJSON(prompt, { temperature = 0.5, maxOutputTokens = 4096 } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Thinking models spend output tokens on reasoning first, so leave generous headroom
      generationConfig: { temperature, maxOutputTokens, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Gemini responded ${response.status}`);
  const json = await response.json();
  const text = (json.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
  // Extract JSON if wrapped in markdown ```json ... ```
  return JSON.parse(text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
}

// Deterministic fallback generator when Gemini API is unavailable or unconfigured
function generateFallbackDescription({ name, category, brand, features, specifications, targetAudience }) {
  const brandPart = brand ? `${brand} ` : '';
  const catPart = category || 'product';
  const targetPart = targetAudience ? ` Designed specifically for ${targetAudience.toLowerCase()}.` : '';

  const shortDescription = `Experience unmatched quality with the all-new ${brandPart}${name}. Crafted for everyday performance and long-lasting durability.`;

  const featureList = features
    ? (Array.isArray(features) ? features : String(features).split(/[,;\n]+/)).map((f) => f.trim()).filter(Boolean)
    : [];

  const specList = specifications
    ? (typeof specifications === 'object' && !Array.isArray(specifications)
        ? Object.entries(specifications).map(([k, v]) => `${k}: ${v}`)
        : (Array.isArray(specifications) ? specifications : String(specifications).split(/[,;\n]+/)))
        .map((s) => (typeof s === 'string' ? s.trim() : `${s.key || ''}: ${s.value || ''}`))
        .filter(Boolean)
    : [];

  const description = [
    `The ${brandPart}${name} combines premium engineering with modern design to deliver an exceptional experience in the ${catPart} category.${targetPart}`,
    featureList.length
      ? `Key highlights include ${featureList.slice(0, 3).join(', ')}. Each unit undergoes stringent quality inspections to ensure reliability and comfort.`
      : `Engineered with precision materials, it delivers outstanding reliability, intuitive handling, and modern aesthetics suited for modern lifestyles.`,
    `Backed by verified warranty support and authentic seller guarantee on ShopSphere. Ideal for gifting or personal upgrade.`,
  ].join('\n\n');

  const keySellingPoints = featureList.length >= 3
    ? featureList.slice(0, 5)
    : [
        `Authentic ${brandPart || ''}craftsmanship with high-grade components`,
        `Optimized for ${targetAudience || 'daily performance and longevity'}`,
        `Modern ergonomic profile that seamlessly fits into your routine`,
        `100% genuine product with official manufacturer warranty support`,
      ];

  const rawKeywords = [
    name,
    brand,
    category,
    targetAudience,
    ...featureList,
    'premium',
    'genuine',
    'deal',
  ].filter(Boolean);

  const seoKeywords = [...new Set(rawKeywords.map((k) => String(k).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()))]
    .filter((k) => k.length > 2)
    .slice(0, 8);

  return {
    shortDescription,
    description,
    keySellingPoints,
    seoKeywords,
    source: 'deterministic-fallback',
  };
}

export async function generateProductDescription({ name, category, brand, features, specifications, targetAudience }) {
  if (!name) {
    throw new Error('Product name is required');
  }

  // If Gemini API Key is provided, call Google Gemini REST API
  if (env.geminiApiKey) {
    try {
      const prompt = `You are a professional e-commerce copywriting assistant for a top Indian marketplace named ShopSphere.
Write an enticing, accurate product listing based on the details below:

Product Name: ${name}
Category: ${category || 'General'}
Brand: ${brand || 'Generic'}
Key Features: ${Array.isArray(features) ? features.join(', ') : (features || 'None provided')}
Specifications: ${typeof specifications === 'object' ? JSON.stringify(specifications) : (specifications || 'None provided')}
Target Audience: ${targetAudience || 'General consumers'}

Respond with ONLY valid JSON with no markdown backticks or commentary in this exact format:
{
  "shortDescription": "1-2 punchy sentences summarizing value proposition (under 160 characters)",
  "description": "2-3 well-written, engaging paragraphs highlighting performance, craftsmanship, utility and warranty guarantee",
  "keySellingPoints": ["4 to 5 bullet points highlighting standout advantages"],
  "seoKeywords": ["6 to 8 lowercase high-intent search tags"]
}`;

      const parsed = await callGeminiJSON(prompt, { temperature: 0.7 });
      if (parsed.shortDescription && parsed.description) {
        return {
          shortDescription: parsed.shortDescription,
          description: parsed.description,
          keySellingPoints: Array.isArray(parsed.keySellingPoints) ? parsed.keySellingPoints : [],
          seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [],
          source: 'gemini',
        };
      }
    } catch (err) {
      // Fallback silently if API call fails
      console.warn('Gemini API call failed, using deterministic fallback:', err.message);
    }
  }

  return generateFallbackDescription({ name, category, brand, features, specifications, targetAudience });
}

export async function getSimilarProducts(productId, limit = 10) {
  const product = await Product.findById(productId).populate('category', 'name slug').lean();
  if (!product) return { items: [] };

  const filter = await publicFilter();
  filter._id = { $ne: product._id };

  const [sameCategory, sameBrand] = await Promise.all([
    Product.find({ ...filter, category: product.category?._id })
      .select(LIST_FIELDS)
      .populate('store', 'name slug logo')
      .populate('category', 'name slug')
      .sort({ rating: -1, soldCount: -1 })
      .limit(Number(limit))
      .lean({ flattenMaps: true }),
    product.brand
      ? Product.find({ ...filter, brand: product.brand, category: { $ne: product.category?._id } })
          .select(LIST_FIELDS)
          .populate('store', 'name slug logo')
          .populate('category', 'name slug')
          .sort({ rating: -1 })
          .limit(4)
          .lean({ flattenMaps: true })
      : [],
  ]);

  const map = new Map();
  sameCategory.forEach((p) => {
    map.set(p._id.toString(), {
      product: p,
      reason: p.brand === product.brand ? `Also by ${product.brand}` : `Similar in ${product.category?.name || 'Category'}`,
    });
  });

  sameBrand.forEach((p) => {
    if (!map.has(p._id.toString())) {
      map.set(p._id.toString(), {
        product: p,
        reason: `More from ${product.brand}`,
      });
    }
  });

  const items = Array.from(map.values()).slice(0, Number(limit));
  return { items };
}

export async function getRecommendations(user, limit = 10) {
  const filter = await publicFilter();
  let personalized = false;
  const preferredCategoryIds = new Set();
  const viewedProductIds = new Set();

  if (user) {
    const [wishlist, cart, orders] = await Promise.all([
      Wishlist.findOne({ user: user._id }).lean(),
      Cart.findOne({ user: user._id }).lean(),
      OrderItem.find({ customer: user._id }).limit(10).lean(),
    ]);

    const ids = [
      ...(wishlist?.products || []),
      ...(cart?.items?.map((i) => i.product) || []),
      ...(orders?.map((o) => o.product) || []),
    ];

    if (ids.length) {
      ids.forEach((id) => viewedProductIds.add(id.toString()));
      const products = await Product.find({ _id: { $in: ids } }).select('category brand').lean();
      products.forEach((p) => {
        if (p.category) preferredCategoryIds.add(p.category.toString());
      });
      if (preferredCategoryIds.size > 0) personalized = true;
    }
  }

  let items = [];

  if (personalized && preferredCategoryIds.size > 0) {
    const recs = await Product.find({
      ...filter,
      category: { $in: Array.from(preferredCategoryIds).map((id) => new mongoose.Types.ObjectId(id)) },
      _id: { $nin: Array.from(viewedProductIds).map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select(LIST_FIELDS)
      .populate('store', 'name slug logo')
      .populate('category', 'name slug')
      .sort({ rating: -1, soldCount: -1 })
      .limit(Number(limit))
      .lean({ flattenMaps: true });

    items = recs.map((p) => ({
      product: p,
      reason: `Based on your shopping interests in ${p.category?.name || 'this category'}`,
    }));
  }

  // Fallback to top rated & featured products
  if (items.length < limit) {
    const existingIds = new Set(items.map((i) => i.product._id.toString()));
    const popular = await Product.find({
      ...filter,
      _id: { $nin: Array.from(existingIds).map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select(LIST_FIELDS)
      .populate('store', 'name slug logo')
      .populate('category', 'name slug')
      .sort({ isFeatured: -1, soldCount: -1, rating: -1 })
      .limit(Number(limit) - items.length)
      .lean({ flattenMaps: true });

    popular.forEach((p) => {
      items.push({
        product: p,
        reason: p.isFeatured ? 'Featured choice on ShopSphere' : 'Top trending among shoppers',
      });
    });
  }

  return { items, personalized };
}

// ---------- Smart (natural-language) search ----------

const STOPWORDS = new Set(
  'a an and are as at be best buy by for from good great i in is it me my need of on or please some something that the to under over below above with want looking show find cheap'.split(' '),
);

// Deterministic fallback parser: pulls price bounds and meaningful keywords out of the query
function parseQueryFallback(q) {
  const text = q.toLowerCase();
  const num = (s) => Number(s.replace(/[,k]/g, '')) * (/k$/.test(s) ? 1000 : 1);
  const under = text.match(/(?:under|below|less than|within|upto|up to)\s*(?:rs\.?|₹|inr)?\s*([\d,]+k?)/);
  const over = text.match(/(?:over|above|more than|from)\s*(?:rs\.?|₹|inr)?\s*([\d,]+k?)/);
  const keywords = text
    .replace(/(?:under|below|less than|within|upto|up to|over|above|more than|from)\s*(?:rs\.?|₹|inr)?\s*[\d,]+k?/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  return { keywords: [...new Set(keywords)], maxPrice: under ? num(under[1]) : null, minPrice: over ? num(over[1]) : null };
}

async function parseQueryWithGemini(q, categoryNames) {
  const prompt = `You convert shopping queries for an Indian marketplace into search filters.
Available categories: ${categoryNames.join(', ')}.
Query: "${q}"
Respond with ONLY valid JSON, no markdown:
{"keywords": ["3 to 8 lowercase product words and close synonyms, singular and plural"], "category": "one available category name or null", "minPrice": number or null, "maxPrice": number or null}`;
  const parsed = await callGeminiJSON(prompt, { temperature: 0.2 });
  if (!Array.isArray(parsed.keywords) || !parsed.keywords.length) throw new Error('Gemini returned no keywords');
  return parsed;
}

export async function smartSearch(q, limit = 24) {
  const query = String(q || '').trim().slice(0, 200);
  if (!query) return { items: [], interpretation: null };

  const categories = await Category.find({ isActive: true }).select('name').lean();
  let parsed = null;
  let source = 'deterministic-fallback';
  if (env.geminiApiKey) {
    try {
      parsed = await parseQueryWithGemini(query, categories.map((c) => c.name));
      source = 'gemini';
    } catch (err) {
      console.warn('Gemini smart search failed, using deterministic fallback:', err.message);
    }
  }
  if (!parsed) parsed = parseQueryFallback(query);

  // Keep model phrases ("walking shoe") and their individual words, which match product tags far more often
  const phrases = parsed.keywords.map((k) => String(k).toLowerCase().trim()).filter(Boolean);
  const words = phrases.flatMap((k) => k.split(/[^a-z0-9]+/)).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const keywords = [...new Set([...phrases, ...words])].slice(0, 16);
  const category = parsed.category ? categories.find((c) => c.name.toLowerCase() === String(parsed.category).toLowerCase()) : null;
  const minPrice = Number(parsed.minPrice) || null;
  const maxPrice = Number(parsed.maxPrice) || null;

  const filter = await publicFilter();
  const and = [];
  if (keywords.length) {
    const rxs = keywords.map((k) => new RegExp(escapeRegex(k), 'i'));
    const catIds = await Category.find({ name: { $in: rxs } }).distinct('_id');
    and.push({ $or: [...rxs.flatMap((rx) => [{ name: rx }, { brand: rx }, { tags: rx }, { shortDescription: rx }]), { category: { $in: catIds } }] });
  }
  if (minPrice) and.push({ finalPrice: { $gte: minPrice } });
  if (maxPrice) and.push({ finalPrice: { $lte: maxPrice } });
  if (and.length) filter.$and = and;

  const candidates = await Product.find(filter)
    .select(LIST_FIELDS)
    .populate('store', 'name slug logo')
    .populate('category', 'name slug')
    .limit(200)
    .lean({ flattenMaps: true });

  // Rank by how many query keywords each product matches; tags and names weigh more than descriptions.
  // The guessed category only boosts ranking — the model often picks a neighbouring category (coffee → Home vs Grocery).
  const scored = candidates.map((p) => {
    const tags = (p.tags || []).join(' ').toLowerCase();
    const name = `${p.name} ${p.brand || ''}`.toLowerCase();
    const desc = `${p.shortDescription || ''} ${p.category?.name || ''}`.toLowerCase();
    const matched = keywords.filter((k) => tags.includes(k) || name.includes(k) || desc.includes(k));
    const inCategory = category && p.category?._id?.equals(category._id);
    const score = keywords.reduce((s, k) => s + (tags.includes(k) ? 3 : 0) + (name.includes(k) ? 2 : 0) + (desc.includes(k) ? 1 : 0), 0) + (inCategory ? 2 : 0);
    return { product: p, score, matched };
  });
  scored.sort((a, b) => b.score - a.score || (b.product.rating || 0) - (a.product.rating || 0));

  const items = scored.slice(0, Number(limit)).map(({ product, matched }) => ({
    product,
    reason: matched.length ? `Matches ${matched.slice(0, 3).map((m) => `“${m}”`).join(', ')}` : 'Within your filters',
  }));

  return { items, interpretation: { keywords, category: category?.name || null, minPrice, maxPrice, source } };
}

