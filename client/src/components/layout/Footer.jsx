import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';
import { Logo } from './Logo';

const cols = [
  { title: 'ShopSphere', links: [['About us', '/about'], ['Contact', '/contact'], ['All stores', '/stores'], ["Today's deals", '/deals']] },
  { title: 'Help', links: [['Help centre', '/help'], ['Customer support', '/account/support'], ['Track orders', '/account/orders'], ['Returns & refunds', '/help#returns']] },
  { title: 'Policies', links: [['Privacy policy', '/privacy'], ['Terms of use', '/terms'], ['Shipping policy', '/help#shipping'], ['Payments', '/help#payments']] },
  { title: 'Sell with us', links: [['Seller registration', '/register?role=seller'], ['Seller dashboard', '/seller'], ['Seller help', '/help#sellers']] },
];

const perks = [
  { icon: Truck, title: 'Free delivery', text: 'On orders above ₹499' },
  { icon: RotateCcw, title: 'Easy returns', text: '7-day hassle-free returns' },
  { icon: ShieldCheck, title: 'Secure payments', text: 'Encrypted & protected' },
  { icon: Headphones, title: '24×7 support', text: "We're here to help" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container grid grid-cols-2 gap-6 border-b border-slate-100 py-8 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="container grid gap-10 py-12 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            ShopSphere is a multi-vendor marketplace connecting millions of Indian shoppers with trusted sellers — one cart, one checkout, every store.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-ink-soft">
            <li className="flex items-center gap-2"><Mail className="size-4 text-slate-400" /> support@shopsphere.demo</li>
            <li className="flex items-center gap-2"><Phone className="size-4 text-slate-400" /> 1800-123-4567 (toll free)</li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-slate-400" /> Koramangala, Bengaluru 560034</li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold">{c.title}</p>
              <ul className="mt-3 space-y-2.5">
                {c.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-ink-muted transition hover:text-brand-600">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} ShopSphere Marketplace. Built with the MERN stack.</p>
          <p>Prices are in Indian Rupees (₹) and inclusive of GST.</p>
        </div>
      </div>
    </footer>
  );
}
