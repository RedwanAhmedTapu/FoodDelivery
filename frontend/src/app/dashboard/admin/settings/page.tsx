'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { platformSettingsApi } from '@/lib/endpoints/misc';
import { Card } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { apiErrorMessage } from '@/lib/api';

interface Settings {
  platformFee: { type: 'FIXED' | 'PERCENTAGE'; value: number; minOrderAmount: number; maxFeeAmount: number | null };
  pointsRules: {
    earnRatePer100: number;
    redeemPointsPerUnit: number;
    redeemValuePerUnit: number;
    maxRedeemPercentOfOrder: number;
  };
  deliveryFee: { baseFee: number; perKmFee: number };
  taxPercentage: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    platformSettingsApi.get().then(setSettings);
  }, []);

  async function save() {
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await platformSettingsApi.update(settings as unknown as Record<string, unknown>);
      setSettings(updated);
      toast.success('Settings updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="max-w-lg space-y-4">
      <Card className="space-y-4 p-5">
        <h2 className="font-medium text-paper">Platform fee</h2>
        <Select
          label="Type"
          value={settings.platformFee.type}
          onChange={(e) =>
            setSettings({
              ...settings,
              platformFee: { ...settings.platformFee, type: e.target.value as 'FIXED' | 'PERCENTAGE' },
            })
          }
        >
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </Select>
        <Input
          label="Value"
          type="number"
          value={settings.platformFee.value}
          onChange={(e) =>
            setSettings({ ...settings, platformFee: { ...settings.platformFee, value: Number(e.target.value) } })
          }
        />
        <Input
          label="Minimum order amount for fee to apply"
          type="number"
          value={settings.platformFee.minOrderAmount}
          onChange={(e) =>
            setSettings({
              ...settings,
              platformFee: { ...settings.platformFee, minOrderAmount: Number(e.target.value) },
            })
          }
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-medium text-paper">Points rules</h2>
        <Input
          label="Points earned per ৳100 spent"
          type="number"
          value={settings.pointsRules.earnRatePer100}
          onChange={(e) =>
            setSettings({
              ...settings,
              pointsRules: { ...settings.pointsRules, earnRatePer100: Number(e.target.value) },
            })
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Points per redemption unit"
            type="number"
            value={settings.pointsRules.redeemPointsPerUnit}
            onChange={(e) =>
              setSettings({
                ...settings,
                pointsRules: { ...settings.pointsRules, redeemPointsPerUnit: Number(e.target.value) },
              })
            }
          />
          <Input
            label="৳ value per unit"
            type="number"
            value={settings.pointsRules.redeemValuePerUnit}
            onChange={(e) =>
              setSettings({
                ...settings,
                pointsRules: { ...settings.pointsRules, redeemValuePerUnit: Number(e.target.value) },
              })
            }
          />
        </div>
        <Input
          label="Max redemption as % of order"
          type="number"
          value={settings.pointsRules.maxRedeemPercentOfOrder}
          onChange={(e) =>
            setSettings({
              ...settings,
              pointsRules: { ...settings.pointsRules, maxRedeemPercentOfOrder: Number(e.target.value) },
            })
          }
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-medium text-paper">Delivery fee</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Base fee (৳)"
            type="number"
            value={settings.deliveryFee.baseFee}
            onChange={(e) =>
              setSettings({ ...settings, deliveryFee: { ...settings.deliveryFee, baseFee: Number(e.target.value) } })
            }
          />
          <Input
            label="Per km fee (৳)"
            type="number"
            value={settings.deliveryFee.perKmFee}
            onChange={(e) =>
              setSettings({
                ...settings,
                deliveryFee: { ...settings.deliveryFee, perKmFee: Number(e.target.value) },
              })
            }
          />
        </div>
        <Input
          label="Tax percentage"
          type="number"
          value={settings.taxPercentage}
          onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
        />
      </Card>

      <Button onClick={save} isLoading={isSaving} className="w-full">
        Save settings
      </Button>
    </div>
  );
}
