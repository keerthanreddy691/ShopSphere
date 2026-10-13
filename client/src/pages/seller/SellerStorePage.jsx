import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { get, put } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea, Field } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/common/SafeImage';
import { ImageUploadButton } from '@/components/common/ImageUploadButton';

export default function SellerStorePage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  const { data: store, isLoading } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => get('/stores/me/store').then((d) => d.store),
  });

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setCity(store.city || '');
      setContactEmail(store.contactEmail || '');
      setContactPhone(store.contactPhone || '');
      setDescription(store.description || '');
      setLogo(store.logo || '');
      setBanner(store.banner || '');
    }
  }, [store]);

  const saveStore = useMutation({
    mutationFn: () =>
      put('/stores/me/store', {
        name,
        city,
        contactEmail,
        contactPhone,
        description,
        logo,
        banner,
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Store settings saved successfully');
      qc.invalidateQueries({ queryKey: ['my-store'] });
      qc.invalidateQueries({ queryKey: ['seller-profile'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Store Profile & Branding</h1>
          <p className="mt-1 text-sm text-ink-muted">Customize your storefront details, contact info, and logo shown to buyers.</p>
        </div>
        {store?.slug && (
          <Link to={`/store/${store.slug}`} target="_blank">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="size-4" /> View Public Storefront
            </Button>
          </Link>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveStore.mutate();
        }}
        className="space-y-6"
      >
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Store className="size-5 text-brand-600" /> Store Branding
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store Name" required className="sm:col-span-2">
              <Input
                placeholder="e.g. TechNova Electronics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="City / Location" required>
              <Input
                placeholder="e.g. Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </Field>

            <Field label="Customer Care Email">
              <Input
                type="email"
                placeholder="care@yourstore.in"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </Field>

            <Field label="Customer Care Phone">
              <Input
                placeholder="080-4567-1200"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </Field>

            <Field label="Store Description" className="sm:col-span-2" hint="Shown on your store profile page">
              <Textarea
                rows={3}
                placeholder="Describe your store, products, and brand mission..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold">Store Visuals</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Field label="Store Logo URL" hint="Square format recommended">
                <Input
                  placeholder="https://images.unsplash.com/photo-..."
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </Field>
              <ImageUploadButton folder="stores" label="Upload logo" className="mt-2" onUploaded={([url]) => setLogo(url)} />
              {logo && (
                <div className="mt-3">
                  <p className="text-xs text-ink-muted mb-1">Logo Preview:</p>
                  <SafeImage src={logo} alt="" className="size-16 rounded-xl object-cover border border-slate-200" />
                </div>
              )}
            </div>

            <div>
              <Field label="Store Banner URL" hint="Panoramic banner for storefront">
                <Input
                  placeholder="https://images.unsplash.com/photo-..."
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                />
              </Field>
              <ImageUploadButton folder="stores" label="Upload banner" className="mt-2" onUploaded={([url]) => setBanner(url)} />
              {banner && (
                <div className="mt-3">
                  <p className="text-xs text-ink-muted mb-1">Banner Preview:</p>
                  <SafeImage src={banner} alt="" className="h-16 w-full rounded-xl object-cover border border-slate-200" />
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saveStore.isPending} className="gap-2">
            <Save className="size-4" /> Save Store Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

