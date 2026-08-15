'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/useCartStore';
import { ordersApi } from '@/lib/endpoints/orders';
import { paymentsApi } from '@/lib/endpoints/payments';
import { pointsApi } from '@/lib/endpoints/misc';
import { AuthGate } from '@/lib/useRequireAuth';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Card } from '@/components/ui/Primitives';
import { formatCurrency, getCurrentPosition } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

// Payment methods that require redirecting to an external gateway page.
// COD (and anything not in this list) settles instantly / on delivery.
const REDIRECT_GATEWAYS = ['SSLCOMMERZ', 'CARD', 'BKASH', 'NAGAD', 'STRIPE'];

function CheckoutContent() {
  const router = useRouter();
  const { cart, subtotal, refresh } = useCartStore();
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    refresh();
    pointsApi.myBalance().then(setPointsBalance).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function detectLocation() {
    setIsLocating(true);
    try {
      const { coords } = await getCurrentPosition();
      setCoordinates(coords);
      toast.success('Location detected');
    } catch {
      toast.error('Could not detect location — enter coordinates manually');
    } finally {
      setIsLocating(false);
    }
  }

  async function handlePlaceOrder() {
    if (!address.trim()) return toast.error('Enter a delivery address');
    if (!coordinates) return toast.error('Set your delivery location');

    setIsSubmitting(true);
    try {
      // Step 1: create the order
      const order = await ordersApi.create({
        deliveryAddress: address,
        deliveryCoordinates: coordinates,
        paymentMethod,
        pointsToRedeem: pointsToRedeem || undefined,
        referralCode: referralCode || undefined,
        notes: notes || undefined,
      });

      // Step 2: COD needs no payment gateway — go straight to the order page
      if (!REDIRECT_GATEWAYS.includes(paymentMethod)) {
        toast.success('Order placed!');
        router.push(`/orders/${order._id}`);
        return;
      }

      // Step 3: for gateway methods, create the payment and get the redirect URL
      const payment = await paymentsApi.create({
        orderId: order._id,
        provider: paymentMethod,
      });

      const gatewayUrl = payment?.metadata?.gatewayPageURL;
      if (!gatewayUrl) {
        toast.error('Payment could not be started. Please try again or use Cash on delivery.');
        router.push(`/orders/${order._id}`);
        return;
      }

      // Step 4: send the browser to SSLCommerz's hosted payment page
      window.location.href = gatewayUrl;
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not place order'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!cart || cart.items.length === 0) {
    router.replace('/cart');
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-paper">Checkout</h1>

      <Card className="mt-6 space-y-4 p-5">
        <h2 className="font-medium text-paper">Delivery details</h2>
        <Textarea
          label="Delivery address"
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House, road, area..."
        />
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={detectLocation} isLoading={isLocating}>
            <MapPin className="h-4 w-4" /> Detect my location
          </Button>
          {coordinates && (
            <span className="font-mono text-xs text-faint">
              {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
            </span>
          )}
        </div>

        <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="COD">Cash on delivery</option>
          <option value="SSLCOMMERZ">Pay Online</option>
        </Select>

        <Textarea
          label="Notes for the store (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      <Card className="mt-4 space-y-4 p-5">
        <h2 className="font-medium text-paper">Points & referral</h2>
        <Input
          label={`Redeem points (balance: ${pointsBalance})`}
          type="number"
          min={0}
          max={pointsBalance}
          value={pointsToRedeem}
          onChange={(e) => setPointsToRedeem(Math.max(0, Number(e.target.value)))}
        />
        <Input
          label="Referral code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
      </Card>

      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="font-mono text-paper">{formatCurrency(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-faint">
          Delivery fee, platform fee, tax, and points discount are calculated by the server and shown on
          your order confirmation.
        </p>
        <Button className="mt-4 w-full" size="lg" isLoading={isSubmitting} onClick={handlePlaceOrder}>
          Place order
        </Button>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGate allowedRoles={['CUSTOMER']}>
      <CheckoutContent />
    </AuthGate>
  );
}