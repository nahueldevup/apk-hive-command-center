import { lazy, Suspense, useMemo, useState } from 'react';
import { ClientOnly } from '@tanstack/react-router';
import { MapPin, Plus, Search, Pin, Star, LocateFixed, Smartphone, ArrowRight, Check, Trash2, Pencil, Folder, Settings2, Globe2, Crosshair, X, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WorkspaceShell } from './WorkspaceShell';
import { GROUPS, LOCATIONS, INITIAL_ASSIGNMENTS, canAssign, validateLocation, removeGroup, type Location, type LocationGroup, type GroupColor } from '@/lib/locations';
import { PHONES } from '@/lib/proteo-mock';
import { cn } from '@/lib/utils';

const LocationMap = lazy(() => import('./LocationMap'));
const colorText: Record<GroupColor, string> = { primary: 'text-primary', success: 'text-success', warning: 'text-warning', rose: 'text-map-rose' };
const colorBg: Record<GroupColor, string> = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', rose: 'bg-map-rose' };
const coords = (l: Location) => `${l.latitude.toFixed(6)}, ${l.longitude.toFixed(6)}`;
const emptyLocation = (lat = -34.603722, lng = -58.381592): Location => ({ id: '', name: '', city: '', latitude: lat, longitude: lng, altitude: 25, accuracy: 4.2, timezone: 'America/Argentina/Buenos_Aires', group_id: '', is_pinned: false });

