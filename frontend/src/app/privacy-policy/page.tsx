import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-muted leading-relaxed">
          At FoodTracker, your privacy is seriously important to us. This policy explains how we collect, use, and protect your personal data when you use our platform to order food.
        </p>

        <div className="mt-12 space-y-10">
          {/* Section */}
          <div>
            <h2 className="mb-3 font-display text-xl text-paper">1. Information We Collect</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-muted">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <div><strong className="text-paper">Account Data:</strong> Name, email address, phone number, and password when you sign up.</div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <div><strong className="text-paper">Location Data:</strong> We require your precise GPS location to show nearby stores and assign the closest delivery rider to your order.</div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <div><strong className="text-paper">Payment Data:</strong> Credit/debit card details are processed securely by our payment partners (e.g., Stripe). We do not store full card numbers on our servers.</div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <div><strong className="text-paper">Usage Data:</strong> IP address, device type, browser type, and pages visited to help us improve the app experience.</div>
              </li>
            </ul>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed text-muted">
              We use your data to process and deliver your orders, provide real-time tracking, prevent fraud, personalize restaurant recommendations, and communicate with you about your account or orders. 
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">3. Who We Share It With</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-muted">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <div><strong className="text-paper">Restaurants:</strong> Your name, delivery address, and order details are shared with the kitchen preparing your food.</div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <div><strong className="text-paper">Delivery Riders:</strong> Your exact delivery pin, phone number, and order contents are shared with your assigned rider.</div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                <div><strong className="text-paper">Service Providers:</strong> Cloud hosting, mapping APIs, and payment gateways that help us operate the platform.</div>
              </li>
            </ul>
          </div>

          <hr className="border-border" />

          <div>
            <h2 className="mb-3 font-display text-xl text-paper">4. Data Retention & Your Rights</h2>
            <p className="text-sm leading-relaxed text-muted">
              We keep your account data as long as your account is active. You can request to view, update, or permanently delete your personal data at any time by contacting support@foodtracker.app or via the app settings. Please note that deleting your account will remove your order history and loyalty points.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}