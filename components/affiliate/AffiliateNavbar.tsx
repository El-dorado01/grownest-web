"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowRight, LogOut, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getAuthToken, clearAuthTokens } from "@/lib/api";
import { useProfile } from "@/hooks/use-profile";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Who can join?", href: "/#who-can-join" },
  { label: "FAQ",           href: "/#faq" },
];

export function AffiliateNavbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [isLoggedIn,  setIsLoggedIn]  = useState<boolean>(() => !!getAuthToken());

  const { profile } = useProfile(isLoggedIn);
  const firstName = profile?.fullName?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? null;

  // Check auth token on mount (client-only)
  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    clearAuthTokens();
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
        className={cn(
          "w-full max-w-5xl rounded-full px-5 py-3 transition-all duration-300",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border border-border shadow-lg"
            : "bg-transparent"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Logo + badge */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo.png"
              alt="GrowNest"
              width={110}
              height={32}
              className={cn("h-8 w-auto transition-all duration-300", !scrolled && "brightness-0 invert")}
            />
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold hidden sm:inline-flex transition-colors duration-300",
                scrolled
                  ? "border-primary/40 text-primary"
                  : "border-white/50 text-white bg-white/10"
              )}
            >
              Affiliate
            </Badge>
          </Link>

          {/* Desktop links — only show on public pages */}
          {!isLoggedIn && (
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    scrolled ? "text-foreground/70 hover:text-foreground" : "text-white/80 hover:text-white drop-shadow"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              // Logged-in state: show name + dashboard link + sign out
              <>
                {firstName && (
                  <span className={cn("text-sm font-medium transition-colors duration-200",
                    scrolled ? "text-foreground/80" : "text-white/90 drop-shadow")}>
                    Hi, {firstName}
                  </span>
                )}
                <Link
                  href="/portal"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-95",
                    scrolled
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white text-primary hover:bg-white/90"
                  )}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    scrolled ? "text-foreground/50 hover:text-foreground" : "text-white/60 hover:text-white"
                  )}
                >
                  Sign out
                </button>
              </>
            ) : (
              // Logged-out state: Log in + Apply Now
              <>
                <Link
                  href="/login?redirect=/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    scrolled ? "text-foreground/70 hover:text-foreground" : "text-white/80 hover:text-white drop-shadow"
                  )}
                >
                  Log in
                </Link>
                <Link
                  href="/login?redirect=/dashboard"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold shadow-md transition-all duration-150 active:scale-95",
                    scrolled
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white text-primary hover:bg-white/90"
                  )}
                >
                  Apply Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-[4.5rem] right-4 left-4 rounded-2xl border border-border p-4 shadow-xl bg-card"
          >
            <nav className="flex flex-col gap-1">
              {!isLoggedIn && NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}

              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
                {isLoggedIn ? (
                  <>
                    {firstName && (
                      <p className="px-4 py-1 text-sm font-semibold text-foreground">Hi, {firstName} 👋</p>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" /> Go to Dashboard
                    </Link>
                    <button
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-center"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login?redirect=/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/login?redirect=/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
