// components/affiliate/SocialHandleCard.tsx
'use client';
import { useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SocialPlatform } from '@/types/affiliate';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', X: 'X (Twitter)',
  WHATSAPP_CHANNEL: 'WhatsApp Channel', WHATSAPP_STATUS: 'WhatsApp Status',
  YOUTUBE: 'YouTube', TIKTOK: 'TikTok',
};

const HANDLE_PLACEHOLDER: Record<SocialPlatform, string> = {
  FACEBOOK: 'https://facebook.com/yourpage',
  INSTAGRAM: '@yourhandle',
  X: '@yourhandle',
  WHATSAPP_CHANNEL: 'https://wa.me/channel/...',
  WHATSAPP_STATUS: 'Your display name or phone number (kept private)',
  YOUTUBE: 'https://youtube.com/@yourchannel',
  TIKTOK: '@yourhandle',
};

export interface SocialEntry {
  platform: SocialPlatform;
  handle: string;
  platformLink: string;
  followersCount: string;
  screenshots: File[];
}

interface Props {
  platform: SocialPlatform;
  entry?: SocialEntry;
  onChange: (data: Partial<SocialEntry>) => void;
}

export const SocialHandleCard = ({ platform, entry, onChange }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const isStatus = platform === 'WHATSAPP_STATUS';
  const minScreenshots = isStatus ? 2 : 1;
  const screenshots = entry?.screenshots ?? [];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    onChange({ screenshots: [...screenshots, ...valid].slice(0, 3) });
  };

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
      <p className="font-semibold text-gray-900 text-sm">{PLATFORM_LABELS[platform]}</p>
      <div>
        <Label htmlFor={`handle-${platform}`} className="text-xs">
          {isStatus ? 'Display name or phone' : 'Handle / URL'} <span className="text-red-500">*</span>
        </Label>
        <Input id={`handle-${platform}`} value={entry?.handle ?? ''} onChange={(e) => onChange({ handle: e.target.value })} placeholder={HANDLE_PLACEHOLDER[platform]} className="mt-1 text-sm" />
      </div>
      {!isStatus && (
        <div>
          <Label htmlFor={`link-${platform}`} className="text-xs">Profile link <span className="text-gray-400">(optional)</span></Label>
          <Input id={`link-${platform}`} value={entry?.platformLink ?? ''} onChange={(e) => onChange({ platformLink: e.target.value })} placeholder="https://..." className="mt-1 text-sm" />
        </div>
      )}
      <div>
        <Label htmlFor={`followers-${platform}`} className="text-xs">
          {isStatus ? 'Average status views' : 'Approx. followers'} <span className="text-gray-400">(optional)</span>
        </Label>
        <Input id={`followers-${platform}`} type="number" min={0} value={entry?.followersCount ?? ''} onChange={(e) => onChange({ followersCount: e.target.value })} placeholder="e.g. 5000" className="mt-1 text-sm" />
      </div>
      <div>
        <Label className="text-xs">
          Screenshots <span className="text-red-500">*</span>
          <span className="text-gray-400 ml-1">{isStatus ? '(min 2 — show view count)' : '(min 1, max 3)'}</span>
        </Label>
        <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
          <Upload className="w-4 h-4" aria-hidden="true" />
          {screenshots.length < 3 ? 'Upload screenshot' : 'Max 3 reached'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {screenshots.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {screenshots.map((file, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(file)} alt={`Screenshot ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                <button type="button" onClick={() => onChange({ screenshots: screenshots.filter((_, idx) => idx !== i) })} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center" aria-label={`Remove screenshot ${i + 1}`}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {screenshots.length < minScreenshots && (
          <p className="text-xs text-amber-600 mt-1">{minScreenshots - screenshots.length} more screenshot{minScreenshots - screenshots.length !== 1 ? 's' : ''} required</p>
        )}
      </div>
    </div>
  );
};
