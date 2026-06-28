'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/Toaster';
import { CommandPalette } from '@/components/CommandPalette';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
      <CommandPalette />
      <Toaster />
    </NextAuthSessionProvider>
  );
}
