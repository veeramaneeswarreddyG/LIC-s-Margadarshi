'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarCtx { open: boolean; setOpen: (v: boolean) => void; }
const Ctx = createContext<SidebarCtx>({ open: true, setOpen: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => useContext(Ctx);
