import Image from 'next/image';
import { Quote, Zap, MapPin, Heart } from 'lucide-react';

const owners = [
  {
    name: 'Alex Chen',
    role: 'CEO & Co-founder',
    image: 'https://picsum.photos/seed/alex-ceo/400/400',
    quote: "Food is the universal language of connection. We built this platform to bridge the gap between local culinary artists and the neighborhood, making every meal a shared experience.",
  },
  {
    name: 'Sarah Jenkins',
    role: 'COO & Co-founder',
    image: 'https://picsum.photos/seed/sarah-coo/400/400',
    quote: "Every minute counts when someone is hungry. We obsess over the logistics, the packaging, and the delivery speed so our customers can just focus on enjoying their food.",
  },
  {
    name: 'David Lin',
    role: 'CTO & Co-founder',
    image: 'https://picsum.photos/seed/david-cto/400/400',
    quote: "Technology should be invisible. You tap a button, and hot food appears at your door. We engineer the magic behind the scenes to make that seemingly simple act flawless.",
  },
];

const values = [
  {
    icon: Heart,
    title: 'Curated Kitchens',
    description: 'We don\'t let just anyone on the app. Every store is vetted for quality, hygiene, and taste to ensure you only get the best.',
  },
  {
    icon: Zap,
    title: 'Lightning Logistics',
    description: 'Our proprietary routing algorithm ensures your food takes the fastest, safest route from the kitchen to your doorstep.',
  },
  {
    icon: MapPin,
    title: 'Hyper-Local Focus',
    description: 'We empower local mom-and-pop shops alongside bigger brands, keeping your money in the local economy.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-base">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
          <h1 className="font-display text-4xl font-medium tracking-tight text-paper md:text-6xl">
            Driven by flavor, <br />
            <span className="text-mango">powered by tech.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            We started as three friends tired of cold burgers and delayed orders. 
            Now, we’re on a mission to redefine how your city experiences food delivery.
          </p>
        </div>
      </section>

      {/* Founders Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mb-12 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-mango">The Founders</span>
          <h2 className="mt-2 font-display text-3xl text-paper">Meet the team behind the tracker</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {owners.map((owner) => (
            <div
              key={owner.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-mango/50 hover:shadow-[0_0_30px_rgba(255,159,28,0.05)]"
            >
              {/* Decorative large quote icon */}
              <Quote className="absolute -right-4 -top-4 h-24 w-24 fill-surface text-surface stroke-mango/10 transition-colors group-hover:stroke-mango/20" />

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Image */}
                <div className="relative mb-6 h-28 w-28 overflow-hidden rounded-full border-2 border-border shadow-lg transition-all duration-300 group-hover:border-mango group-hover:shadow-mango/20">
                  <Image
                    src={owner.image}
                    alt={owner.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>

                {/* Name & Role */}
                <h3 className="font-display text-xl text-paper">{owner.name}</h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-mango">
                  {owner.role}
                </p>

                {/* Divider */}
                <div className="mx-auto my-5 h-px w-12 bg-border" />

                {/* Quote */}
                <p className="relative text-sm leading-relaxed text-muted">
                  <Quote className="absolute -left-5 -top-1 h-3.5 w-3.5 fill-mango text-mango" />
                  {owner.quote}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mb-12 text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-mango">Our Philosophy</span>
            <h2 className="mt-2 font-display text-3xl text-paper">Why we do it differently</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
                  <value.icon className="h-6 w-6 text-mango" />
                </div>
                <h3 className="font-display text-lg text-paper">{value.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA / Fun stat */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
          <div className="mx-auto mb-6 grid max-w-md grid-cols-3 gap-4">
            <div>
              <p className="font-display text-3xl font-medium text-mango">50k+</p>
              <p className="mt-1 text-xs text-muted">Orders Delivered</p>
            </div>
            <div>
              <p className="font-display text-3xl font-medium text-mango">120+</p>
              <p className="mt-1 text-xs text-muted">Partner Kitchens</p>
            </div>
            <div>
              <p className="font-display text-3xl font-medium text-mango">18m</p>
              <p className="mt-1 text-xs text-muted">Avg Delivery Time</p>
            </div>
          </div>
          <p className="text-muted">
            Ready to see what the hype is about?
          </p>
          <a
            href="/stores"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-mango px-6 py-3 text-sm font-medium text-base transition-transform hover:scale-105"
          >
            Explore Stores
          </a>
        </div>
      </section>
    </div>
  );
}