import './globals.css';

export const metadata = {
  title: 'Inventory Management',
  description: 'Manage your inventory',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
