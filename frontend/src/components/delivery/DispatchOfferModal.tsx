'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bike, Clock, MapPin, Wallet } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { dispatchApi } from '@/lib/endpoints/dispatch';
import { DispatchOffer } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { useDeliveryOrdersStore } from '@/store/useDeliveryOrdersStore';

export function DispatchOfferModal() {
  const [offer, setOffer] = useState<DispatchOffer | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isResponding, setIsResponding] = useState(false);
  const audioPlayedRef = useRef(false);
  const bumpRefresh = useDeliveryOrdersStore((s) => s.bumpRefresh);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onOffer = (payload: DispatchOffer) => {
      setOffer(payload);
      audioPlayedRef.current = false;
    };
    socket.on('dispatch:offer', onOffer);
    return () => {
      socket.off('dispatch:offer', onOffer);
    };
  }, []);

  useEffect(() => {
    if (!offer) return;

    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(offer.respondBy).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) setOffer(null); // window expired locally; server-side cron will cascade it
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [offer]);

  async function respond(accept: boolean) {
    if (!offer || isResponding) return;
    setIsResponding(true);
    try {
      if (accept) {
        await dispatchApi.acceptOffer(offer.attemptId);
        toast.success('Delivery accepted!');
        bumpRefresh(); // dashboard's order list has no idea this happened otherwise
      } else {
        await dispatchApi.rejectOffer(offer.attemptId);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not respond to offer'));
    } finally {
      setIsResponding(false);
      setOffer(null);
    }
  }

  if (!offer) return null;

  const progressPercent = (secondsLeft / offer.offerWindowSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-base/80 px-4 pb-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-mango/40 bg-card shadow-ticket">
        <div className="h-1 w-full bg-surface">
          <div
            className="h-full bg-mango transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-lg text-paper">
              <Bike className="h-5 w-5 text-mango" /> New delivery
            </span>
            <span className="flex items-center gap-1 rounded-full bg-mango-soft px-2.5 py-1 font-mono text-sm text-mango">
              <Clock className="h-3.5 w-3.5" /> {secondsLeft}s
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <p className="font-medium text-paper">{offer.storeName}</p>
            <p className="flex items-start gap-1.5 text-muted">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {offer.storeAddress}
            </p>
            <p className="flex items-start gap-1.5 text-muted">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mango" /> {offer.deliveryAddress}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-faint">{offer.distanceKm} km away</span>
              <span className="flex items-center gap-1 font-mono font-semibold text-delivered">
                <Wallet className="h-3.5 w-3.5" /> {formatCurrency(offer.earning)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => respond(false)} isLoading={isResponding}>
              Decline
            </Button>
            <Button className="flex-1" onClick={() => respond(true)} isLoading={isResponding}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
