'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Loader, BookOpen } from 'lucide-react';

interface VaaniMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'chart' | 'action' | 'plan';
}

interface VaaniChatProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  authToken?: string;
}

export default function VaaniChat({
  isOpen,
  onClose,
  conversationId = '',
  authToken = '',
}: VaaniChatProps) {
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<VaaniMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `🌟 नमस्ते! I'm LIC's Vaani, your intelligent financial assistant. I'm here to help you understand LIC policies, calculate premiums, compare plans, and guide you towards your financial goals.

How can I assist you today? Ask me about:
• Policy premiums and costs
• Maturity benefits and returns
• Plan comparisons
• Financial goals planning
• Claims and policy management`,
          timestamp: new Date(),
          type: 'text',
        },
      ]);
    }
  }, [isOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || !authToken) return;

    const userMessage: VaaniMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/vaani/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Simulate typing animation
        await new Promise(resolve => setTimeout(resolve, 800));

        const assistantMessage: VaaniMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.message,
          timestamp: new Date(),
          type: result.data.type || 'text',
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '❌ I encountered an error processing your request. Please try again.',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Sorry, I\'m having trouble connecting. Please check your internet and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Chat Panel - Liquid Glass */}
      <div
        className="fixed bottom-6 right-6 w-96 h-[600px] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold">
              V
            </div>
            <div>
              <h2 className="font-bold text-white">LIC's Vaani</h2>
              <p className="text-xs text-gray-300">Your Financial Guide ✨</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              style={{
                animation: `fadeIn 0.3s ease-in-out ${idx * 0.1}s both`,
              }}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-br-none'
                    : 'bg-white/10 text-gray-100 rounded-bl-none backdrop-blur-sm border border-white/20'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-3 rounded-xl rounded-bl-none backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0s' }}
                    />
                    <span
                      className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4 bg-black/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Vaani anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
            >
              {isLoading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Vaani Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => {}}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-40 animate-pulse-glow"
          style={{
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          <span className="text-2xl">💬</span>
        </button>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
          }
        }
      `}</style>
    </>
  );
}
