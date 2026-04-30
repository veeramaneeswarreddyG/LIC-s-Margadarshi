'use client';

import { useState } from 'react';
import VaaniChat from './VaaniChat';
import VaaniTrigger from './VaaniTrigger';

/**
 * VaaniAssistant Component
 * Manages the Vaani chat trigger and modal
 * Provides top-right floating icon to open/close chat
 */
export default function VaaniAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {/* Vaani Trigger Icon (Top Right) */}
      <VaaniTrigger isOpen={isChatOpen} onToggle={handleToggle} />

      {/* Vaani Chat Modal */}
      {isChatOpen && <VaaniChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
    </>
  );
}
