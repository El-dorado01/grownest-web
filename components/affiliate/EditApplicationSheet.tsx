'use client';
// EditApplicationSheet — full edit sheet for a PENDING affiliate application.
// Prefills all fields: promo note, social handles (handle, link, followers, screenshots).
// Allows adding new screenshots and removing existing ones.

import { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { affiliateApi } from '@/lib/affiliate-api';
import { toast } from 'sonner';
import { Upload, X, Check, ExternalLink, ImageIcon } from 'lucide-react';

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK:         'Facebook',
  INSTAGRAM:        'Instagram',
  X:                'X (Twitter)',
  WHATSAPP_CHANNEL: 'WhatsApp Channel',
  WHATSAPP_STATUS:  'WhatsApp Status',
  YOUTUBE:          'YouTube',
  TIKTOK:           'TikTok',
};

const FOLLOWERS_LABEL: Record<string, string> = {
  WHATSAPP_STATUS: 'Avg. status views',
  WHATSAPP_CHANNEL: 'Subscriber count',
  YOUTUBE: 'Subscriber count',
  default: 'Approx. followers',
};

interface HandleState {
  id: string;
  platform: string;
  handle: string;
  platformLink: string;
  followersCount: string;
  keepScreenshots: string[]; // existing URLs to keep
  newScreenshots: File[];    // newly selected files
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  affiliate: {
    promoNote?: string | null;
    socialHandles: Array<{
      id: string;
      platform: string;
      handle: string;
      platformLink?: string | null;
      followersCount?: number | null;
      screenshotUrls: string[];
    }>;
  };
}

