// app/affiliate-portal/dashboard/application/page.tsx
'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { affiliateApi } from '@/lib/affiliate-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  CheckCircle2, ShieldX, Calendar, FileText,
  ExternalLink, ImageIcon, Users, Megaphone,
  ChevronLeft, ChevronRight, X, Trash2, Pencil, XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK:         'Facebook',
  INSTAGRAM:        'Instagram',
  X:                'X (Twitter)',
  WHATSAPP_CHANNEL: 'WhatsApp Channel',
  WHATSAPP_STATUS:  'WhatsApp Status',
  YOUTUBE:          'YouTube',
  TIKTOK:           'TikTok',
};

// ─── Screenshot Lightbox with nav arrows ─────────────────────────────────────
function ScreenshotLightbox({
  urls, startIndex, onClose,
}: {
  urls: string[]; startIndex: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(urls.length - 1, i + 1));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-black/95 border-white/10 p-0 overflow-hidden">
        <div className="relative flex flex-col">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Counter */}
          {urls.length > 1 && (
            <p className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-black/40 px-2 py-1 rounded-full z-10">
              {idx + 1} / {urls.length}
            </p>
          )}

          {/* Image */}
          <img
            src={urls[idx]}
            alt={`Screenshot ${idx + 1}`}
            className="w-full max-h-[80vh] object-contain"
          />

          {/* Nav arrows */}
          {urls.length > 1 && (
            <>
              <button
                onClick={prev}
                disabled={idx === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={next}
                disabled={idx === urls.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-1.5 py-3">
                {urls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`rounded-full transition-all ${i === idx ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/30'}`}
                    aria-label={`Go to screenshot ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Platform card ────────────────────────────────────────────────────────────
function PlatformCard({ handle }: { handle: any }) {
  const [lightboxStart, setLightboxStart] = useState<number | null>(null);
  const screenshots: string[] = handle.screenshotUrls ?? [];
  const followersLabel = handle.platform === 'WHATSAPP_STATUS' ? 'Avg. views' : 'Followers';

  return (
    <>
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-5 space-y-4">

          {/* A. Header row — Platform + Verification badge */}
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-foreground">
              {PLATFORM_LABELS[handle.platform] ?? handle.platform}
            </p>
            {handle.verifiedByAdmin ? (
              <Badge variant="outline" className="text-xs gap-1 border-emerald-400/50 bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-amber-400/40 bg-amber-500/10 text-amber-400">
                Pending review
              </Badge>
            )}
          </div>

          {/* B. Influence row — Clickable handle · followers */}
          <div className="flex items-center gap-2 flex-wrap">
            {handle.platformLink ? (
              <a
                href={handle.platformLink.startsWith('http') ? handle.platformLink : `https://${handle.platformLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline underline-offset-4 font-medium text-sm"
              >
                {handle.handle}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : (
              <span className="text-sm font-medium text-primary">{handle.handle}</span>
            )}

            {handle.followersCount != null && (
              <>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {handle.followersCount.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{followersLabel}</span>
                </span>
              </>
            )}
          </div>

          {/* C. Proof gallery — large images, 2-col grid, lightbox on click */}
          {screenshots.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" />
                Screenshots ({screenshots.length})
              </p>
              <div className={`grid gap-2 ${screenshots.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {screenshots.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightboxStart(i)}
                    className="group relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label={`View screenshot ${i + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No screenshots uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxStart !== null && (
        <ScreenshotLightbox
          urls={screenshots}
          startIndex={lightboxStart}
          onClose={() => setLightboxStart(null)}
        />
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApplicationStatusPage() {
  const { data, isLoading } = useSWR('affiliate/me', () => affiliateApi.getMe());
  const affiliate = data?.data?.affiliate;

  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [editOpen,    setEditOpen]    = useState(false);
  const [editNote,    setEditNote]    = useState('');
  const [saving,      setSaving]      = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await affiliateApi.deleteMe();
    if (res.error) {
      toast.error(typeof res.error === 'string' ? res.error : 'Failed to delete application');
    } else {
      toast.success('Application deleted. You may re-apply at any time.');
      await mutate('affiliate/me');
      window.location.replace('/apply');
    }
    setDeleting(false);
    setDeleteOpen(false);
  };

  const handleEdit = async () => {
    setSaving(true);
    const res = await affiliateApi.editMe({ promoNote: editNote });
    if (res.error) {
      toast.error(typeof res.error === 'string' ? res.error : 'Failed to save changes');
    } else {
      toast.success('Application updated successfully');
      await mutate('affiliate/me');
      setEditOpen(false);
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 md:px-6 py-6 space-y-5">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="w-full px-4 md:px-6 py-20 text-center">
        <p className="text-muted-foreground">No application found.</p>
      </div>
    );
  }

  const STATUS = {
    PENDING:   { title: 'Under review',     desc: 'Our team is reviewing your application. You will be notified within 48 hours.',                                        icon: Calendar,    ring: 'border-amber-400/30 bg-amber-500/10',   iconColor: 'text-amber-400' },
    ACTIVE:    { title: 'Approved & active', desc: 'Your application is approved. Share your referral link to start earning.',                                             icon: CheckCircle2, ring: 'border-emerald-400/30 bg-emerald-500/10', iconColor: 'text-emerald-400' },
    SUSPENDED: { title: 'Account suspended', desc: 'Your account has been suspended. Please contact support for details.',                                                 icon: ShieldX,     ring: 'border-red-400/30 bg-red-500/10',        iconColor: 'text-red-400' },
    REJECTED:  { title: 'Application not approved', desc: 'Your application was not approved this time. You are welcome to re-apply after addressing the feedback.', icon: XCircle,     ring: 'border-red-400/30 bg-red-500/10',        iconColor: 'text-red-400' },
  };
  const s = STATUS[affiliate.status as keyof typeof STATUS] ?? STATUS.PENDING;
  const Icon = s.icon;
  const isPending = affiliate.status === 'PENDING';

  return (
    <>
    <div className="w-full px-4 md:px-6 py-6 space-y-8">

      {/* Page title + actions */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Application</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full details of your affiliate program application.</p>
        </div>
        {/* Only PENDING applications can be edited or deleted */}
        {isPending && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => { setEditNote(affiliate.promoNote ?? ''); setEditOpen(true); }}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        )}
        {/* REJECTED — offer to re-apply */}
        {affiliate.status === 'REJECTED' && (
          <Button size="sm" className="h-8 text-xs" onClick={() => window.location.replace('/apply')}>
            Re-apply
          </Button>
        )}
      </div>

      {/* ── 1. THE VERDICT ───────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${s.ring}`}>
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.iconColor}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-foreground">{s.title}</p>
            <Badge variant="outline" className={`text-xs ${
              affiliate.status === 'ACTIVE' ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-400' :
              affiliate.status === 'SUSPENDED' ? 'border-red-400/40 bg-red-500/10 text-red-400' :
              'border-amber-400/40 bg-amber-500/10 text-amber-400'
            }`}>
              {affiliate.status.charAt(0) + affiliate.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{s.desc}</p>
          {affiliate.approvedAt && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Approved {format(new Date(affiliate.approvedAt), 'dd MMM yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* ── 2. THE SNAPSHOT (3 info cards) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Affiliate Code</p>
            <p className="text-lg font-mono font-bold text-primary tracking-wider">{affiliate.affiliateCode}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Applied</p>
            <p className="text-base font-semibold text-foreground">{format(new Date(affiliate.createdAt), 'dd MMM yyyy')}</p>
          </CardContent>
        </Card>
        {affiliate.campaign ? (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                <Megaphone className="w-2.5 h-2.5" /> Campaign
              </p>
              <p className="text-sm font-bold text-primary truncate">{affiliate.campaign.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {affiliate.campaign.commissionType === 'FIXED'
                  ? `${fmt(affiliate.campaign.commissionValue)} per referral`
                  : `${affiliate.campaign.commissionValue}% of first deposit`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground">No campaign assigned yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── 3. THE INFLUENCE (Social platforms) ──────────────────────────── */}
      {affiliate.socialHandles?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Social Presence
                <span className="text-xs font-normal text-muted-foreground">({affiliate.socialHandles.length} platform{affiliate.socialHandles.length !== 1 ? 's' : ''})</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Visual proof of audience reach and engagement</p>
            </div>
          </div>
          <div className="space-y-4">
            {affiliate.socialHandles.map((handle: any) => (
              <PlatformCard key={handle.id} handle={handle} />
            ))}
          </div>
        </div>
      )}

      {/* Separator between Influence and Strategy */}
      {affiliate.promoNote && affiliate.socialHandles?.length > 0 && (
        <div className="flex items-center gap-4">
          <Separator className="flex-1 bg-border/50" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Strategy</span>
          <Separator className="flex-1 bg-border/50" />
        </div>
      )}

      {/* ── 4. THE STRATEGY (Promo note) ─────────────────────────────────── */}
      {affiliate.promoNote && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            How you plan to promote
          </h2>
          <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 rounded-xl px-4 py-4 border border-border/50">
            {affiliate.promoNote}
          </p>
        </div>
      )}
    </div>

    {/* ── Delete confirmation dialog ────────────────────────────────── */}
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your application?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your affiliate application. You can re-apply at any time, but your current affiliate code will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {deleting ? 'Deleting…' : 'Delete Application'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* ── Edit promo note dialog ────────────────────────────────────── */}
    <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit your application</AlertDialogTitle>
          <AlertDialogDescription>
            You can update your promotion note while your application is still under review.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-1 pb-2">
          <Textarea
            value={editNote}
            onChange={e => setEditNote(e.target.value.slice(0, 300))}
            placeholder="How will you promote GrowNest?"
            className="min-h-[120px] resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{editNote.length}/300</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
