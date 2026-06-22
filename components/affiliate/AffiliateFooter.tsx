import Image from "next/image";
import Link from "next/link";
import { FaTwitter, FaInstagram, FaWhatsapp, FaFacebookF } from "react-icons/fa";

const LINKS = {
  Affiliate: [
    { label: "How it works",       href: "/#how-it-works" },
    { label: "Apply Now",          href: "/login?redirect=/apply" },
    { label: "Affiliate Dashboard",href: "/login?redirect=/dashboard" },
    { label: "Partner Tiers",      href: "/#tiers" },
  ],
  GrowNest: [
    { label: "About GrowNest",    href: "https://grownest.africa" },
    { label: "NestPurse",         href: "https://grownest.africa" },
    { label: "NestEggs",          href: "https://grownest.africa" },
    { label: "NestBaskets",       href: "https://grownest.africa" },
  ],
  Legal: [
    { label: "Privacy Policy",    href: "#" },
    { label: "Terms of Service",  href: "#" },
    { label: "Affiliate T&Cs",    href: "#" },
    { label: "Security",          href: "#" },
  ],
};

const CONTACT = [
  { label: "support@grownest.africa", href: "mailto:support@grownest.africa" },
  { label: "+234 705 329 0027",       href: "tel:+2347053290027" },
  { label: "Km 13 DSC Express-Way, Otokutu, Delta State", href: "#" },
];

const SOCIALS = [
  { icon: FaTwitter,   label: "Twitter / X", href: "https://x.com/Grownestafrica" },
  { icon: FaInstagram, label: "Instagram",   href: "https://www.instagram.com/grownest.africa" },
  { icon: FaWhatsapp,  label: "WhatsApp",    href: "https://wa.me/message/3E3BWQIR5Y3OL1" },
  { icon: FaFacebookF, label: "Facebook",    href: "https://www.facebook.com/share/1HJ4BJTj8R/" },
];

export function AffiliateFooter() {
  return (
    <footer className="bg-[#1A1408] border-t border-white/5">
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-8">

        {/* Brand row — full width at top */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4 max-w-xs">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="GrowNest" width={100} height={100} className=" opacity-90" />
              {/* <span className="text-white font-bold text-lg tracking-tight opacity-90">GrowNest</span> */}
            </div>
            <p className="text-sm leading-relaxed text-white/40">
              Africa&apos;s savings and financial growth platform. Share. Earn. Grow.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/40 hover:border-primary/60 hover:text-primary transition-colors"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Contact block — sits next to brand on desktop */}
          <div className="flex flex-col gap-2 sm:text-right">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 sm:text-right">Contact</h4>
            {CONTACT.map(({ label, href }) => {
              const isExternal = /^(mailto:|tel:|https?:)/.test(href);
              const cls = "text-sm text-white/50 hover:text-white transition-colors leading-relaxed";
              return (
                <div key={label}>
                  {isExternal
                    ? <a href={href} className={cls}>{label}</a>
                    : <span className={cls}>{label}</span>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 mb-12">
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => {
                  const isExternal = /^(mailto:|tel:|https?:)/.test(href);
                  const cls = "text-sm text-white/50 hover:text-white transition-colors";
                  return (
                    <li key={label}>
                      {isExternal
                        ? <a href={href} className={cls}>{label}</a>
                        : <Link href={href} className={cls}>{label}</Link>
                      }
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5" />

        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} GrowNest Africa. All rights reserved.
          </p>
          <p className="text-xs text-white/25">
            Secured · Licensed · Built for Africa 🌍
          </p>
        </div>

      </div>
    </footer>
  );
}