// ─── Screenshot zone (single handle) ─────────────────────────────────────────
function HandleScreenshots({
  handleState,
  onChange,
}: {
  handleState: HandleState;
  onChange: (updated: Partial<HandleState>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(
      f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    const total = handleState.keepScreenshots.length + handleState.newScreenshots.length + valid.length;
    if (total > 3) {
      toast.error('Maximum 3 screenshots per platform');
      return;
    }
    onChange({ newScreenshots: [...handleState.newScreenshots, ...valid] });
  }, [handleState, onChange]);

  const removeExisting = (url: string) =>
    onChange({ keepScreenshots: handleState.keepScreenshots.filter(u => u !== url) });

  const removeNew = (idx: number) =>
    onChange({ newScreenshots: handleState.newScreenshots.filter((_, i) => i !== idx) });

  const totalCount = handleState.keepScreenshots.length + handleState.newScreenshots.length;
  const isStatus = handleState.platform === 'WHATSAPP_STATUS';
  const minRequired = isStatus ? 2 : 1;

  return (
    <div className="space-y-2">
      <Label className="text-xs">
        Screenshots
        <span className="text-destructive ml-0.5">*</span>
        <span className="text-muted-foreground ml-1.5 font-normal">
          (min {minRequired}, max 3)
          {isStatus && ' — show view count on 2+ statuses'}
        </span>
      </Label>

      {/* Existing screenshots */}
      {handleState.keepScreenshots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {handleState.keepScreenshots.map(url => (
            <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
              <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                aria-label="Remove screenshot"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New screenshots */}
      {handleState.newScreenshots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {handleState.newScreenshots.map((file, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-primary/40 group">
              <img src={URL.createObjectURL(file)} alt="New screenshot" className="w-full h-full object-cover" />
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
              <button
                type="button"
                onClick={() => removeNew(i)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                aria-label="Remove"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add more zone */}
      {totalCount < 3 && (
        <div
          onClick={() => ref.current?.click()}
          className="border-2 border-dashed border-muted-foreground/30 rounded-xl px-4 py-5 flex flex-col items-center gap-1.5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <Upload className="w-5 h-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">Click to add screenshots ({3 - totalCount} remaining)</p>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => addFiles(e.target.files)}
      />

      {totalCount < minRequired && (
        <p className="text-xs text-amber-600">{minRequired - totalCount} more required</p>
      )}
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────
export function EditApplicationSheet({ open, onClose, onSaved, affiliate }: Props) {
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const [promoNote, setPromoNote] = useState(affiliate.promoNote ?? '');

  const [handles, setHandles] = useState<HandleState[]>(
    affiliate.socialHandles.map(h => ({
      id:              h.id,
      platform:        h.platform,
      handle:          h.handle,
      platformLink:    h.platformLink ?? '',
      followersCount:  h.followersCount != null ? String(h.followersCount) : '',
      keepScreenshots: h.screenshotUrls ?? [],
      newScreenshots:  [],
    }))
  );

  const updateHandle = (id: string, patch: Partial<HandleState>) =>
    setHandles(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h));

  const isValid = handles.every(h => {
    const total = h.keepScreenshots.length + h.newScreenshots.length;
    const min = h.platform === 'WHATSAPP_STATUS' ? 2 : 1;
    return h.handle.trim() && total >= min;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('promoNote', promoNote);

      const handleUpdates = handles.map(h => ({
        id:             h.id,
        handle:         h.handle.trim(),
        platformLink:   h.platformLink.trim() || null,
        followersCount: h.followersCount ? parseInt(h.followersCount, 10) : null,
        keepScreenshots: h.keepScreenshots,
      }));
      formData.append('handleUpdates', JSON.stringify(handleUpdates));

      // Attach new screenshot files keyed by handle id
      for (const h of handles) {
        for (const file of h.newScreenshots) {
          formData.append(`screenshots_${h.id}`, file);
        }
      }

      const res = await affiliateApi.editMe(formData);
      if (res.error) {
        const msg = typeof res.error === 'string' ? res.error : 'Failed to save changes';
        toast.error(msg);
      } else {
        toast.success('Application updated successfully');
        onSaved();
        onClose();
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={`flex flex-col gap-0 p-0 bg-card border-border ${
          isMobile ? 'h-[92vh] rounded-t-2xl' : 'w-full sm:max-w-lg'
        }`}
      >
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="text-foreground">Edit Application</SheetTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Changes are only allowed while your application is Pending.
          </p>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

          {/* ── Section 1: Your Info ──────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Info</p>
            <div className="space-y-1.5">
              <Label htmlFor="edit-promo">
                How will you promote GrowNest?
                <span className="text-muted-foreground text-xs ml-1">(optional)</span>
              </Label>
              <Textarea
                id="edit-promo"
                value={promoNote}
                onChange={e => setPromoNote(e.target.value.slice(0, 300))}
                placeholder="e.g. I'll post weekly on my Instagram and WhatsApp status…"
                className="min-h-[100px] resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">{promoNote.length}/300</p>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* ── Section 2: Social Presence ────────────────────────────── */}
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Social Presence</p>

            {handles.map(h => (
              <div key={h.id} className="space-y-4 rounded-xl border border-border p-4 bg-muted/20">
                {/* Platform header */}
                <p className="text-sm font-semibold text-foreground">
                  {PLATFORM_LABELS[h.platform] ?? h.platform}
                </p>

                {/* Handle / URL */}
                <div className="space-y-1.5">
                  <Label htmlFor={`handle-${h.id}`} className="text-xs">
                    {h.platform === 'WHATSAPP_STATUS' ? 'Display name or phone' : 'Handle / URL'}
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id={`handle-${h.id}`}
                    value={h.handle}
                    onChange={e => updateHandle(h.id, { handle: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Followers + Link row */}
                <div className={`grid gap-3 ${h.platform === 'WHATSAPP_STATUS' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div className="space-y-1.5">
                    <Label htmlFor={`followers-${h.id}`} className="text-xs">
                      {FOLLOWERS_LABEL[h.platform] ?? FOLLOWERS_LABEL.default}
                      <span className="text-muted-foreground ml-1">(optional)</span>
                    </Label>
                    <Input
                      id={`followers-${h.id}`}
                      type="number"
                      min={0}
                      value={h.followersCount}
                      onChange={e => updateHandle(h.id, { followersCount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="h-10 text-sm"
                    />
                  </div>
                  {h.platform !== 'WHATSAPP_STATUS' && (
                    <div className="space-y-1.5">
                      <Label htmlFor={`link-${h.id}`} className="text-xs">
                        Profile link
                        <span className="text-muted-foreground ml-1">(optional)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id={`link-${h.id}`}
                          type="url"
                          value={h.platformLink}
                          onChange={e => updateHandle(h.id, { platformLink: e.target.value })}
                          placeholder="https://..."
                          className="h-10 text-sm pr-8"
                        />
                        {h.platformLink && (
                          <a
                            href={h.platformLink.startsWith('http') ? h.platformLink : `https://${h.platformLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Screenshots */}
                <HandleScreenshots
                  handleState={h}
                  onChange={patch => updateHandle(h.id, patch)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="w-full h-11 gap-2"
          >
            {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Save Changes</>}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
