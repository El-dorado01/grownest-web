// components/affiliate/ReferralTools.tsx
'use client';
import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReferralToolsProps { affiliateCode: string; }

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://grownest.africa';

export const ReferralTools = ({ affiliateCode }: ReferralToolsProps) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `${BASE_URL}/signup?ref=${affiliateCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Join me on GrowNest and start saving smarter! Sign up here: ${referralLink}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const shareX = () => {
    const msg = encodeURIComponent(`Grow your savings with GrowNest Africa. Use my link: ${referralLink}`);
    window.open(`https://x.com/intent/tweet?text=${msg}`, '_blank');
  };

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Your Affiliate Code</p>
        <p className="text-2xl font-mono font-bold text-green-700 tracking-widest">{affiliateCode}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Your Referral Link</p>
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="text-sm font-mono" />
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy referral link" className="min-h-[44px] min-w-[44px] shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={shareWhatsApp} className="min-h-[44px] gap-2">
          <Share2 className="w-4 h-4" aria-hidden="true" /> Share on WhatsApp
        </Button>
        <Button variant="outline" onClick={shareX} className="min-h-[44px] gap-2">
          <Share2 className="w-4 h-4" aria-hidden="true" /> Share on X
        </Button>
      </div>
    </div>
  );
};
