import { Smartphone, Shirt, Sofa, Sparkles, Dumbbell, BookOpen, Watch, ShoppingBasket, Package } from 'lucide-react';

const ICONS = { Smartphone, Shirt, Sofa, Sparkles, Dumbbell, BookOpen, Watch, ShoppingBasket, Package };

export function CategoryIcon({ name, className }) {
  const Icon = ICONS[name] || Package;
  return <Icon className={className} />;
}
