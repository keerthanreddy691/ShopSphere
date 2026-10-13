import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, HelpCircle, Truck, RotateCcw, CreditCard, Store, ShieldCheck, Users, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Shell({ eyebrow, title, intro, children }) {
  return (
    <div className="container max-w-4xl py-10 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {intro && <p className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</p>}
      <div className="mt-10 space-y-8 leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

const H = ({ id, children }) => <h2 id={id} className="scroll-mt-40 text-xl font-bold text-ink">{children}</h2>;

export function AboutPage() {
  const values = [
    [Store, 'Verified sellers', 'Every seller is reviewed by our team before listing, and every product passes moderation.'],
    [Layers, 'One cart, many stores', 'Buy from several sellers in one checkout. We split orders behind the scenes so each seller ships what they sell.'],
    [Sparkles, 'Smarter discovery', 'AI-powered smart search and recommendations help you find exactly what you mean, not just what you typed.'],
    [ShieldCheck, 'Buyer protection', 'Secure payments, 7-day returns and a support team that resolves disputes fairly.'],
  ];
  return (
    <Shell eyebrow="About us" title="Building India's most trusted multi-vendor marketplace" intro="ShopSphere brings independent Indian sellers and millions of shoppers together on one platform — with the convenience of a single cart and the choice of an entire bazaar.">
      <div className="grid gap-4 sm:grid-cols-2">
        {values.map(([Icon, t, d]) => (
          <div key={t} className="card p-5">
            <Icon className="size-6 text-brand-600" />
            <p className="mt-3 font-semibold text-ink">{t}</p>
            <p className="mt-1 text-sm">{d}</p>
          </div>
        ))}
      </div>
      <div>
        <H>Our story</H>
        <p className="mt-2">ShopSphere started with a simple observation: great local brands struggle to reach customers online, while shoppers juggle many apps to buy from them. We built a marketplace where sellers get a storefront, inventory tools, analytics and fast settlements — and customers get one seamless experience.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/products"><Button>Start shopping</Button></Link>
        <Link to="/register?role=seller"><Button variant="outline"><Users /> Become a seller</Button></Link>
      </div>
    </Shell>
  );
}

export function ContactPage() {
  const items = [
    [Mail, 'Email', 'support@shopsphere.demo', 'We reply within 24 hours'],
    [Phone, 'Phone', '1800-123-4567', 'Toll free, 9 AM – 9 PM IST'],
    [MapPin, 'Office', '4th Floor, Prestige Tech Park, Koramangala, Bengaluru 560034', ''],
    [Clock, 'Seller support', 'sellers@shopsphere.demo', 'Mon – Sat, 10 AM – 7 PM'],
  ];
  return (
    <Shell eyebrow="Contact" title="We'd love to hear from you" intro="Questions about an order, selling on ShopSphere or partnerships? Reach out through any channel below. Logged-in customers can also raise a support ticket for faster tracking.">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(([Icon, t, v, s]) => (
          <div key={t} className="card flex gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" /></div>
            <div>
              <p className="font-semibold text-ink">{t}</p>
              <p className="text-sm">{v}</p>
              {s && <p className="text-xs text-ink-muted">{s}</p>}
            </div>
          </div>
        ))}
      </div>
      <Link to="/account/support"><Button><HelpCircle /> Raise a support ticket</Button></Link>
    </Shell>
  );
}

export function HelpPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
  const faqs = [
    ['orders', HelpCircle, 'Orders & tracking', ['When you buy from multiple sellers, your checkout is split into one order per seller. Each order is packed and shipped independently, so you may receive separate packages.', 'Track every order from My Orders. The timeline shows each step: Placed, Confirmed, Packed, Shipped and Delivered.', 'You can cancel an order until the seller packs it.']],
    ['shipping', Truck, 'Shipping', ['Delivery is free for each seller order of ₹499 or more; otherwise a ₹49 fee applies per seller.', 'Most orders are delivered within 3–5 business days across India.']],
    ['returns', RotateCcw, 'Returns & refunds', ['You can request a return within 7 days of delivery from the order details page.', 'Once the seller approves and receives the item, your refund is processed to the original payment method.', 'Refund status is visible on the order page at every step.']],
    ['payments', CreditCard, 'Payments', ['We accept cards, UPI and net banking. All payments are processed securely.', 'Coupons are validated at checkout, and the discount is shared proportionally across seller orders.']],
    ['sellers', Store, 'For sellers', ['Register as a seller, and our team will review your application.', 'Once approved, set up your store, list products (reviewed by our moderation team) and manage orders, returns and inventory from your dashboard.', 'Settlements are calculated per delivered order after a 5% platform fee.']],
  ];
  return (
    <Shell eyebrow="Help centre" title="How can we help?" intro="Answers to the most common questions about shopping and selling on ShopSphere.">
      {faqs.map(([id, Icon, title, points]) => (
        <section key={id} id={id} className="card scroll-mt-40 p-6">
          <div className="flex items-center gap-3"><Icon className="size-5 text-brand-600" /><H>{title}</H></div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{points.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
      ))}
      <p className="text-sm">Still stuck? <Link to="/account/support" className="font-semibold text-brand-600 hover:underline">Contact customer support</Link>.</p>
    </Shell>
  );
}

export function PrivacyPage() {
  return (
    <Shell eyebrow="Legal" title="Privacy policy" intro="This policy explains what information ShopSphere collects, why, and how we protect it.">
      <div><H>Information we collect</H><p className="mt-2">Account details (name, email, phone), delivery addresses, order history, and browsing activity on ShopSphere such as recently viewed products, which powers your recommendations.</p></div>
      <div><H>How we use it</H><p className="mt-2">To process orders, share delivery details with the relevant seller and delivery partner, prevent fraud, provide support, and personalise product recommendations.</p></div>
      <div><H>Security</H><p className="mt-2">Passwords are hashed with bcrypt and never stored in plain text. Sessions use HTTP-only cookies. Payment details are handled by our payment provider and never stored on our servers.</p></div>
      <div><H>Your choices</H><p className="mt-2">You can update your profile at any time, and contact support to request account deletion.</p></div>
    </Shell>
  );
}

export function TermsPage() {
  return (
    <Shell eyebrow="Legal" title="Terms of use" intro="By using ShopSphere you agree to these terms.">
      <div><H>Marketplace role</H><p className="mt-2">ShopSphere is a marketplace. Products are sold by independent sellers who are responsible for their listings, stock and fulfilment. ShopSphere facilitates payments, delivery and dispute resolution.</p></div>
      <div><H>Orders & pricing</H><p className="mt-2">Prices are in Indian Rupees and include GST. Orders are confirmed once payment succeeds. Sellers may cancel orders they cannot fulfil, and you are refunded in full.</p></div>
      <div><H>Returns</H><p className="mt-2">Eligible items can be returned within 7 days of delivery. Refunds are issued once the seller receives the item.</p></div>
      <div><H>Seller obligations</H><p className="mt-2">Sellers must list genuine products, keep inventory accurate, and ship within the promised time. A platform fee of 5% applies to each delivered order.</p></div>
    </Shell>
  );
}
