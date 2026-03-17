import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'

import { UserProvider } from '@/lib/contexts/user-context'
import { cn } from '@/lib/utils'

import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

import AppSidebar from '@/components/app-sidebar'
import ArtifactRoot from '@/components/artifact/artifact-root'
import Header from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

const title = 'VISION'
const description = 'AI-powered research engine with Eagle orchestrator.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen flex flex-col font-sans antialiased overflow-hidden',
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <main className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
                  <ArtifactRoot>{children}</ArtifactRoot>
                </main>
              </div>
            </SidebarProvider>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
