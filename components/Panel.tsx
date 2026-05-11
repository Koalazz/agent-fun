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
    <div className={`panel flex flex-col ${active ? 'shadow-panelActive' : ''} ${className} ${scanlines ? 'scanlines' : ''}`}>
      <div className="panel-title-bar" style={active ? { background: '#f5a623' } : undefined} />
      <div className="panel-header shrink-0 flex-wrap gap-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-accent-amberBright">▸</span>
          <span className="truncate">{title}</span>
          {badge ? <span className="text-text-dim/70 normal-case tracking-normal shrink-0">[{badge}]</span> : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1">{actions}</div>
      </div>
      <div className={`relative z-10 flex-1 min-h-0 ${bodyClass}`}>{children}</div>
    </div>
  );
}
