'use client';

import { useState } from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Rate {
  format: string;
  price: number;
  currency: string;
  notes?: string;
}

interface RatesConfiguratorProps {
  rates?: any; // JSON object
  editable?: boolean;
  onChange?: (rates: any) => void;
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'other', label: 'Otro' },
];

const INSTAGRAM_FORMATS = [
  'story', 'reel', 'post', 'carousel', 'collab', 'live'
];

const TIKTOK_FORMATS = [
  'video', 'live', 'series'
];

const YOUTUBE_FORMATS = [
  'video_integration', 'dedicated_video', 'short', 'live'
];

export function RatesConfigurator({ rates = {}, editable = false, onChange }: RatesConfiguratorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [currentRates, setCurrentRates] = useState<any>(rates || {});

  const getPlatformFormats = (platform: string) => {
    switch (platform) {
      case 'instagram': return INSTAGRAM_FORMATS;
      case 'tiktok': return TIKTOK_FORMATS;
      case 'youtube': return YOUTUBE_FORMATS;
      default: return [];
    }
  };

  const formatLabel = (format: string) => {
    return format.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const addRate = (platform: string, format: string) => {
    const newRates = { ...currentRates };
    if (!newRates[platform]) {
      newRates[platform] = {};
    }
    newRates[platform][format] = {
      price: 0,
      currency: 'USD',
    };
    setCurrentRates(newRates);
    if (onChange) onChange(newRates);
  };

  const updateRate = (platform: string, format: string, field: string, value: any) => {
    const newRates = { ...currentRates };
    if (!newRates[platform]) newRates[platform] = {};
    if (!newRates[platform][format]) newRates[platform][format] = {};

    newRates[platform][format][field] = field === 'price' ? parseFloat(value) || 0 : value;
    setCurrentRates(newRates);
    if (onChange) onChange(newRates);
  };

  const removeRate = (platform: string, format: string) => {
    const newRates = { ...currentRates };
    if (newRates[platform]) {
      delete newRates[platform][format];
      if (Object.keys(newRates[platform]).length === 0) {
        delete newRates[platform];
      }
    }
    setCurrentRates(newRates);
    if (onChange) onChange(newRates);
  };

  const platformRates = currentRates[selectedPlatform] || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tarifas por Plataforma</h3>
      </div>

      {editable ? (
        <div className="space-y-6">
          {/* Platform Selector */}
          <div>
            <Label>Selecciona Plataforma</Label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(platform => (
                  <SelectItem key={platform.value} value={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rates Grid */}
          <div className="space-y-3">
            {Object.entries(platformRates).map(([format, rateData]: [string, any]) => (
              <div key={format} className="bento-card p-4 border border-border">
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Formato</Label>
                      <p className="font-medium mt-1">{formatLabel(format)}</p>
                    </div>

                    <div>
                      <Label htmlFor={`price-${format}`} className="text-xs">Precio</Label>
                      <Input
                        id={`price-${format}`}
                        type="number"
                        value={rateData.price || 0}
                        onChange={(e) => updateRate(selectedPlatform, format, 'price', e.target.value)}
                        icon={<DollarSign className="w-4 h-4" />}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`currency-${format}`} className="text-xs">Moneda</Label>
                      <Select
                        value={rateData.currency || 'USD'}
                        onValueChange={(value) => updateRate(selectedPlatform, format, 'currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRate(selectedPlatform, format)}
                    className="text-destructive hover:text-destructive mt-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add Format Button */}
            <div className="flex flex-wrap gap-2">
              {getPlatformFormats(selectedPlatform)
                .filter(format => !platformRates[format])
                .map(format => (
                  <Button
                    key={format}
                    variant="outline"
                    size="sm"
                    onClick={() => addRate(selectedPlatform, format)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {formatLabel(format)}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Read-only View */
        <div className="space-y-4">
          {Object.keys(currentRates).length === 0 ? (
            <div className="text-center py-8 bento-card">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No has configurado tarifas aún</p>
            </div>
          ) : (
            Object.entries(currentRates).map(([platform, formats]: [string, any]) => (
              <div key={platform} className="bento-card p-4">
                <h4 className="font-semibold mb-3 capitalize">{platform}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(formats).map(([format, rateData]: [string, any]) => (
                    <div key={format} className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground mb-1">{formatLabel(format)}</p>
                      <p className="text-xl font-bold text-brand-400">
                        ${rateData.price?.toLocaleString()} {rateData.currency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
