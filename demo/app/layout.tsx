import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter-loaded', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-loaded', display: 'swap' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif-loaded', display: 'swap' });

export const metadata: Metadata = {
  title: 'Sentinel AML — Explainable AI for Financial Crime Investigation',
  description: 'Transform suspicious financial activity into explainable, investigation-ready cases. Built for bank investigators and compliance teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${sourceSerif.variable}`}
    >
      <body className="font-sans antialiased bg-[var(--bg-canvas)] text-[var(--ink-primary)] min-h-screen">
        {children}
      </body>
    </html>
  );
}
