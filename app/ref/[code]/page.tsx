// app/ref/[code]/page.tsx
// Handles referral link clicks: logs the click to the backend, then redirects to signup.
// URL: grownest.africa/ref/GN-ABC123 → logs click → /signup?ref=GN-ABC123
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function RefRedirectPage({ params }: Props) {
  const { code } = await params;

  // Fire-and-forget click tracking via fetch (server-side)
  // Non-blocking: if it fails, the redirect still happens
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.grownest.africa';
    await fetch(`${apiBase}/api/affiliate/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliateCode: code }),
      // Short timeout so slow backend doesn't delay the redirect
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Silently ignore — never let tracking break the user's experience
  }

  redirect(`/signup?ref=${code}`);
}
