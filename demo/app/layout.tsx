import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'EGY-Sentinel AML — Financial Surveillance',
  description: 'AI-Powered Financial Surveillance & Fraud Intelligence System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased bg-surface text-surface-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
