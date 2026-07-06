// lib/affiliate-portal-path.ts
//
// The affiliate portal is served from two different mount points:
//   - affiliate.grownest.africa/*         (proxy.ts rewrites root-relative
//     paths like /portal, /apply to /affiliate-portal/* transparently)
//   - grownest.africa/affiliate-portal/*  (the same pages, reached directly
//     on the main domain — proxy.ts allowlists this prefix as public)
//
// Every internal link/redirect inside the affiliate portal must resolve
// correctly on BOTH mount points. Use this helper instead of hardcoding
// root-relative paths like '/portal' or '/apply'.
export function affiliatePath(path: string): string {
  if (typeof window === 'undefined') return `/affiliate-portal${path}`;
  const isSubdomain = window.location.hostname.startsWith('affiliate.');
  return isSubdomain ? path : `/affiliate-portal${path}`;
}
