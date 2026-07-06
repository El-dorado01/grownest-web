// app/affiliate-portal/apply/page.tsx
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { affiliateApi } from '@/lib/affiliate-api';
import { legalApi } from '@/lib/legal-api';
import { affiliatePath } from '@/lib/affiliate-portal-path';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SocialPlatform } from '@/types/affiliate';
import { AffiliateNavbar } from '@/components/affiliate/AffiliateNavbar';
import { AffiliateFooter } from '@/components/affiliate/AffiliateFooter';
import {
  Check, Upload, X, CheckCircle2, AlertCircle, FileText,
  User, ClipboardCheck, Sparkles,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type SocialEntry = {
  handle: string;
  platformLink: string;
  followersCount: string;
  screenshots: File[];
};

type Step = 1 | 2 | 3;

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS: { id: SocialPlatform; label: string; placeholder: string; followersLabel: string }[] = [
  { id: 'INSTAGRAM',        label: 'Instagram',         placeholder: '@yourhandle',            followersLabel: 'followers' },
  { id: 'FACEBOOK',         label: 'Facebook',           placeholder: 'https://facebook.com/…', followersLabel: 'followers' },
  { id: 'X',                label: 'X (Twitter)',        placeholder: '@yourhandle',            followersLabel: 'followers' },
  { id: 'WHATSAPP_CHANNEL', label: 'WhatsApp Channel',  placeholder: 'https://wa.me/channel/…', followersLabel: 'Subscriber count' },
  { id: 'WHATSAPP_STATUS',  label: 'WhatsApp Status',   placeholder: 'Your display name',      followersLabel: 'Avg. status views' },
  { id: 'YOUTUBE',          label: 'YouTube',            placeholder: 'https://youtube.com/…',  followersLabel: 'Subscriber count' },
  { id: 'TIKTOK',           label: 'TikTok',             placeholder: '@yourhandle',            followersLabel: 'followers' },
];

const EMPTY_ENTRY: SocialEntry = { handle: '', platformLink: '', followersCount: '', screenshots: [] };

function minScreenshots(p: SocialPlatform) { return p === 'WHATSAPP_STATUS' ? 2 : 1; }

function isComplete(p: SocialPlatform, entry?: SocialEntry): boolean {
  if (!entry?.handle?.trim()) return false;
  return entry.screenshots.length >= minScreenshots(p);
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function StepBar({ step, labels }: { step: Step; labels: string[] }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors duration-300 ${
            step > i + 1 ? 'bg-primary text-primary-foreground' :
            step === i + 1 ? 'bg-primary text-primary-foreground' :
            'bg-muted text-muted-foreground'
          }`}>
            {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block transition-colors duration-300 ${step === i + 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            {label}
          </span>
          {i < labels.length - 1 && <div className="flex-1 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <img
          src={url}
          alt="Screenshot preview"
          className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Screenshot upload zone ───────────────────────────────────────────────────

function ScreenshotZone({
  platform, screenshots, onChange,
}: {
  platform: SocialPlatform;
  screenshots: File[];
  onChange: (files: File[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const min = minScreenshots(platform);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(
      f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    onChange([...screenshots, ...valid].slice(0, 3));
  }, [screenshots, onChange]);

  const remove = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    onChange(screenshots.filter((_, idx) => idx !== i));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (screenshots.length < 3) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  };

  return (
    <>
      {previewUrl && <ImageLightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />}

      <div className="space-y-3">
        {/* Drop zone */}
        <div
          onClick={() => screenshots.length < 3 && ref.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 text-center transition-all duration-200 ${
            screenshots.length >= 3
              ? 'border-border bg-muted/20 cursor-not-allowed opacity-60'
              : isDragOver
                ? 'border-primary bg-primary/10 cursor-copy scale-[1.01]'
                : 'border-muted-foreground/30 bg-muted/10 cursor-pointer hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {screenshots.length >= 3 ? 'Maximum 3 screenshots uploaded' : 'Click or drag screenshots here'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Minimum {min} · Max 3 · JPG, PNG, WEBP · 5 MB each
            </p>
          </div>
          {screenshots.length > 0 && screenshots.length < min && (
            <p className="text-xs text-amber-600 font-medium mt-1">
              {min - screenshots.length} more screenshot{min - screenshots.length !== 1 ? 's' : ''} required
            </p>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        {/* Thumbnail grid */}
        {screenshots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {screenshots.map((file, i) => {
              const url = URL.createObjectURL(file);
              return (
                <div
                  key={i}
                  className="relative aspect-square animate-in fade-in zoom-in-95 duration-200 group cursor-zoom-in"
                  onClick={() => setPreviewUrl(url)}
                >
                  <img
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-border transition-opacity group-hover:opacity-80"
                  />
                  {/* Hover hint */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded-full">Preview</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => remove(e, i)}
                    className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
                    aria-label={`Remove screenshot ${i + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Platform overlay (Sheet) ─────────────────────────────────────────────────

function PlatformSheet({
  platform, entry, onSave, onClose,
}: {
  platform: SocialPlatform | null;
  entry: SocialEntry;
  onSave: (p: SocialPlatform, e: SocialEntry) => void;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<SocialEntry>(entry);
  const cfg = PLATFORMS.find(p => p.id === platform);
  const isStatus = platform === 'WHATSAPP_STATUS';

  // Sync draft when platform changes
  const openChanged = platform;
  useState(() => { setDraft(entry); });

  if (!platform || !cfg) return null;

  const canSave = draft.handle.trim().length > 0 && draft.screenshots.length >= minScreenshots(platform);

  const handleSave = () => {
    if (!canSave) return;
    onSave(platform, draft);
    onClose();
  };

  return (
    <Sheet open={!!platform} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={`flex flex-col gap-0 p-0 ${isMobile ? 'h-[88vh] rounded-t-2xl' : 'w-full sm:max-w-md'}`}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground">
            {cfg.label} Details
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fill in your {cfg.label} details and upload screenshots showing your profile.
          </p>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Handle */}
          <div className="space-y-1.5">
            <Label htmlFor="handle">
              {isStatus ? 'Display name or phone' : 'Handle / URL'}
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="handle"
              value={draft.handle}
              onChange={e => setDraft(d => ({ ...d, handle: e.target.value }))}
              placeholder={cfg.placeholder}
              className="h-11"
              autoFocus
            />
          </div>

          {/* Followers + Link row */}
          <div className={`grid gap-4 ${isStatus ? '' : 'sm:grid-cols-2'}`}>
            <div className="space-y-1.5">
              <Label htmlFor="followers">
                {cfg.followersLabel}
                {/* <span className="text-muted-foreground text-xs ml-1">(optional)</span> */}
              </Label>
              <Input
                id="followers"
                type="number"
                min={0}
                value={draft.followersCount}
                onChange={e => setDraft(d => ({ ...d, followersCount: e.target.value }))}
                placeholder="e.g. 5000"
                className="h-11"
              />
            </div>
            {!isStatus && (
              <div className="space-y-1.5">
                <Label htmlFor="link">
                  Profile link
                  {/* <span className="text-muted-foreground text-xs ml-1">(optional)</span> */}
                </Label>
                <Input
                  id="link"
                  type="url"
                  value={draft.platformLink}
                  onChange={e => setDraft(d => ({ ...d, platformLink: e.target.value }))}
                  placeholder="https://…"
                  className="h-11"
                />
              </div>
            )}
          </div>

          {/* Screenshots */}
          <div className="space-y-1.5">
            <Label>
              Screenshots
              <span className="text-destructive ml-0.5">*</span>
              {isStatus && (
                <span className="text-muted-foreground text-xs ml-1">
                  — show the eye icon view count on 2+ recent statuses
                </span>
              )}
            </Label>
            <ScreenshotZone
              platform={platform}
              screenshots={draft.screenshots}
              onChange={screenshots => setDraft(d => ({ ...d, screenshots }))}
            />
          </div>
        </div>

        {/* Footer CTA */}
        <SheetFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-11 gap-2"
          >
            <Check className="w-4 h-4" />
            Save {cfg.label} Details
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Platform chip ────────────────────────────────────────────────────────────

function PlatformChip({
  platform, label, isSelected, isCompleted,
  onToggle, onOpen,
}: {
  platform: SocialPlatform; label: string;
  isSelected: boolean; isCompleted: boolean;
  onToggle: () => void; onOpen: () => void;
}) {
  if (!isSelected) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-border bg-background text-foreground hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 min-h-[40px]"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0 rounded-full overflow-hidden border min-h-[40px] transition-all duration-300 border-primary">
      {/* Main area — click to open/edit */}
      <button
        type="button"
        onClick={onOpen}
        className={`flex items-center gap-1.5 pl-3.5 pr-2 py-2 text-sm font-medium transition-all duration-300 ${
          isCompleted
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {isCompleted
          ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          : <AlertCircle className="w-3.5 h-3.5 shrink-0 opacity-70" />
        }
        {label}
      </button>
      {/* Remove button */}
      <button
        type="button"
        onClick={onToggle}
        className={`px-2 py-2 h-full flex items-center transition-all duration-300 ${
          isCompleted
            ? 'bg-primary/80 text-primary-foreground hover:bg-primary/60'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
        aria-label={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AffiliateApplyPage() {
  const [step, setStep] = useState<Step>(1);
  const [promoNote, setPromoNote] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [socialEntries, setSocialEntries] = useState<Partial<Record<SocialPlatform, SocialEntry>>>({});
  const [openPlatform, setOpenPlatform] = useState<SocialPlatform | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [noCampaignDialog, setNoCampaignDialog] = useState(false);
  const [waitlistJoining, setWaitlistJoining] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const router = useRouter();

  // Auth gate: redirect to login if no token, redirect to dashboard if already an affiliate
  useEffect(() => {
    const { getAuthToken } = require('@/lib/api');
    if (!getAuthToken()) {
      router.replace(`/login?redirect=${encodeURIComponent(affiliatePath('/apply'))}`);
      return;
    }
    affiliateApi.getMe().then((res) => {
      if (res.data?.affiliate) router.replace(affiliatePath('/portal'));
    }).catch(() => {});
  }, [router]);

  const togglePlatform = (platform: SocialPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(prev => prev.filter(p => p !== platform));
    } else {
      setSelectedPlatforms(prev => [...prev, platform]);
      setOpenPlatform(platform); // auto-open sheet when selecting
    }
  };

  const saveEntry = (platform: SocialPlatform, entry: SocialEntry) => {
    setSocialEntries(prev => ({ ...prev, [platform]: entry }));
  };

  const canProceedStep2 = selectedPlatforms.length > 0 &&
    selectedPlatforms.every(p => isComplete(p, socialEntries[p]));

  const completedCount = selectedPlatforms.filter(p => isComplete(p, socialEntries[p])).length;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('promoNote', promoNote);
      formData.append('agreedToTerms', '1'); // coerced to true by backend
      const handles = selectedPlatforms.map(p => {
        const e = socialEntries[p]!;
        // Only include optional fields when they have a value — never send null
        const entry: Record<string, unknown> = { platform: p, handle: e.handle.trim() };
        if (e.platformLink?.trim()) entry.platformLink = e.platformLink.trim();
        if (e.followersCount?.trim()) entry.followersCount = parseInt(e.followersCount, 10);
        return entry;
      });
      const handlesJson = JSON.stringify(handles);
      console.log('[Affiliate Apply] socialHandles being sent:', handles);
      console.log('[Affiliate Apply] socialHandles JSON:', handlesJson);
      formData.append('socialHandles', handlesJson);
      for (const platform of selectedPlatforms) {
        for (const file of socialEntries[platform]?.screenshots ?? []) {
          formData.append(`screenshots_${platform}`, file);
        }
      }
      const res = await affiliateApi.apply(formData);

      // Log full response to browser console for debugging
      console.log('[Affiliate Apply] API response:', res);

      if (res.error) {
        console.error('[Affiliate Apply] Error:', res.error, '| HTTP status:', res.status);

        // No active campaign — show opt-in dialog instead of a generic error
        if ((res as any).canJoinWaitlist || (res as any).code === 'NO_ACTIVE_CAMPAIGN' || res.status === 503) {
          setNoCampaignDialog(true);
          return;
        }

        // res.error can be a string or a Zod fieldErrors object — always extract a readable string
        let msg: string;
        if (typeof res.error === 'string') {
          msg = res.error;
        } else if (typeof res.error === 'object') {
          const fe = (res.error as any).fieldErrors ?? {};
          const fieldMsgs = Object.entries(fe)
            .flatMap(([field, msgs]) => (msgs as string[]).map(m => `${field}: ${m}`));
          const formMsgs = ((res.error as any).formErrors ?? []) as string[];
          msg = [...fieldMsgs, ...formMsgs].join(' · ') || 'Submission failed. Please try again.';
        } else {
          msg = 'Submission failed. Please try again.';
        }

        setError(msg);
        return;
      }

      console.log('[Affiliate Apply] Success — affiliate created:', res.data?.affiliate?.affiliateCode);
      legalApi.accept('AFFILIATE_TERMS').catch(() => {});
      setShowSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Your Info', 'Social Presence', 'Review & Submit'];
  const STEP_META = [
    { icon: User,          title: 'Your Info',         desc: 'Tell us how you plan to promote GrowNest.' },
    { icon: Sparkles,      title: 'Social Presence',   desc: 'Add the platforms where you engage your audience.' },
    { icon: ClipboardCheck, title: 'Review & Submit',  desc: 'Confirm your details and submit your application.' },
  ];

  return (
    <>
      <AffiliateNavbar />
      <div className="min-h-screen bg-background">
        {/* Page hero */}
        <div className="relative overflow-hidden bg-linear-to-br from-secondary via-primary/90 to-primary text-white pt-28 pb-12 px-4 text-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <Badge className="bg-white/15 text-white border-white/20 text-xs font-semibold tracking-widest uppercase mb-4">
            Affiliate Application
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Apply to become an affiliate</h1>
          <p className="text-white/70 text-base max-w-md mx-auto">
            Complete the 3-step form below. Applications are reviewed within 48 hours.
          </p>

          {/* Step pills */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            {STEP_META.map((s, i) => (
              <div
                key={s.title}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                  step === i + 1
                    ? 'bg-white text-primary border-white shadow-md'
                    : step > i + 1
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/10 text-white/50 border-white/20'
                }`}
              >
                {step > i + 1
                  ? <Check className="w-3.5 h-3.5" />
                  : <s.icon className="w-3.5 h-3.5" />
                }
                {s.title}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-10">
          <StepBar step={step} labels={stepLabels} />

        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 space-y-6">

          {/* ── Step 1: Your Info ──────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Your Info</h2>
                  <p className="text-xs text-muted-foreground">Step 1 of 3</p>
                </div>
              </div>

              {/* Info callout */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-foreground/80 leading-relaxed">
                💡 This helps our team understand how you plan to introduce GrowNest to your audience.
                Be specific — a strong answer speeds up approval.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promoNote">
                  How will you promote GrowNest?{' '}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="promoNote"
                  value={promoNote}
                  onChange={e => setPromoNote(e.target.value.slice(0, 300))}
                  placeholder="e.g. I post weekly savings tips on my Instagram (@handle, 8k followers) and WhatsApp status. I'll share how GrowNest helped me grow my savings and include my referral link in every post..."
                  className="min-h-[140px] resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground text-right">{promoNote.length}/300</p>
              </div>

              <Button onClick={() => setStep(2)} className="w-full h-11 gap-2">
                Continue to Social Presence <Check className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* ── Step 2: Social Presence (Hub & Overlay) ────────────────── */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-xl font-bold text-foreground">Your Social Presence</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap a platform to add it. A form will open for you to fill in details.
                </p>
              </div>

              {/* Platform chip grid */}
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label }) => (
                  <PlatformChip
                    key={id}
                    platform={id}
                    label={label}
                    isSelected={selectedPlatforms.includes(id)}
                    isCompleted={isComplete(id, socialEntries[id])}
                    onToggle={() => togglePlatform(id)}
                    onOpen={() => setOpenPlatform(id)}
                  />
                ))}
              </div>

              {/* Progress summary */}
              {selectedPlatforms.length > 0 ? (
                <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{completedCount}</span>
                    {' '}of{' '}
                    <span className="font-semibold text-foreground">{selectedPlatforms.length}</span>
                    {' '}platform{selectedPlatforms.length !== 1 ? 's' : ''} completed
                  </p>
                  {completedCount < selectedPlatforms.length && (
                    <p className="text-xs text-amber-600 font-medium">
                      Tap a chip to fill remaining details
                    </p>
                  )}
                  {completedCount === selectedPlatforms.length && (
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All done!
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">Select at least one platform above to continue.</p>
                </div>
              )}

              {/* Completed platforms summary list */}
              {selectedPlatforms.length > 0 && (
                <div className="space-y-2">
                  {selectedPlatforms.map(p => {
                    const cfg = PLATFORMS.find(pl => pl.id === p)!;
                    const entry = socialEntries[p];
                    const done = isComplete(p, entry);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setOpenPlatform(p)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-primary/10' : 'bg-muted'}`}>
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-primary" />
                              : <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {done
                                ? `${entry!.handle} · ${entry!.screenshots.length} screenshot${entry!.screenshots.length !== 1 ? 's' : ''}`
                                : 'Tap to fill in details'
                              }
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          {done ? 'Edit' : 'Fill in →'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">Back</Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1 h-11">Continue</Button>
              </div>
            </>
          )}

          {/* ── Step 3: Review & Submit ────────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Review & Submit</h2>
                  <p className="text-xs text-muted-foreground">Step 3 of 3 — almost there!</p>
                </div>
              </div>

              {/* Summary card */}
              <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border overflow-hidden">
                {promoNote && (
                  <div className="px-4 py-4">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Promo Note
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{promoNote}</p>
                  </div>
                )}
                <div className="px-4 py-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Social Platforms ({selectedPlatforms.length})
                  </p>
                  <div className="space-y-2.5">
                    {selectedPlatforms.map(p => {
                      const cfg = PLATFORMS.find(pl => pl.id === p)!;
                      const entry = socialEntries[p]!;
                      return (
                        <div key={p} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{entry.handle}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {entry.screenshots.length} screenshot{entry.screenshots.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 space-y-1.5">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">What happens next?</p>
                <ul className="text-sm text-foreground/80 space-y-1 leading-relaxed">
                  <li>✅ Our team reviews your application within 48 hours</li>
                  <li>📩 You'll receive an email notification once approved</li>
                  <li>🔗 Access your unique referral link from the dashboard</li>
                </ul>
              </div>

              {/* T&C */}
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
                />
                <label htmlFor="terms" className="text-sm text-foreground cursor-pointer leading-relaxed">
                  I have read and agree to the{' '}
                  <a href="/affiliate-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                    GrowNest Affiliate Terms &amp; Conditions
                  </a>
                  . I confirm that the information I have provided is accurate.
                </label>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} disabled={submitting} className="flex-1 h-11">Back</Button>
                <Button onClick={handleSubmit} disabled={submitting || !agreedToTerms} className="flex-1 h-11 gap-2">
                  {submitting ? 'Submitting…' : <><Check className="w-4 h-4" /> Submit Application</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

      <AffiliateFooter />

      {/* ── Platform overlay sheet ─────────────────────────────────────── */}
      <PlatformSheet
        key={openPlatform ?? 'none'}
        platform={openPlatform}
        entry={socialEntries[openPlatform!] ?? EMPTY_ENTRY}
        onSave={saveEntry}
        onClose={() => setOpenPlatform(null)}
      />

      {/* ── No Campaign — waitlist opt-in dialog ───────────────────────── */}
      {noCampaignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-amber-500" />
            </div>

            {/* Copy */}
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-foreground">No open campaigns right now</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                GrowNest affiliate campaigns open periodically. Want us to notify you the moment a new campaign launches so you can apply immediately?
              </p>
            </div>

            {/* Success state */}
            {waitlistJoined ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground text-center">
                  You're on the list! We'll notify you when a campaign opens.
                </p>
                <button
                  onClick={() => setNoCampaignDialog(false)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setWaitlistJoining(true);
                    await affiliateApi.leaveCampaignWaitlist();
                    setWaitlistJoining(false);
                    setWaitlistJoined(false);
                  }}
                  disabled={waitlistJoining}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  {waitlistJoining ? 'Removing…' : "Changed your mind? Leave the waitlist"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={async () => {
                    setWaitlistJoining(true);
                    const res = await affiliateApi.joinCampaignWaitlist();
                    setWaitlistJoining(false);
                    if (res.error) {
                      // Already on waitlist or error — just show success
                    }
                    setWaitlistJoined(true);
                  }}
                  disabled={waitlistJoining}
                  className="w-full h-11 gap-2"
                >
                  {waitlistJoining ? 'Saving…' : '🔔 Yes, notify me when a campaign opens'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setNoCampaignDialog(false)}
                  className="w-full h-11 text-muted-foreground"
                >
                  No thanks
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Application submitted success dialog ───────────────────────── */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm text-center gap-0 p-8 [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">Application Submitted!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for applying to the GrowNest Affiliate Program. Our team will review your
                application and get back to you within 48 hours.
              </p>
            </div>
            <Button
              className="w-full h-11 mt-2"
              onClick={() => { window.location.href = '/portal/application'; }}
            >
              View My Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
