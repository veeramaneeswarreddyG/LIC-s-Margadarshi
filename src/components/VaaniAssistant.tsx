'use client';

import { useState, useEffect, useCallback } from 'react';
import VaaniChat from './VaaniChat';
import VaaniTrigger from './VaaniTrigger';

interface SessionUser {
  uid: string;
  name?: string;
  phoneNumber?: string;
}

const SESSION_KEY = 'lic_margadarshi_session';

/**
 * VaaniAssistant — Global floating AI assistant
 *
 * Mounted once in layout.tsx — accessible from EVERY page.
 * Opens via:
 *   1. Clicking the FAB (VaaniTrigger)
 *   2. Custom event: window.dispatchEvent(new CustomEvent('openVaani'))
 *      (used by BottomNavigation on mobile)
 */
export default function VaaniAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  // Read user from sessionStorage after mount (client-only, SSR-safe)
  useEffect(() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem(SESSION_KEY) || 'null'
      ) as SessionUser | null;
      setUser(stored);
    } catch {
      setUser(null);
    }

    // Re-read user whenever sessionStorage changes (login/logout)
    const onStorage = () => {
      try {
        const stored = JSON.parse(
          sessionStorage.getItem(SESSION_KEY) || 'null'
        ) as SessionUser | null;
        setUser(stored);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Listen for openVaani custom event (fired by BottomNavigation)
  const handleOpenVaani = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener('openVaani', handleOpenVaani);
    return () => window.removeEventListener('openVaani', handleOpenVaani);
  }, [handleOpenVaani]);

  const toggle = () => setIsChatOpen(v => !v);
  const close  = () => setIsChatOpen(false);

  return (
    <>
      {/* Floating trigger button — fixed, always on top */}
      <VaaniTrigger isOpen={isChatOpen} onToggle={toggle} />

      {/* Chat panel — rendered only when open */}
      {isChatOpen && (
        <VaaniChat
          isOpen={isChatOpen}
          onClose={close}
          userId={user?.uid || 'guest'}
          userName={user?.name || 'Valued Customer'}
        />
      )}
    </>
  );
}
