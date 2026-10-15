import type { Metadata } from 'next';
import './globals.css';
import AdminLayoutShell from '@/components/AdminLayoutShell';

export const metadata: Metadata = {
  title: 'Anugruja Arts Studio — Admin Portal',
  description: 'Private admin portal for the Anugruja Arts Studio website.',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/logo-dark-gold-64.png', sizes: '64x64', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/images/logo-64.png', sizes: '64x64', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/images/logo-dark-gold-32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/images/logo-32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/images/logo-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const faviconScript = `(function(){
  try {
    var mql = window.matchMedia('(prefers-color-scheme: light)');
    function updateFavicon(isLight) {
      var links = document.querySelectorAll("link[rel*='icon']");
      links.forEach(function(l) {
        var h = l.getAttribute('href') || '';
        if (isLight) {
          if (h.indexOf('logo-64.png') !== -1) l.href = '/images/logo-dark-gold-64.png';
          if (h.indexOf('logo-32.png') !== -1) l.href = '/images/logo-dark-gold-32.png';
        } else {
          if (h.indexOf('logo-dark-gold-64.png') !== -1) l.href = '/images/logo-64.png';
          if (h.indexOf('logo-dark-gold-32.png') !== -1) l.href = '/images/logo-32.png';
        }
      });
    }
    if (mql.matches) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { updateFavicon(true); });
      } else {
        updateFavicon(true);
      }
    }
    if (mql.addEventListener) {
      mql.addEventListener('change', function(e) { updateFavicon(e.matches); });
    }
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: faviconScript }} />
      </head>
      <body className="antialiased bg-studio-dark text-zinc-100 selection:bg-studio-gold selection:text-studio-purple-dark">
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </body>
    </html>
  );
}
