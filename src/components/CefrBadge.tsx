import React from 'react';
import { CefrLevel } from '../types';

export const CefrBadge: React.FC<{ level?: CefrLevel | string }> = ({ level = 'B1' }) => {
  const clean = String(level || 'B1').toUpperCase();
  const cls =
    clean === 'A1'
      ? 'cefr-A1'
      : clean === 'A2'
      ? 'cefr-A2'
      : clean === 'B2'
      ? 'cefr-B2'
      : 'cefr-B1';
  return <span className={`badge-pill ${cls}`}>{clean}</span>;
};

export const AppHeroBanner: React.FC<{
  imageSrc: string;
  alt: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ imageSrc, alt, eyebrow, title, subtitle, action }) => {
  return (
    <section className="hero-banner" aria-label={title}>
      <div className="hero-banner-media">
        <img src={imageSrc} alt={alt} />
        <div className="hero-banner-overlay stack-xs">
          {eyebrow ? (
            <span className="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.92, fontWeight: 700 }}>
              {eyebrow}
            </span>
          ) : null}
          <h2 className="section-title" style={{ color: '#FFFFFF', margin: 0 }}>
            {title}
          </h2>
          {subtitle ? (
            <p className="small" style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              {subtitle}
            </p>
          ) : null}
          {action ? <div style={{ paddingTop: 6 }}>{action}</div> : null}
        </div>
      </div>
    </section>
  );
};
