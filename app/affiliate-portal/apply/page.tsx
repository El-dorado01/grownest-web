// app/affiliate-portal/apply/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SocialHandleCard, type SocialEntry } from '@/components/affiliate/SocialHandleCard';
import { affiliateApi } from '@/lib/affiliate-api';
import type { SocialPlatform } from '@/types/affiliate';

type Step = 1 | 2 | 3;

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: 'INSTAGRAM', label: 'Instagram' },
  { id: 'FACEBOOK', label: 'Facebook' },
  { id: 'X', label: 'X (Twitter)' },
  { id: 'WHATSAPP_CHANNEL', label: 'WhatsApp Channel' },
  { id: 'WHATSAPP_STATUS', label: 'WhatsApp Status' },
  { id: 'YOUTUBE', label: 'YouTube' },
  { id: 'TIKTOK', label: 'TikTok' },
];

export default function AffiliateApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [promoNote, setPromoNote] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [socialEntries, setSocialEntries] = useState<Record<SocialPlatform, SocialEntry>>({} as Record<SocialPlatform, SocialEntry>);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Gate: no token → send to login with redirect back to /apply
  // If already has affiliate record → send to dashboard
  useEffect(() => {
    const { getAuthToken } = require('@/lib/api');
    if (!getAuthToken()) {
      router.replace('/login?redirect=/apply');
      return;
    }
    affiliateApi.getMe().then((res) => {
      if (res.data?.affiliate) router.replace('/dashboard');
    }).catch(() => {}); // 404 = no affiliate yet, stay on page
  }, [router]);

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const updateEntry = (platform: SocialPlatform, data: Partial<SocialEntry>) => {
    setSocialEntries((prev) => ({
      ...prev,
      [platform]: {
        ...(prev[platform] ?? { platform, handle: '', platformLink: '', followersCount: '', screenshots: [] }),
        ...data,
      },
    }));
  };

  const canProceedStep2 = selectedPlatforms.length > 0 && selectedPlatforms.every((p) => {
    const entry = socialEntries[p];
    if (!entry?.handle?.trim()) return false;
    const minScreenshots = p === 'WHATSAPP_STATUS' ? 2 : 1;
    return entry.screenshots.length >= minScreenshots;
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('promoNote', promoNote);
      formData.append('agreedToTerms', 'true');
      const handles = selectedPlatforms.map((p) => {
        const e = socialEntries[p];
        return {
          platform: p,
          handle: e.handle,
          platformLink: e.platformLink || null,
          followersCount: e.followersCount ? parseInt(e.followersCount) : null,
        };
      });
      formData.append('socialHandles', JSON.stringify(handles));
      for (const platform of selectedPlatforms) {
        for (const file of socialEntries[platform]?.screenshots ?? []) {
          formData.append(`screenshots_${platform}`, file);
        }
      }
      await affiliateApi.apply(formData);
      router.push('/apply/success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Your Info', 'Social Presence', 'Review & Submit'];

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  step > i + 1 || step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  step === i + 1 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-foreground">Your Info</h1>
              <div>
                <Label htmlFor="promoNote">
                  How will you promote GrowNest?{' '}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="promoNote"
                  value={promoNote}
                  onChange={(e) => setPromoNote(e.target.value.slice(0, 300))}
                  placeholder="e.g. I'll post weekly on my Instagram and WhatsApp status to my 8k followers..."
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{promoNote.length}/300</p>
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full min-h-[44px]"
              >
                Continue
              </Button>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <h1 className="text-xl font-bold text-foreground">Your Social Presence</h1>
              <p className="text-sm text-muted-foreground">
                Select every platform you use, then fill in your details and upload at least one screenshot per platform.
              </p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePlatform(id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors min-h-[36px] ${
                      selectedPlatforms.includes(id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {selectedPlatforms.length === 0 && (
                <p className="text-xs text-amber-600">Select at least one platform to continue.</p>
              )}
              <div className="space-y-4">
                {selectedPlatforms.map((platform) => (
                  <SocialHandleCard
                    key={platform}
                    platform={platform}
                    entry={socialEntries[platform]}
                    onChange={(data) => updateEntry(platform, data)}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 min-h-[44px]">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 min-h-[44px]"
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <h1 className="text-xl font-bold text-foreground">Review & Submit</h1>
              {promoNote && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase mb-1">How you plan to promote</p>
                  <p className="text-sm text-foreground">{promoNote}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Social Platforms</p>
                <ul className="space-y-1">
                  {selectedPlatforms.map((p) => (
                    <li key={p} className="text-sm text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="font-medium">{PLATFORMS.find((pl) => pl.id === p)?.label}</span>
                      <span className="text-muted-foreground">— {socialEntries[p]?.handle}</span>
                      <span className="text-muted-foreground text-xs">
                        ({socialEntries[p]?.screenshots?.length ?? 0} screenshot
                        {(socialEntries[p]?.screenshots?.length ?? 0) !== 1 ? 's' : ''})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* T&C acceptance */}
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
                />
                <label htmlFor="terms" className="text-sm text-foreground cursor-pointer leading-relaxed">
                  I have read and agree to the{' '}
                  <a
                    href="https://grownest.africa/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline underline-offset-4 font-medium"
                  >
                    GrowNest Affiliate Terms &amp; Conditions
                  </a>
                  . I confirm that the information I have provided is accurate.
                </label>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 min-h-[44px]"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !agreedToTerms}
                  className="flex-1 min-h-[44px]"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
