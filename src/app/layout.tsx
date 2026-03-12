import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LandOwner — UK Property Ownership Search',
  description:
    'Search which companies own which properties across England and Wales, using HMLR Commercial & Corporate Ownership Data.',
  keywords: ['UK property', 'land registry', 'HMLR', 'property ownership', 'CCOD', 'land ownership'],
  openGraph: {
    title: 'LandOwner — UK Property Ownership Search',
    description: 'Discover who owns what across England and Wales.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
