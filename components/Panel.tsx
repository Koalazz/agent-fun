'use client';
import { ReactNode } from 'react';

interface Props {
  title: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  active?: boolean;
  bodyClass?: string;
  scanlines?: boolean;
}

export default function Panel({ title, badge, actions, children, className = '', active = false, bodyClass = '', scanlines = false }: Props) {
  return (
    <div className={`panel ${active ? 'shadow-panelActive' : ''} ${className} ${scanlines ? 'scanlines' : ''}`}>
      <div className="panel-title-bar" style={active ? { background: '#f5a623' } : undefined} />
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="text-accent-amberBright">▸</span>
          <span>{title}</span>
          {badge ? <span className="text-text-dim/70 normal-case tracking-normal">[{badge}]</span> : null}
        </div>
        <div className="flex items-center gap-1">{actions}</div>
      </div>
      <div className={`relative z-10 ${bodyClass}`}>{children}</div>
    </div>
  );
}
