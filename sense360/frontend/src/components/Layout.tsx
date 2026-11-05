import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AlertRecord, onAlert } from '../lib/alerts';

const links = [
  ['/modes', 'Modes'], ['/vision', 'Vision'], ['/sound', 'Sound'],
  ['/wristband', 'Wristband'], ['/history', 'History'], ['/settings', 'Settings'],
];

export default function Layout() {
  const [banner, setBanner] = useState<AlertRecord | null>(null);
  useEffect(() => {
    let timer: number;
    const off = onAlert((a) => { setBanner(a); window.clearTimeout(timer); timer = window.setTimeout(() => setBanner(null), 5000); });
    return () => { off(); window.clearTimeout(timer); };
  }, []);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-teal focus:p-3 focus:text-ink">Skip to content</a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="text-xl font-bold tracking-tight">SENSE<span className="text-teal">360</span></NavLink>
          <nav aria-label="Main" className="flex flex-wrap gap-1">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 font-bold ${isActive ? 'bg-volt text-white' : 'text-slate-200 hover:bg-panel'}`}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      {banner && (
        <div role="alert" className="border-b border-teal bg-teal/15 px-4 py-3 text-center font-bold">
          {banner.label} · {Math.round(banner.confidence * 100)}%{' '}
          <span className={`badge ${banner.source === 'yamnet' ? 'badge-real' : 'badge-sim'}`}>{banner.source === 'yamnet' ? 'AI result' : banner.source === 'simulated' ? 'Simulated' : 'Test'}</span>
        </div>
      )}
      <main id="main" className="mx-auto max-w-5xl px-4 py-8"><Outlet /></main>
    </>
  );
}
