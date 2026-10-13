import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ArrowLeft, Plus, Trash2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, patch } from '@/lib/api';
import { useCategories } from '@/hooks/useCatalog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea, Field, Select } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/common/SafeImage';
import { ImageUploadButton } from '@/components/common/ImageUploadButton';

export default function SellerProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [stock, setStock] = useState('10');
  const [imagesText, setImagesText] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [seoKeywordsText, setSeoKeywordsText] = useState('');

  // AI Generator Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiFeatures, setAiFeatures] = useState('');
  const [aiSpecs, setAiSpecs] = useState('');
  const [aiTarget, setAiTarget] = useState('Everyday shoppers');
  const [aiGenerated, setAiGenerated] = useState(null);

  // If editing, load product details
  const { data: existingProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ['seller-product-edit', id],
    queryFn: () => get(`/products/seller/mine/${id}`).then((d) => d.product),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || '');
      setCategory(existingProduct.category?._id || existingProduct.category || '');
      setBrand(existingProduct.brand || '');
      setPrice(String(existingProduct.price || ''));
      setDiscount(String(existingProduct.discount || '0'));
      setStock(String(existingProduct.stock || '0'));
      setImagesText((existingProduct.images || []).join('\n'));
      setShortDescription(existingProduct.shortDescription || '');
      setDescription(existingProduct.description || '');
      setTagsText((existingProduct.tags || []).join(', '));
      setSeoKeywordsText((existingProduct.seoKeywords || []).join(', '));
    }
  }, [existingProduct]);

  useEffect(() => {
    if (!category && categories.length > 0 && !isEdit) {
      setCategory(categories[0]._id);
    }
  }, [categories, category, isEdit]);

  // AI Generator Mutation
  const generateAI = useMutation({
    mutationFn: () => {
      const selectedCategory = categories.find((c) => c._id === category)?.name || 'General';
      return post('/ai/generate-description', {
        name,
        category: selectedCategory,
        brand,
        features: aiFeatures,
        specifications: aiSpecs,
        targetAudience: aiTarget,
      });
    },
    onSuccess: (res) => {
      setAiGenerated(res.data);
      toast.success('AI description generated successfully');
    },
    onError: (e) => toast.error(e.message),
  });

  const applyAIToForm = () => {
    if (!aiGenerated) return;
    setShortDescription(aiGenerated.shortDescription || '');
    setDescription(aiGenerated.description || '');
    if (aiGenerated.seoKeywords?.length) {
      setSeoKeywordsText(aiGenerated.seoKeywords.join(', '));
    }
    setAiModalOpen(false);
    toast.success('Applied AI content to product form!');
  };

  // Save Product Mutation
  const saveProduct = useMutation({
    mutationFn: (payload) => (isEdit ? patch(`/products/${id}`, payload) : post('/products', payload)),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated successfully' : 'Product submitted for approval');
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-overview'] });
      navigate('/seller/products');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Product name is required');
    if (!category) return toast.error('Category is required');
    if (!price || Number(price) <= 0) return toast.error('Valid price is required');

    const images = imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!images.length) {
      images.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800');
    }

    const tags = tagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const seoKeywords = seoKeywordsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      category,
      brand: brand.trim(),
      price: Number(price),
      discount: Number(discount) || 0,
      stock: Number(stock) || 0,
      images,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      tags,
      seoKeywords,
    };

    saveProduct.mutate(payload);
  };

  if (isEdit && loadingProduct) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/seller/products"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to Products
          </Link>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {isEdit
              ? 'Update specifications, pricing, and media.'
              : 'Fill in details below to submit your product for approval.'}
          </p>
        </div>

        {/* AI Action Button */}
        <Button
          type="button"
          onClick={() => {
            if (!name) return toast.info('Please enter a product name first');
            setAiModalOpen(true);
          }}
          className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
        >
          <Sparkles className="size-4" /> Generate with AI
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold">General Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product Name" className="sm:col-span-2" required>
              <Input
                placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="Category" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Brand / Manufacturer">
              <Input
                placeholder="e.g. Sony, Apple, Nike"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold">Pricing & Inventory</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="MRP (₹)" required>
              <Input
                type="number"
                min="1"
                placeholder="2999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Field>

            <Field label="Discount (%)">
              <Input
                type="number"
                min="0"
                max="90"
                placeholder="10"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </Field>

            <Field label="Available Stock" required>
              <Input
                type="number"
                min="0"
                placeholder="25"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Descriptions & Highlights</h2>
            <button
              type="button"
              onClick={() => {
                if (!name) return toast.info('Please enter a product name first');
                setAiModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline"
            >
              <Sparkles className="size-3.5" /> Auto-fill with AI
            </button>
          </div>

          <Field label="Short Description" hint="1-2 sentences shown in preview cards">
            <Input
              placeholder="e.g. Industry-leading noise cancellation with 30-hour battery life."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </Field>

          <Field label="Full Description" hint="Detailed overview of materials, features, and specs">
            <Textarea
              rows={5}
              placeholder="Write a rich description of the product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field label="Search Tags (comma separated)" hint="e.g. audio, wireless, bluetooth, overear">
            <Input
              placeholder="audio, wireless, bluetooth"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </Field>

          <Field label="SEO Keywords (comma separated)" hint="Keywords for search optimization">
            <Input
              placeholder="best noise cancelling headphones, wireless headphones in india"
              value={seoKeywordsText}
              onChange={(e) => setSeoKeywordsText(e.target.value)}
            />
          </Field>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Product Images</h2>
            <ImageUploadButton
              folder="products"
              multiple
              label="Upload images"
              onUploaded={(urls) => setImagesText((t) => [t.trim(), ...urls].filter(Boolean).join('\n'))}
            />
          </div>
          <Field label="Image URLs (one URL per line)" hint="Upload photos or paste direct links — the first image is the cover">
            <Textarea
              rows={3}
              placeholder="https://images.unsplash.com/photo-..."
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
            />
          </Field>
          {imagesText.trim() && (
            <div className="flex flex-wrap gap-2">
              {imagesText.split('\n').map((s) => s.trim()).filter(Boolean).map((url, i) => (
                <SafeImage key={`${url}-${i}`} src={url} alt="" className="size-16 rounded-xl border border-slate-200 object-cover" />
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/seller/products">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="lg" loading={saveProduct.isPending}>
            {isEdit ? 'Update Product' : 'Submit for Approval'}
          </Button>
        </div>
      </form>

      {/* AI Description Generator Modal */}
      <Dialog
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        size="lg"
        title="✨ AI Product Description Generator"
        description="Leverage AI to write high-converting copy, bullet points, and SEO tags based on your product specs."
        footer={
          <>
            <Button variant="outline" onClick={() => setAiModalOpen(false)}>
              Cancel
            </Button>
            {aiGenerated ? (
              <Button onClick={applyAIToForm} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Check className="size-4" /> Apply to Product Form
              </Button>
            ) : (
              <Button
                loading={generateAI.isPending}
                onClick={() => generateAI.mutate()}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <Sparkles className="size-4" /> Generate Copy
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-ink-muted">Product Name</p>
              <p className="font-medium text-sm text-ink">{name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-muted">Brand / Category</p>
              <p className="font-medium text-sm text-ink">
                {brand || 'Generic'} · {categories.find((c) => c._id === category)?.name || 'General'}
              </p>
            </div>
          </div>

          <Field label="Key Features" hint="Bullet points or comma separated features">
            <Textarea
              rows={2}
              placeholder="e.g. 30hr battery, active noise cancellation, lightweight design, fast charging"
              value={aiFeatures}
              onChange={(e) => setAiFeatures(e.target.value)}
            />
          </Field>

          <Field label="Specifications (optional)" hint="Materials, dimensions, technical specs">
            <Input
              placeholder="e.g. Bluetooth 5.2, 250g weight, 40mm driver"
              value={aiSpecs}
              onChange={(e) => setAiSpecs(e.target.value)}
            />
          </Field>

          <Field label="Target Audience" hint="Who is this product designed for?">
            <Input
              placeholder="e.g. Audiophiles, commuters, remote workers, students"
              value={aiTarget}
              onChange={(e) => setAiTarget(e.target.value)}
            />
          </Field>

          {generateAI.isPending && (
            <div className="flex flex-col items-center py-6 text-center">
              <RefreshCw className="size-8 animate-spin text-violet-600" />
              <p className="mt-3 text-sm font-semibold">Generating optimized copywriting...</p>
              <p className="mt-1 text-xs text-ink-muted">Crafting descriptions, selling points, and SEO metadata.</p>
            </div>
          )}

          {aiGenerated && (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Generated Short Hook</p>
                <p className="mt-1 text-sm text-ink font-medium">{aiGenerated.shortDescription}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Generated Full Description</p>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed whitespace-pre-line">{aiGenerated.description}</p>
              </div>

              {aiGenerated.keySellingPoints?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Key Selling Points</p>
                  <ul className="mt-1 list-disc list-inside text-xs text-ink-soft space-y-1">
                    {aiGenerated.keySellingPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiGenerated.seoKeywords?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-700">SEO Keywords</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {aiGenerated.seoKeywords.map((k, i) => (
                      <span key={i} className="rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800">
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}

