'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/api';
import { affiliatePath } from '@/lib/affiliate-portal-path';

export function HeroCTA() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getAuthToken());
  }, []);

  if (loggedIn) {
    return (
      <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-semibold min-h-13 px-8 shadow-xl">
        <Link href={affiliatePath('/portal')}>
          <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-semibold min-h-13 px-8 shadow-xl">
      <Link href={affiliatePath('/apply')}>
        Apply Now <ArrowRight className="ml-2 w-4 h-4" />
      </Link>
    </Button>
  );
}

export function BottomCTA() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getAuthToken());
  }, []);

  if (loggedIn) {
    return (
      <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-semibold min-h-13 px-10 shadow-lg">
        <Link href={affiliatePath('/portal')}>
          <LayoutDashboard className="mr-2 w-4 h-4" /> Go to Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-semibold min-h-13 px-10 shadow-lg">
        <Link href={`/login?redirect=${encodeURIComponent(affiliatePath('/apply'))}`}>
          Apply Now <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white min-h-13 px-8 bg-transparent">
        <Link href={`/login?redirect=${encodeURIComponent(affiliatePath('/portal'))}`}>
          Log in first
        </Link>
      </Button>
    </>
  );
}
