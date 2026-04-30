import type { Metadata } from 'next'
import './globals.css'
import I18nProvider from '@/components/I18nProvider'
import ClientAuthProvider from '@/components/AuthProvider'
import { ThemeProvider } from '@/context/ThemeContext'
import { SidebarProvider } from '@/context/SidebarContext'

export const metadata: Metadata = {
  title: 'LIC Margadarshi – Your Policy Advisor',
  description: 'Manage your LIC policies, explore plans, and get real-time updates. All in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ transition: 'background 0.3s, color 0.3s' }}>
        <I18nProvider />
        <ThemeProvider>
          <SidebarProvider>
            <ClientAuthProvider>
              {children}
            </ClientAuthProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
