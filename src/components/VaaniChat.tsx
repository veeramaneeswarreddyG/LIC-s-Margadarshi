'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader, Sparkles, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';

/* ─── Types ─────────────────────────────────────────────── */
interface VaaniMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'action' | 'plan' | 'error';
}
interface VaaniChatProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
}
type VoiceState = 'idle' | 'listening' | 'speaking';

/* ─── Waveform bars (animated) ───────────────────────────── */
function WaveBars({ active, color = '#a78bfa' }: { active: boolean; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[0, 0.15, 0.3, 0.15, 0].map((delay, i) => (
        <span key={i} style={{
          display: 'inline-block',
          width: 3, borderRadius: 2,
          background: color,
          height: active ? undefined : 6,
          animation: active ? `vaaniWave 0.8s ease-in-out ${delay}s infinite` : 'none',
        }} />
      ))}
    </span>
  );
}

/* ─── Component ──────────────────────────────────────────── */
export default function VaaniChat({ isOpen, onClose, userId = 'guest', userName = 'Valued Customer' }: VaaniChatProps) {
  const [messages, setMessages] = useState<VaaniMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const { progress, policies } = useUserData();

  /* Voice state */
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [sttAvailable, setSttAvailable] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [interimText, setInterimText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /* ── Feature detection ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSttAvailable(!!SR);
    setTtsAvailable(!!window.speechSynthesis);
    synthRef.current = window.speechSynthesis || null;
  }, []);

  /* ── Init conversation + welcome ── */
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    const cid = `vaani-${userId}-${Date.now()}`;
    setConversationId(cid);
    setMessages([{
      id: 'welcome', role: 'assistant', timestamp: new Date(), type: 'text',
      content: `🌟 **Namaste, ${userName}!** I'm **LIC's Vaani**, your personal insurance assistant.\n\nI can help you with:\n• 📋 Understanding LIC plans & premiums\n• 💰 Maturity benefits & returns\n• ⚖️ Comparing different policies\n• 🎯 Finding the right plan for your goals\n• 📞 Claims & policy management\n\nYou can **type** or use the 🎤 **mic button** to speak!\nAapki seva mein hoon! How can I help you today?`,
    }]);
  }, [isOpen, userId, userName]);

  /* ── Reset on close ── */
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopSpeaking();
      setMessages([]);
      setInput('');
      setInterimText('');
      setConversationId('');
      setVoiceState('idle');
    }
  }, [isOpen]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Focus input ── */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  /* ── TTS helper ── */
  const speakText = useCallback((text: string) => {
    if (!isTTSEnabled || !synthRef.current) return;
    stopSpeaking();
    // Strip markdown for cleaner speech
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/[•▸→]/g, '').replace(/\n+/g, '. ');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = 'en-IN';
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.volume = 1;
    // Pick a natural voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en-IN'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setVoiceState('speaking');
    utt.onend = () => setVoiceState('idle');
    utt.onerror = () => setVoiceState('idle');
    utteranceRef.current = utt;
    synthRef.current.speak(utt);
    setVoiceState('speaking');
  }, [isTTSEnabled]);

  function stopSpeaking() {
    synthRef.current?.cancel();
    utteranceRef.current = null;
    setVoiceState('idle');
  }

  /* ── STT helpers ── */
  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopSpeaking();
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => { setVoiceState('listening'); setInterimText(''); };

    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final.trim()) {
        setInput(final.trim());
        setInterimText('');
        setTimeout(() => sendMessage(final.trim()), 150);
      }
    };

    rec.onerror = (e: any) => {
      setVoiceState('idle');
      setInterimText('');
      if (e.error === 'no-speech') {
        setInput('');
      } else if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please allow mic permission and try again.');
      }
    };

    rec.onend = () => {
      setVoiceState(v => v === 'listening' ? 'idle' : v);
      setInterimText('');
    };

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceState('idle');
    setInterimText('');
  }

  function toggleMic() {
    if (voiceState === 'listening') stopListening();
    else if (voiceState === 'speaking') { stopSpeaking(); startListening(); }
    else startListening();
  }

  /* ── Send message ── */
  const sendMessage = useCallback(async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: VaaniMessage = { id: Date.now().toString(), role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setInterimText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch('/api/vaani/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: trimmed, 
          conversationId, 
          userId, 
          userData: {
            name: userName,
            progress,
            policiesCount: policies.length
          }
        }),
      });
      const result = await res.json();
      await new Promise(r => setTimeout(r, 500));

      if (result.success) {
        if (result.conversationId) setConversationId(result.conversationId);
        const assistantMsg: VaaniMessage = {
          id: (Date.now() + 1).toString(), role: 'assistant',
          content: result.data.message, timestamp: new Date(), type: result.data.type || 'text',
        };
        setMessages(prev => [...prev, assistantMsg]);
        // Speak response if TTS enabled
        if (isTTSEnabled) speakText(result.data.message);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', timestamp: new Date(), type: 'error',
        content: "⚠️ I'm having trouble connecting right now. Please try again in a moment!",
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      if (voiceState !== 'speaking') setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, conversationId, userId, userName, isTTSEnabled, speakText, voiceState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── Markdown renderer ── */
  const renderContent = (content: string) => {
    const parts = content.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong>
        : part.split('\n').map((line, j, arr) => (
            <React.Fragment key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
          ))
    );
  };

  if (!isOpen) return null;

  /* ── Voice button style helper ── */
  const micBg = voiceState === 'listening'
    ? 'linear-gradient(135deg,#ef4444,#dc2626)'
    : voiceState === 'speaking'
      ? 'linear-gradient(135deg,#22c55e,#16a34a)'
      : 'rgba(255,255,255,0.1)';

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />

      {/* Chat Panel */}
      <div id="vaani-chat-panel" style={{
        position: 'fixed', bottom: 100, right: 24, width: 400, height: 600,
        borderRadius: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'linear-gradient(145deg, rgba(15,17,26,0.98) 0%, rgba(22,27,45,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2)',
        animation: 'vaaniSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.1) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          {/* Avatar */}
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(139,92,246,0.4)', flexShrink: 0, position: 'relative' }}>
            <Sparkles size={18} color="white" />
            {voiceState === 'speaking' && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '2px solid rgba(34,197,94,0.6)', animation: 'vaaniPingGreen 1s ease-out infinite' }} />}
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>LIC's Vaani</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: voiceState === 'listening' ? '#ef4444' : voiceState === 'speaking' ? '#22c55e' : '#22c55e', display: 'inline-block', flexShrink: 0, animation: voiceState !== 'idle' ? 'vaaniDotPulse 1s ease-in-out infinite' : 'none' }} />
              {voiceState === 'listening' ? 'Listening...' : voiceState === 'speaking' ? 'Speaking...' : 'Powered by Gemini AI'}
            </div>
          </div>

          {/* TTS toggle */}
          {ttsAvailable && (
            <button
              onClick={() => { setIsTTSEnabled(v => !v); if (voiceState === 'speaking') stopSpeaking(); }}
              title={isTTSEnabled ? 'Mute voice output' : 'Enable voice output'}
              style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: isTTSEnabled ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
            >
              {isTTSEnabled ? <Volume2 size={14} color="#a78bfa" /> : <VolumeX size={14} color="rgba(255,255,255,0.35)" />}
            </button>
          )}

          {/* Mic toggle */}
          {sttAvailable && (
            <button
              onClick={toggleMic}
              title={voiceState === 'listening' ? 'Stop listening' : 'Start voice input'}
              style={{
                width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)',
                background: micBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s', flexShrink: 0, position: 'relative',
                boxShadow: voiceState === 'listening' ? '0 0 0 3px rgba(239,68,68,0.3)' : voiceState === 'speaking' ? '0 0 0 3px rgba(34,197,94,0.3)' : 'none',
              }}
            >
              {voiceState === 'listening'
                ? <WaveBars active color="#fff" />
                : voiceState === 'speaking'
                  ? <WaveBars active color="#fff" />
                  : <Mic size={14} color="rgba(255,255,255,0.7)" />}
            </button>
          )}

          {/* Close */}
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
            <X size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* ── Listening Banner ── */}
        {voiceState === 'listening' && (
          <div style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'vaaniDotPulse 0.8s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 }}>
              {interimText || 'Listening… speak now'}
            </span>
            <WaveBars active color="#ef4444" />
          </div>
        )}

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'vaaniFadeIn 0.25s ease-out' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 7, marginTop: 4 }}>
                  <Bot size={13} color="white" />
                </div>
              )}
              <div style={{
                maxWidth: '80%', padding: '9px 13px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : msg.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                border: msg.role === 'user' ? 'none' : msg.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.09)',
                color: msg.role === 'user' ? '#fff' : 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 1.6,
              }}>
                <div>{renderContent(msg.content)}</div>
                <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4, textAlign: 'right' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {/* Speak this message button */}
              {msg.role === 'assistant' && ttsAvailable && (
                <button onClick={() => speakText(msg.content)} title="Read aloud" style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4, marginTop: 4, flexShrink: 0, transition: 'all 0.15s' }}>
                  <Volume2 size={11} color="rgba(255,255,255,0.35)" />
                </button>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={13} color="white" />
              </div>
              <div style={{ padding: '9px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6', animation: `vaaniBounce 1.2s ease-in-out ${delay}s infinite`, display: 'inline-block' }} />
                ))}
              </div>
            </div>
          )}

          {/* Quick chips */}
          {messages.length === 1 && !isLoading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {['💰 Calculate premium', '📋 Suggest a plan', '⚖️ Compare plans', '📞 Claims process'].map(chip => (
                <button key={chip} onClick={() => { setInput(chip.slice(3)); setTimeout(() => sendMessage(chip.slice(3)), 100); }}
                  style={{ padding: '5px 11px', borderRadius: 20, border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}>
                  {chip}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div style={{ padding: '10px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              value={interimText || input}
              onChange={e => { setInput(e.target.value); setInterimText(''); }}
              onKeyDown={handleKeyDown}
              placeholder={voiceState === 'listening' ? '🎤 Listening…' : 'Ask Vaani anything about LIC...'}
              disabled={isLoading || voiceState === 'listening'}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 12, fontSize: 13, outline: 'none',
                border: voiceState === 'listening' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.11)',
                background: voiceState === 'listening' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.07)',
                color: interimText ? 'rgba(255,255,255,0.55)' : 'white',
                transition: 'all 0.2s', fontStyle: interimText ? 'italic' : 'normal',
              }}
            />
            <button onClick={() => sendMessage()} disabled={isLoading || (!input.trim() && !interimText)}
              style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: (input.trim() && !isLoading) ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flexShrink: 0 }}>
              {isLoading ? <Loader size={15} color="rgba(255,255,255,0.5)" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} color={input.trim() ? 'white' : 'rgba(255,255,255,0.3)'} />}
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 7 }}>
            LIC's Vaani · Gemini AI {sttAvailable ? '· 🎤 Voice ready' : ''} · Not financial advice
          </div>
        </div>
      </div>

      {/* ── Animations ── */}
      <style>{`
        @keyframes vaaniSlideIn { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes vaaniFadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes vaaniBounce  { 0%,80%,100%{transform:scale(0.7);opacity:0.5} 40%{transform:scale(1.1);opacity:1} }
        @keyframes vaaniWave    { 0%,100%{height:4px} 50%{height:14px} }
        @keyframes vaaniDotPulse{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes vaaniPingGreen{ 0%{transform:scale(0.9);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @media(max-width:767px){
          #vaani-chat-panel{bottom:80px!important;right:0!important;left:0!important;width:100%!important;height:72vh!important;border-radius:24px 24px 0 0!important;}
        }
      `}</style>
    </>
  );
}