export function LocationsWorkspace() {
  const [locations, setLocations] = useState(LOCATIONS);
  const [groups, setGroups] = useState(GROUPS);
  const [selectedId, setSelectedId] = useState('ba');
  const [defaultId, setDefaultId] = useState<string | null>('ba');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [fitKey, setFitKey] = useState(0);
  const [centerKey, setCenterKey] = useState(0);
  const [draft, setDraft] = useState<Location | null>(null);
  const [draftDefault, setDraftDefault] = useState(false);
  const [error, setError] = useState('');
  const [groupDialog, setGroupDialog] = useState(false);
  const [groupDraft, setGroupDraft] = useState<LocationGroup>({ id: '', name: '', description: '', color: 'success' });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'location' | 'group'; id: string; name: string } | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [assigning, setAssigning] = useState(false);
  const [mobileView, setMobileView] = useState<'catalog' | 'map' | 'details'>('map');
  const selected = locations.find(l => l.id === selectedId) ?? null;
  const activeGroup = groups.find(g => g.id === selected?.group_id);
  const visible = useMemo(() => locations.filter(l => (filter === 'all' || (filter === 'pinned' ? l.is_pinned : l.group_id === filter)) && `${l.name} ${l.city}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [locations, filter, query]);
  const pinned = locations.filter(l => l.is_pinned);
  const online = PHONES.filter(p => p.online);
  const assignedHere = PHONES.filter(p => assignments[p.id] === selectedId).length;
  const select = (id: string) => { setSelectedId(id); setTargets([]); };
  const openDraft = (l: Location) => { setDraft(l); setDraftDefault(l.id === defaultId && !!l.id); setError(''); };
  const togglePin = (id: string) => setLocations(ls => ls.map(l => l.id === id ? { ...l, is_pinned: !l.is_pinned } : l));
  const setDefault = (id: string) => { setDefaultId(id); toast.success('Ubicación predeterminada actualizada en el prototipo'); };
  const saveLocation = () => {
    if (!draft) return;
    const issue = validateLocation(draft); if (issue) { setError(issue); return; }
    const saved = { ...draft, name: draft.name.trim(), city: draft.city.trim(), id: draft.id || crypto.randomUUID() };
    setLocations(ls => draft.id ? ls.map(l => l.id === draft.id ? saved : l) : [...ls, saved]);
    if (draftDefault) setDefaultId(saved.id); else if (defaultId === saved.id) setDefaultId(null);
    select(saved.id); setDraft(null); setMobileView('details'); toast.success('Ubicación guardada');
  };
  const assign = async () => {
    if (!selected || assigning) return;
    const ids = targets.filter(canAssign); if (!ids.length) return;
    const locationId = selected.id; setAssigning(true);
    await new Promise(resolve => setTimeout(resolve, 650));
    setAssignments(a => ({ ...a, ...Object.fromEntries(ids.map(id => [id, locationId])) }));
    setAssigning(false); setTargets([]); toast.success(`Simulación completada: ${ids.length} CloudPhone${ids.length > 1 ? 's' : ''}`);
  };
  const saveGroup = () => {
    if (!groupDraft.name.trim()) return;
    const saved = { ...groupDraft, name: groupDraft.name.trim(), id: groupDraft.id || crypto.randomUUID() };
    setGroups(gs => groupDraft.id ? gs.map(g => g.id === saved.id ? saved : g) : [...gs, saved]);
    setGroupDraft({ id: '', name: '', description: '', color: 'success' }); toast.success('Grupo guardado');
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'location') {
      setLocations(ls => ls.filter(l => l.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) select(locations.find(l => l.id !== deleteTarget.id)?.id ?? '');
      if (defaultId === deleteTarget.id) setDefaultId(null);
      setAssignments(a => Object.fromEntries(Object.entries(a).filter(([, id]) => id !== deleteTarget.id)));
    } else { setGroups(gs => gs.filter(g => g.id !== deleteTarget.id)); setLocations(ls => removeGroup(ls, deleteTarget.id)); if (filter === deleteTarget.id) setFilter('all'); }
    setDeleteTarget(null); toast.success('Eliminado del prototipo');
  };
  return <WorkspaceShell active="map">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div><h1 className="flex items-center gap-2 font-mono text-base font-semibold"><MapPin className="size-4 text-primary" /> Mapa y Ubicaciones</h1><p className="mt-1 text-xs text-muted-foreground">ProteoMesh <span className="mx-1.5 text-border">/</span> Geolocalización</p></div>
      <div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-success" />{online.length}/{PHONES.length} online</span><span className="border-l border-border pl-3 text-[11px] text-warning">Datos de ejemplo</span><Button size="sm" onClick={() => openDraft(emptyLocation())}><Plus />Nueva ubicación</Button></div>
    </header>
    <div className="flex border-b border-border p-1 lg:hidden">{([['catalog', 'Ubicaciones'], ['map', 'Mapa'], ['details', 'Asignar']] as const).map(([value, text]) => <Button key={value} variant={mobileView === value ? 'secondary' : 'ghost'} size="sm" className="flex-1" onClick={() => setMobileView(value)}>{text}</Button>)}</div>
    <div className="flex min-h-0 flex-1">
      <aside className={cn('w-full shrink-0 flex-col border-r border-border bg-surface lg:flex lg:w-64 xl:w-72', mobileView === 'catalog' ? 'flex' : 'hidden')}>
        <div className="flex items-center justify-between px-4 pb-2 pt-4"><h2 className="text-xs font-semibold uppercase tracking-wider">Catálogo</h2><span className="font-mono text-xs text-muted-foreground">{locations.length} ubicaciones</span></div>
        <div className="relative mx-3 mb-3"><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input aria-label="Buscar ubicaciones" placeholder="Nombre o ciudad…" value={query} onChange={e => setQuery(e.target.value)} className="h-8 bg-background pl-8 text-xs" /></div>
        <div className="flex gap-1 px-3 pb-3"><Button size="sm" className="flex-1" variant={filter === 'all' ? 'secondary' : 'ghost'} onClick={() => setFilter('all')}>Todas <span className="font-mono text-muted-foreground">{locations.length}</span></Button><Button size="sm" className="flex-1" variant={filter === 'pinned' ? 'secondary' : 'ghost'} onClick={() => setFilter('pinned')}><Pin className="size-3" />Fijadas <span className="font-mono text-muted-foreground">{pinned.length}</span></Button></div>
        <div className="border-y border-border px-3 py-2"><div className="mb-1 flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Grupos</span><Button variant="ghost" size="icon" className="size-6 text-muted-foreground" title="Gestionar grupos" aria-label="Gestionar grupos" onClick={() => setGroupDialog(true)}><Settings2 /></Button></div>
          <div className="space-y-0.5">{groups.map(g => <Button key={g.id} variant="ghost" className={cn('h-7 w-full justify-start px-2 text-xs', filter === g.id && 'bg-accent')} onClick={() => setFilter(filter === g.id ? 'all' : g.id)}><span className={cn('size-1.5 rounded-full', colorBg[g.color])} /><span className="flex-1 truncate text-left">{g.name}</span><span className="font-mono text-muted-foreground">{locations.filter(l => l.group_id === g.id).length}</span></Button>)}</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {!visible.length && <div className="px-4 py-8 text-center text-xs text-muted-foreground">No hay ubicaciones en esta vista.<Button variant="link" size="sm" onClick={() => { setQuery(''); setFilter('all'); }}>Limpiar filtros</Button></div>}
          {visible.map(l => { const g = groups.find(g => g.id === l.group_id); return <div key={l.id} className={cn('group relative mx-2 mb-1 rounded-md border border-transparent', selectedId === l.id ? 'border-primary/30 bg-primary/10' : 'hover:bg-surface-2')}>
            <Button variant="ghost" className="h-auto min-h-20 w-full justify-start gap-2.5 whitespace-normal px-3 py-3 pr-8 hover:bg-transparent" onClick={() => { select(l.id); setMobileView('map'); }}>
              <MapPin className={cn('shrink-0', g ? colorText[g.color] : 'text-muted-foreground')} /><span className="min-w-0 flex-1 text-left"><span className="flex items-center gap-1.5 text-xs font-medium"><span className="truncate">{l.name}</span>{defaultId === l.id && <Star className="size-3 shrink-0 fill-warning text-warning" />}</span><span className="mt-1 block truncate text-[11px] font-normal text-muted-foreground">{l.city}</span><span className="mt-1.5 block font-mono text-[10px] font-normal text-muted-foreground">{l.latitude.toFixed(4)}, {l.longitude.toFixed(4)}</span></span>
            </Button><Button variant="ghost" size="icon" className={cn('absolute right-1 top-2 size-6', l.is_pinned ? 'text-primary' : 'text-muted-foreground opacity-40 group-hover:opacity-100')} aria-label={`${l.is_pinned ? 'Desfijar' : 'Fijar'} ${l.name}`} title="Acceso rápido" onClick={() => togglePin(l.id)}><Pin className={cn('size-3', l.is_pinned && 'fill-primary/20')} /></Button>
          </div>; })}
        </div>
        <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5 text-warning"><Star className="size-3" />Predeterminada</span><span className="mt-1 block truncate text-foreground">{locations.find(l => l.id === defaultId)?.name ?? 'Sin ubicación predeterminada'}</span></div>
      </aside>

      <section className={cn('relative isolate min-w-0 flex-1 flex-col lg:flex', mobileView === 'map' ? 'flex' : 'hidden')}>
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3 text-xs"><span className="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground"><Globe2 className="size-3.5 shrink-0 text-primary" />OpenStreetMap<ChevronRight className="size-3" /><span className="truncate text-foreground">{selected?.city ?? 'Mapa mundial'}</span></span><Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground" onClick={() => setFitKey(k => k + 1)} title="Ver todas las ubicaciones"><LocateFixed />Ver todas</Button></div>
        <div className="relative min-h-56 flex-1 overflow-hidden bg-surface-2">
          <ClientOnly fallback={<MapLoading />}><Suspense fallback={<MapLoading />}><LocationMap locations={visible} groups={groups} selected={selected} onSelect={select} onPick={(lat, lng) => openDraft(emptyLocation(lat, lng))} fitKey={fitKey} centerKey={centerKey} /></Suspense></ClientOnly>
          {selected && <div className="pointer-events-none absolute left-3 right-14 top-3 z-[500] flex max-w-sm items-center gap-3 rounded-md border border-border bg-background/95 px-3 py-2.5 shadow-pop"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Crosshair className="size-4" /></span><div className="min-w-0"><p className="truncate text-xs font-medium">{selected.name}</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{coords(selected)}</p></div><span className="ml-auto shrink-0 text-[10px] text-success">GPS</span></div>}
          <Button variant="secondary" size="sm" className="absolute bottom-7 left-3 z-[500] border border-border shadow-pop" disabled={!selected} onClick={() => setCenterKey(k => k + 1)} aria-label="Centrar ubicación seleccionada"><Crosshair /> <span>Centro GPS</span></Button>
        </div>
        <div className="border-t border-border bg-surface px-3 py-3"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span className="flex items-center gap-1.5"><Pin className="size-3" />Accesos rápidos</span><span>{pinned.length} fijadas</span></div><div className="flex gap-2 overflow-x-auto pb-1">{pinned.map(l => <Button key={l.id} variant="outline" size="sm" className={cn('shrink-0 bg-background text-[11px]', l.id === selectedId && 'border-primary/40 bg-primary/10 text-primary')} onClick={() => select(l.id)}><MapPin className="size-3" />{l.name}{defaultId === l.id && <Star className="size-3 text-warning" />}</Button>)}{!pinned.length && <span className="py-1 text-xs text-muted-foreground">No hay accesos rápidos fijados.</span>}</div></div>
      </section>

      <aside className={cn('w-full shrink-0 flex-col overflow-y-auto border-l border-border bg-surface lg:flex lg:w-72 xl:w-80', mobileView === 'details' ? 'flex' : 'hidden')}>
        {selected ? <>
          <div className="border-b border-border p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ubicación seleccionada</span><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-6 text-muted-foreground" title="Editar ubicación" aria-label="Editar ubicación" onClick={() => openDraft(selected)}><Pencil /></Button><Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" title="Eliminar ubicación" aria-label="Eliminar ubicación" onClick={() => setDeleteTarget({ type: 'location', id: selected.id, name: selected.name })}><Trash2 /></Button></div></div>
            <div className="mb-3 grid size-10 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary"><MapPin className="size-5" /></div><h2 className="text-base font-semibold">{selected.name}</h2><p className="mt-1 text-xs text-muted-foreground">{selected.city}</p>{activeGroup && <span className={cn('mt-2 flex items-center gap-1.5 text-[11px]', colorText[activeGroup.color])}><span className={cn('size-1.5 rounded-full', colorBg[activeGroup.color])} />{activeGroup.name}</span>}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">{[['Latitud', selected.latitude.toFixed(6)], ['Longitud', selected.longitude.toFixed(6)], ['Altitud', `${selected.altitude} m`], ['Precisión', `± ${selected.accuracy} m`]].map(([label, value]) => <div key={label}><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 font-mono text-xs">{value}</p></div>)}</div><p className="mt-3 text-[10px] text-muted-foreground">Zona horaria</p><p className="mt-1 break-all font-mono text-[11px]">{selected.timezone}</p>
          </div>
          <div className="space-y-3 border-b border-border p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs"><Pin className="size-3.5 text-primary" />Acceso rápido</span><Switch aria-label="Fijar en accesos rápidos" checked={selected.is_pinned} onCheckedChange={() => togglePin(selected.id)} /></div><Button variant="ghost" className={cn('h-8 w-full justify-start px-0 text-xs hover:bg-transparent', defaultId === selected.id ? 'text-warning' : 'text-muted-foreground')} onClick={() => setDefault(selected.id)}><Star className={cn('size-3.5', defaultId === selected.id && 'fill-warning')} />{defaultId === selected.id ? 'Predeterminada del sistema' : 'Establecer como predeterminada'}{defaultId === selected.id && <Check className="ml-auto size-3.5" />}</Button></div>
          <div className="flex flex-1 flex-col p-4"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-xs font-semibold"><Smartphone className="size-3.5 text-primary" />Asignar GPS</h3><span className="font-mono text-[10px] text-muted-foreground">{assignedHere}/{PHONES.length} aquí</span></div><div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">CloudPhones</span><Button variant="link" size="sm" className="h-5 px-0 text-[11px]" disabled={assigning} onClick={() => setTargets(targets.length === online.length ? [] : online.map(p => p.id))}>{targets.length === online.length ? 'Limpiar' : 'Todos online'}</Button></div>
            <div className="mt-2 space-y-1">{PHONES.map(p => { const here = assignments[p.id] === selected.id; return <label key={p.id} className={cn('flex min-h-12 items-center gap-2.5 rounded-md border border-transparent px-2 py-2', !p.online ? 'opacity-40' : targets.includes(p.id) ? 'border-primary/30 bg-primary/10' : 'cursor-pointer hover:bg-surface-2')}><input type="checkbox" className="size-3.5 accent-primary" aria-label={`Seleccionar ${p.name}`} checked={targets.includes(p.id)} disabled={!p.online || assigning} onChange={e => setTargets(t => e.target.checked ? [...t, p.id] : t.filter(id => id !== p.id))} /><Smartphone className="size-3.5 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block font-mono text-[11px]">{p.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{!p.online ? 'Desconectado' : locations.find(l => l.id === assignments[p.id])?.name ?? 'Sin ubicación'}</span></span>{here ? <Check className="size-3 text-success" /> : <span className={cn('size-1.5 rounded-full', p.online ? 'bg-success' : 'bg-muted-foreground')} />}</label>; })}</div>
            <Button className="mt-4 w-full text-xs" disabled={!targets.length || assigning} onClick={assign}>{assigning ? <Loader2 className="animate-spin" /> : <ArrowRight />}{assigning ? 'Asignando…' : `Asignar a ${targets.length || ''} ${targets.length === 1 ? 'teléfono' : 'teléfonos'}`}</Button><p className="mt-2 text-center text-[10px] text-muted-foreground">Simulación · no modifica dispositivos reales</p>
          </div>
        </> : <div className="p-6 text-sm text-muted-foreground">Seleccioná una ubicación del catálogo.</div>}
      </aside>
    </div>
    <footer className="flex shrink-0 items-center justify-between border-t border-border bg-background px-4 py-1.5 font-mono text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-success" />ProteoMesh<span className="hidden sm:inline"> · Android 13</span></span><span>{locations.length} puntos <span className="mx-1 text-border">/</span>{groups.length} grupos<span className="ml-3 text-warning">Prototipo</span></span></footer>

    <Dialog open={!!draft} onOpenChange={open => { if (!open) setDraft(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-md bg-surface p-5"><DialogHeader><DialogTitle>{draft?.id ? 'Editar ubicación' : 'Nueva ubicación'}</DialogTitle><DialogDescription>{draft?.id ? draft.city : 'Coordenadas seleccionadas'}</DialogDescription></DialogHeader>{draft && <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveLocation(); }}>
      <div className="grid grid-cols-2 gap-3"><Field label="Nombre" className="col-span-2"><Input value={draft.name} autoFocus placeholder="Ej. Sucursal Palermo" onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="Ciudad / País" className="col-span-2"><Input value={draft.city} placeholder="Buenos Aires, Argentina" onChange={e => setDraft({ ...draft, city: e.target.value })} /></Field>{(['latitude', 'longitude', 'altitude', 'accuracy'] as const).map((key, i) => <Field key={key} label={['Latitud', 'Longitud', 'Altitud (m)', 'Precisión (m)'][i] ?? key}><Input type="number" step="any" value={Number.isNaN(draft[key]) ? '' : draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value === '' ? NaN : Number(e.target.value) })} /></Field>)}<Field label="Grupo" className="col-span-2"><select className="location-select" value={draft.group_id} onChange={e => setDraft({ ...draft, group_id: e.target.value })}><option value="">Sin grupo</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field><Field label="Zona horaria" className="col-span-2"><Input value={draft.timezone} onChange={e => setDraft({ ...draft, timezone: e.target.value })} /></Field></div>
      <div className="space-y-3 border-t border-border pt-3"><label className="flex items-center justify-between text-xs"><span className="flex items-center gap-2"><Pin className="size-3.5 text-primary" />Fijar en accesos rápidos</span><Switch checked={draft.is_pinned} onCheckedChange={v => setDraft({ ...draft, is_pinned: v })} /></label><label className="flex items-center justify-between text-xs"><span className="flex items-center gap-2"><Star className="size-3.5 text-warning" />Predeterminada del sistema</span><Switch checked={draftDefault} onCheckedChange={setDraftDefault} /></label></div>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancelar</Button><Button type="submit" size="sm"><Check />Guardar ubicación</Button></div>
    </form>}</DialogContent></Dialog>

    <Dialog open={groupDialog} onOpenChange={setGroupDialog}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-md bg-surface p-5"><DialogHeader><DialogTitle>Grupos de ubicaciones</DialogTitle><DialogDescription>{groups.length} grupos en el catálogo</DialogDescription></DialogHeader><div className="space-y-1">{groups.map(g => <div key={g.id} className="flex items-center gap-2 border-b border-border py-2"><span className={cn('size-2 rounded-full', colorBg[g.color])} /><div className="min-w-0 flex-1"><p className="truncate text-xs">{g.name}</p><p className="truncate text-[10px] text-muted-foreground">{g.description || 'Sin descripción'}</p></div><Button variant="ghost" size="icon" className="size-7" aria-label={`Editar grupo ${g.name}`} onClick={() => setGroupDraft(g)}><Pencil /></Button><Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={`Eliminar grupo ${g.name}`} onClick={() => setDeleteTarget({ type: 'group', id: g.id, name: g.name })}><Trash2 /></Button></div>)}</div><form className="space-y-3" onSubmit={e => { e.preventDefault(); saveGroup(); }}><h3 className="flex items-center gap-2 text-xs font-medium"><Folder className="size-3.5 text-primary" />{groupDraft.id ? 'Editar grupo' : 'Nuevo grupo'}</h3><Field label="Nombre del grupo"><Input value={groupDraft.name} required onChange={e => setGroupDraft({ ...groupDraft, name: e.target.value })} /></Field><Field label="Descripción"><Input value={groupDraft.description} onChange={e => setGroupDraft({ ...groupDraft, description: e.target.value })} /></Field><div className="flex items-center gap-2"><span className="mr-2 text-xs text-muted-foreground">Color</span>{(['primary', 'success', 'warning', 'rose'] as const).map((color, i) => <Button type="button" key={color} variant="ghost" size="icon" title={['Cian', 'Verde', 'Ámbar', 'Rosa'][i]} aria-label={['Cian', 'Verde', 'Ámbar', 'Rosa'][i]} aria-pressed={groupDraft.color === color} className={cn('size-7 rounded-full', colorBg[color], groupDraft.color === color && 'ring-2 ring-ring ring-offset-2 ring-offset-background')} onClick={() => setGroupDraft({ ...groupDraft, color })}>{groupDraft.color === color && <Check className="size-3 text-background" />}</Button>)}</div><div className="flex justify-end gap-2">{groupDraft.id && <Button type="button" variant="ghost" size="sm" onClick={() => setGroupDraft({ id: '', name: '', description: '', color: 'success' })}><X />Cancelar edición</Button>}<Button size="sm" type="submit" disabled={!groupDraft.name.trim()}><Check />Guardar grupo</Button></div></form></DialogContent></Dialog>
    <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}><DialogContent className="w-[calc(100%-2rem)] rounded-md bg-surface"><DialogHeader><DialogTitle>¿Eliminar {deleteTarget?.name}?</DialogTitle><DialogDescription>{deleteTarget?.type === 'group' ? 'Las ubicaciones del grupo se conservarán sin grupo.' : 'Se quitará del catálogo y de los accesos rápidos. Esta acción no se puede deshacer.'}</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="destructive" size="sm" onClick={confirmDelete}><Trash2 />Eliminar</Button></div></DialogContent></Dialog>
  </WorkspaceShell>;
}

function MapLoading() { return <div className="grid h-full place-items-center text-xs text-muted-foreground"><span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Cargando mapa…</span></div>; }
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <label className={cn('block space-y-1.5 text-xs text-muted-foreground', className)}><span>{label}</span>{children}</label>; }