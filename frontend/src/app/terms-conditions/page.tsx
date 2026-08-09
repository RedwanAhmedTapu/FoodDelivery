import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-base">
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-mango"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">
          Last updated: August 8, 2026
        </p>
        <h1 className="font-display text-4xl font-medium text-paper md:text-5xl">
          Terms & Conditions
        </h1>
        <p className="mt-4 text-muted leading-relaxed">
          Welcome to FoodTracker. By accessing or using our platform, you agree to be bound by these Terms. If you do not agree, please do not use our services.
        </p>

        <div className="mt-12 space-y-10">
          <div>
            <h2 className="mb-3 font-display text-xl text-paper">1. User Accounts</h2>
            <p className="text-sm leading-relaxed text-muted">
              To place an order, you must create an account. You must be at least 18 years old. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">2. Orders & Pricing</h2>
            <p className="text-sm leading-relaxed text-muted">
              All prices listed on the platform include applicable taxes unless stated otherwise. A delivery fee and small service fee may apply depending on your location and the restaurant. Submitting an order constitutes an offer to purchase. The restaurant reserves the right to accept or reject your order due to stock unavailability.
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">3. Delivery Expectations</h2>
            <p className="text-sm leading-relaxed text-muted">
              Delivery times provided on the app are estimates based on current conditions and are not guaranteed. Factors like weather, traffic, and kitchen preparation time may cause delays. If a rider is significantly delayed, our support team will proactively reach out.
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">4. Platform Liability (Food Quality)</h2>
            <p className="text-sm leading-relaxed text-muted">
              FoodTracker acts as a logistics and technology platform connecting you with independent restaurants. We do not prepare, cook, or handle the food. While we vet our partners strictly, responsibility for the taste, quality, allergen information, and hygiene of the food lies solely with the respective restaurant.
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">5. Refunds & Cancellations</h2>
            <p className="text-sm leading-relaxed text-muted">
              You may cancel an order within 2 minutes of placing it for a full refund. Once the restaurant has started preparing your food, cancellation is no longer possible. If you receive the wrong order or items are missing, please report it within 30 minutes of delivery via the app for a partial or full refund.
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">6. Promotions & Points</h2>
            <p className="text-sm leading-relaxed text-muted">
              Loyalty points and promotional discounts are non-transferable and have no cash value. FoodTracker reserves the right to modify or terminate promotions at any time without prior notice. Misuse of promo codes will result in account suspension.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}