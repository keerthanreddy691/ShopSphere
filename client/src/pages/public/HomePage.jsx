import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Trophy, Zap, Star, Store, ShieldCheck, Truck, Sparkles, BadgePercent } from 'lucide-react';
import { useCategories, useProducts, useStores } from '@/hooks/useCatalog';
import { ProductRail, SectionHeader } from '@/components/product/ProductRail';
import { CategoryIcon } from '@/components/layout/CategoryIcon';
import { RecommendedRail } from '@/components/product/RecommendedRail';
import { SafeImage } from '@/components/common/SafeImage';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber } from '@/lib/format';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop',
];

function Hero() {
  const { user } = useAuth();
  return (
    <section className="container pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-white/15">
              <Sparkles className="size-3.5 text-accent-400" /> AI-powered shopping · 3 trusted stores · 65+ products
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-[56px]">
              Every store you love.
              <br />
              <span className="text-brand-300">One cart.</span> One checkout.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
              Discover electronics, fashion, home essentials and more from India's best independent sellers — with smart search that understands what you mean.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products"><Button size="lg" className="bg-white text-ink hover:bg-slate-100">Start shopping <ArrowRight /></Button></Link>
              <Link to="/search/smart?q=comfortable%20shoes%20for%20long%20walks">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"><Sparkles /> Try Smart Search</Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Truck className="size-4" /> Free delivery over ₹499</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4" /> Verified sellers</span>
              {!user && <Link to="/register?role=seller" className="flex items-center gap-1.5 text-white hover:underline"><Store className="size-4" /> Become a seller</Link>}
            </div>
          </motion.div>
          <div className="hidden grid-cols-2 gap-4 lg:grid">
            {HERO_IMAGES.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                className={i % 2 ? 'translate-y-8' : ''}
              >
                <SafeImage src={src} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/10" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { data: categories, isLoading } = useCategories();
  return (
    <section className="container">
      <SectionHeader title="Shop by category" subtitle="Browse curated collections across the marketplace" />
      <div className="grid grid-cols-4 gap-2 sm:gap-4 lg:grid-cols-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)
          : categories.map((c) => (
              <Link key={c._id} to={`/category/${c.slug}`} className="group flex flex-col items-center gap-2 rounded-2xl p-1.5 text-center transition sm:p-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/70">
                  <SafeImage src={c.image} alt={c.name} className="size-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                  <span className="absolute bottom-2 left-2 hidden size-7 items-center justify-center rounded-lg bg-white/90 text-brand-600 sm:flex">
                    <CategoryIcon name={c.icon} className="size-4" />
                  </span>
                </div>
                <span className="text-xs font-semibold leading-tight text-ink sm:text-sm">{c.name}</span>
              </Link>
            ))}
      </div>
    </section>
  );
}

function DealsBanner() {
  return (
    <section className="container">
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/deals" className="group relative overflow-hidden rounded-2xl bg-accent-500 p-6 text-white sm:p-8">
          <BadgePercent className="absolute -right-6 -top-6 size-40 text-white/10" />
          <p className="text-xs font-bold uppercase tracking-widest text-orange-100">Limited time</p>
          <h3 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Up to 60% off deals</h3>
          <p className="mt-1 text-sm text-orange-50">Earbuds, smartwatches, yoga mats and more.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">Shop deals <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-100">Coupon</p>
          <h3 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">10% off with WELCOME10</h3>
          <p className="mt-1 text-sm text-brand-100">On orders above ₹999 · max ₹1,000 · works across sellers.</p>
          <div className="mt-5 inline-flex rounded-lg border border-dashed border-white/50 px-3 py-1.5 font-mono text-sm font-bold tracking-widest">WELCOME10</div>
        </div>
      </div>
    </section>
  );
}

function PopularStores() {
  const { data: stores, isLoading } = useStores({ limit: 6 });
  return (
    <section className="container">
      <SectionHeader title="Popular stores" subtitle="Top-rated sellers on ShopSphere" to="/stores" icon={Store} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)
          : stores.map((s) => (
              <Link key={s._id} to={`/store/${s.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:shadow-lift">
                <div className="h-24 overflow-hidden bg-slate-100">
                  <SafeImage src={s.banner} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="flex items-center gap-3 p-4">
                  <SafeImage src={s.logo} alt={s.name} className="-mt-10 size-14 rounded-xl border-4 border-white object-cover shadow" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.city} · {formatNumber(s.productCount)} products</p>
                  </div>
                  {s.rating > 0 && (
                    <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const featured = useProducts({ featured: 'true', limit: 10 });
  const trending = useProducts({ sort: 'popular', limit: 10 });
  const best = useProducts({ sort: 'rating', limit: 10 });
  const deals = useProducts({ sort: 'discount', limit: 10, inStock: 'true' });

  return (
    <div className="space-y-14 pb-6 sm:space-y-16">
      <Hero />
      <Categories />
      <div className="container">
        <ProductRail title="Featured products" subtitle="Handpicked by our merchandising team" to="/products?featured=true" icon={Zap} products={featured.data?.items} loading={featured.isLoading} />
      </div>
      <div className="container">
        <RecommendedRail />
      </div>
      <DealsBanner />
      <div className="container">
        <ProductRail title="Trending now" subtitle="What shoppers are buying this week" to="/products?sort=popular" icon={Flame} products={trending.data?.items} loading={trending.isLoading} />
      </div>
      <div className="container">
        <ProductRail title="Best sellers" subtitle="Top rated by verified buyers" to="/products?sort=rating" icon={Trophy} products={best.data?.items} loading={best.isLoading} />
      </div>
      <div className="container">
        <ProductRail title="Deals of the day" subtitle="Biggest discounts across stores" to="/deals" icon={BadgePercent} products={deals.data?.items} loading={deals.isLoading} />
      </div>
      <PopularStores />
    </div>
  );
}
