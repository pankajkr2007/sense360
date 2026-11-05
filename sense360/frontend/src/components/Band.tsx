export default function Band({ vibrating, connected }: { vibrating: boolean; connected: boolean }) {
  return (
    <svg viewBox="0 0 240 200" role="img" aria-label={`Virtual wristband, ${connected ? 'simulated connection active' : 'not connected'}${vibrating ? ', vibrating' : ''}`} className="mx-auto w-64 max-w-full">
      <g className={vibrating ? 'buzz' : ''}>
        <rect x="88" y="4" width="64" height="62" rx="10" fill="#1b2a52" stroke="#24376B" strokeWidth="3" />
        <rect x="88" y="134" width="64" height="62" rx="10" fill="#1b2a52" stroke="#24376B" strokeWidth="3" />
        <rect x="52" y="58" width="136" height="84" rx="22" fill="#0b1630" stroke={connected ? '#14D8C4' : '#475a8f'} strokeWidth="4" />
        <rect x="64" y="70" width="112" height="60" rx="14" fill={vibrating ? '#14D8C4' : '#3B82FF'} opacity={vibrating ? 0.9 : 0.35} />
        <circle cx="120" cy="100" r="9" fill={connected ? '#14D8C4' : '#64748b'} />
      </g>
      {vibrating && [0, 1].map((i) => (
        <g key={i} fill="none" stroke="#14D8C4" strokeWidth="3" strokeLinecap="round">
          <path d={`M${36 - i * 14} 84 Q${24 - i * 14} 100 ${36 - i * 14} 116`} />
          <path d={`M${204 + i * 14} 84 Q${216 + i * 14} 100 ${204 + i * 14} 116`} />
        </g>
      ))}
    </svg>
  );
}
