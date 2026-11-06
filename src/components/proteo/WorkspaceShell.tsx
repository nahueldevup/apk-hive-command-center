import { Link } from '@tanstack/react-router';
import { FolderArchive, MapPin, PanelLeft, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function WorkspaceShell({ active, children }: { active: 'map' | 'apks'; children: ReactNode }) {
  return <div className="flex h-dvh overflow-hidden bg-background">
    <nav aria-label="Secciones" className="flex w-12 shrink-0 flex-col items-center gap-3 border-r border-sidebar-border bg-sidebar py-3 text-muted-foreground">
      <div className="grid size-8 place-items-center text-primary"><PanelLeft className="size-4" /></div>
      <div className="h-px w-6 bg-border" />
      <div title="CloudPhones" className="grid size-8 place-items-center"><Smartphone className="size-4" /></div>
      <Button asChild variant="ghost" size="icon" className={cn('size-8', active === 'map' && 'bg-sidebar-accent text-primary')}><Link to="/mapa" title="Mapa y Ubicaciones" aria-label="Mapa y Ubicaciones"><MapPin /></Link></Button>
      <Button asChild variant="ghost" size="icon" className={cn('size-8', active === 'apks' && 'bg-sidebar-accent text-primary')}><Link to="/apks" title="APKs y Archivos" aria-label="APKs y Archivos"><FolderArchive /></Link></Button>
      <span className="mt-auto font-mono text-[10px] text-primary">PM</span>
    </nav>
    <main className="flex min-w-0 flex-1 flex-col">{children}</main>
  </div>;
}