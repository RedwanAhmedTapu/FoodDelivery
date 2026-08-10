import type { Metadata } from 'next';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ChatWidget } from '@/components/chat/ChatWidget';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Foodie-Bite-Alpha — Food delivery, tracked door to door',
  description: 'Order from the best local stores near you, with live delivery tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
