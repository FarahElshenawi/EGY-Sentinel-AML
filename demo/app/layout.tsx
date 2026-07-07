import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Sentinel AML — Financial Investigation Console',
  description: 'A clear, evidence-backed investigation workspace for bank fraud teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} ${sourceSerif.variable}`}
    >
      <body className="font-sans antialiased bg-[var(--bg-app)] text-[var(--text-primary)] min-h-screen">
        <Sidebar />
        {/* Main content offset by sidebar width (64px) */}
        <div className="ml-[64px]">{children}</div>
      </body>
    </html>
  );
}
