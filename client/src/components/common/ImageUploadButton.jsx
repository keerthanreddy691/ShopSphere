import { useRef, useState } from 'react';
import { ImageUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/lib/upload';

// Picks image file(s), uploads each to Cloudinary and reports the hosted URLs via onUploaded(urls[]).
export function ImageUploadButton({ folder, onUploaded, multiple = false, label = 'Upload image', loading, ...props }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const onChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    const urls = [];
    for (const file of files) {
      try {
        urls.push(await uploadImage(file, folder));
      } catch (err) {
        toast.error(`${file.name}: ${err.message}`);
      }
    }
    setBusy(false);
    if (urls.length) {
      onUploaded(urls);
      toast.success(urls.length > 1 ? `${urls.length} images uploaded` : 'Image uploaded');
    }
  };

  return (
    <>
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={onChange} />
      <Button type="button" variant="outline" size="sm" loading={busy || loading} onClick={() => input.current?.click()} {...props}>
        {!(busy || loading) && <ImageUp />} {busy ? 'Uploading…' : label}
      </Button>
    </>
  );
}
