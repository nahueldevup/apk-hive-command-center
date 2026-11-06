import { useMemo, useRef, useState } from "react";
import {
  Folder, FolderOpen, FileText, FileImage, FileVideo, FileArchive, FileAudio, Download, Send, Trash2,
  Upload, ChevronRight, Search, LayoutGrid, List, Smartphone, X, Loader2, Camera, Image, FileDown, HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PHONES, ROOTS, makeFs, fmtBytes, type FsEntry } from "@/lib/proteo-mock";
import { cn } from "@/lib/utils";

const ROOT_ICON = { Download: FileDown, DCIM: Camera, Pictures: Image, Documents: FileText } as const;

function iconFor(e: FsEntry) {
  if (e.dir) return Folder;
  const ext = e.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return FileImage;
  if (["mp4", "mkv", "mov"].includes(ext)) return FileVideo;
  if (["zip", "rar", "7z", "apk"].includes(ext)) return FileArchive;
  if (["ogg", "mp3", "m4a", "wav"].includes(ext)) return FileAudio;
  return FileText;
}
const isImg = (n: string) => /\.(jpe?g|png|webp)$/i.test(n);
const thumbHue = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

export function FileExplorer() {
  const [fsByPhone, setFsByPhone] = useState<Record<string, Record<string, FsEntry[]>>>(() =>
    Object.fromEntries(PHONES.map((p) => [p.id, makeFs()])),
  );
  const [phoneId, setPhoneId] = useState(PHONES[0]!.id);
  const [path, setPath] = useState<string[]>(["Download"]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; p: number }[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const phone = PHONES.find((p) => p.id === phoneId)!;
  const fs = fsByPhone[phoneId]!;

  const resolve = (tree: Record<string, FsEntry[]>, p: string[]) => {
    let list = tree[p[0]!] ?? [];
    for (const seg of p.slice(1)) list = list.find((e) => e.dir && e.name === seg)?.children ?? [];
    return list;
  };
  const entries = useMemo(() => {
    const l = resolve(fs, path).filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));
    return [...l].sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name));
  }, [fs, path, query]);

  const mutateDir = (pid: string, p: string[], fn: (l: FsEntry[]) => FsEntry[]) =>
    setFsByPhone((all) => {
      const tree = structuredClone(all[pid]!);
      if (p.length === 1) tree[p[0]!] = fn(tree[p[0]!] ?? []);
      else {
        let list = tree[p[0]!]!;
        for (const seg of p.slice(1, -1)) list = list.find((e) => e.name === seg)!.children!;
        const dir = list.find((e) => e.name === p[p.length - 1])!;
        dir.children = fn(dir.children ?? []);
      }
      return { ...all, [pid]: tree };
    });

  const go = (p: string[]) => { setPath(p); setSelected([]); setQuery(""); };
  const switchPhone = (id: string) => { setPhoneId(id); go(["Download"]); };
  const toggle = (n: string) => setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const selFiles = entries.filter((e) => selected.includes(e.name));
  const fullPath = "/sdcard/" + path.join("/");

  const upload = (files: FileList | File[]) => {
    if (!phone.online) { toast.error(`${phone.name} está apagado`); return; }
    const arr = Array.from(files);
    const target = [...path];
    setUploading(arr.map((f) => ({ name: f.name, p: 0 })));
    let p = 0;
    const t = setInterval(() => {
      p += 20;
      setUploading((u) => u.map((x) => ({ ...x, p })));
      if (p >= 100) {
        clearInterval(t);
        mutateDir(phoneId, target, (l) => [
          ...l.filter((e) => !arr.some((f) => f.name === e.name)),
          ...arr.map((f) => ({ name: f.name, dir: false, size: f.size, mtime: new Date().toISOString().slice(0, 16).replace("T", " ") })),
        ]);
        setUploading([]);
        toast.success(`${arr.length} archivo(s) subidos a ${"/sdcard/" + target.join("/")}`);
      }
    }, 180);
  };

  const download = (items: FsEntry[]) => {
    items.filter((i) => !i.dir).forEach((i) => {
      const blob = new Blob([`Demo de ${i.name} desde ${phone.name}`], { type: "application/octet-stream" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = i.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    });
    toast.success(`Descargando ${items.filter((i) => !i.dir).length} archivo(s)`);
  };

  const doSend = () => {
    if (!sendTarget) return;
    const files = selFiles.filter((f) => !f.dir);
    const target = [...path];
    mutateDir(sendTarget, target, (l) => {
      const out = [...l];
      files.forEach((f) => {
        let name = f.name, i = 1;
        const [b, ext] = [f.name.replace(/(\.[^.]+)$/, ""), f.name.match(/\.[^.]+$/)?.[0] ?? ""];
        while (out.some((e) => e.name === name)) name = `${b}_${i++}${ext}`;
        out.push({ ...f, name });
      });
      return out;
    });
    toast.success(`${files.length} archivo(s) enviados a ${sendTarget}:${"/sdcard/" + target.join("/")}`, {
      description: "Galería indexada (MEDIA_SCANNER_SCAN_FILE)",
    });
    setSendOpen(false); setSendTarget(null); setSelected([]);
  };

  const doDelete = () => {
    mutateDir(phoneId, path, (l) => l.filter((e) => !selected.includes(e.name)));
    toast.success(`${selected.length} elemento(s) eliminados`);
    setSelected([]);
  };

  const rowActions = (e: FsEntry) => (
    <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      {!e.dir && (
        <>
          <IconBtn title="Descargar a la PC" onClick={() => download([e])}><Download className="size-3.5" /></IconBtn>
          <IconBtn title="Enviar a otro teléfono" onClick={() => { setSelected([e.name]); setSendOpen(true); }}><Send className="size-3.5" /></IconBtn>
        </>
      )}
      <IconBtn title="Eliminar" danger onClick={() => { setSelected([e.name]); setDelOpen(true); }}><Trash2 className="size-3.5" /></IconBtn>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1">
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />

      {/* DEVICES + ROOTS */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="px-3 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">CloudPhones</div>
        <div className="max-h-[45%] space-y-0.5 overflow-auto px-2">
          {PHONES.map((p) => (
            <button key={p.id} onClick={() => switchPhone(p.id)}
              className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                p.id === phoneId ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}>
              <div className="relative">
                <Smartphone className="size-4" />
                <span className={cn("absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-surface", p.online ? "bg-success" : "bg-muted-foreground")} />
              </div>
              <span className="flex-1 truncate font-mono text-xs">{p.name}</span>
              <span className="font-mono text-[10px]">{p.online ? "" : "off"}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 border-t border-border px-3 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Carpetas</div>
        <nav className="space-y-0.5 px-2">
          {ROOTS.map((r) => {
            const Ico = ROOT_ICON[r];
            const active = path[0] === r;
            return (
              <button key={r} onClick={() => go([r])}
                className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}>
                <Ico className="size-4" />
                <span className="flex-1 text-left">{r}</span>
                <span className="font-mono text-[10px]">{(fs[r]?.length ?? 0)}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="size-3.5" /> /sdcard</span>
            <span className="font-mono">{Math.round(phone.storage * 32)} / 32 GB</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${phone.storage * 100}%` }} />
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <section
        className="relative flex min-w-0 flex-1 flex-col"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <nav className="flex min-w-0 flex-1 items-center gap-0.5 font-mono text-sm">
            <span className="flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-muted-foreground">
              <Smartphone className="size-3.5" /> {phone.name}
            </span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="px-1 text-muted-foreground">sdcard</span>
            {path.map((seg, i) => (
              <span key={i} className="flex min-w-0 items-center gap-0.5">
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                <button onClick={() => go(path.slice(0, i + 1))}
                  className={cn("truncate rounded-sm px-1.5 py-1 hover:bg-surface-2", i === path.length - 1 ? "text-foreground" : "text-muted-foreground")}>
                  {seg}
                </button>
              </span>
            ))}
          </nav>
          <div className="relative w-52">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar en carpeta…"
              className="h-8 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
          </div>
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            {([["list", List], ["grid", LayoutGrid]] as const).map(([k, I]) => (
              <button key={k} onClick={() => setView(k)} title={k === "list" ? "Lista" : "Cuadrícula"}
                className={cn("grid size-7 place-items-center rounded-sm", view === k ? "bg-accent text-foreground" : "text-muted-foreground")}>
                <I className="size-3.5" />
              </button>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={!phone.online}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            <Upload className="size-3.5" /> Subir aquí
          </button>
        </div>

        {uploading.length > 0 && (
          <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2 text-xs">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span className="flex-1 truncate font-mono">Subiendo {uploading.map((u) => u.name).join(", ")} → {fullPath}</span>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
              <div className="stripe-progress h-full transition-all" style={{ width: `${uploading[0]?.p ?? 0}%` }} />
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          {!phone.online ? (
            <Empty icon={Smartphone} title={`${phone.name} está apagado`} text="Encendé el CloudPhone para explorar su almacenamiento." />
          ) : entries.length === 0 ? (
            <Empty icon={FolderOpen} title="Carpeta vacía" text="Arrastrá archivos desde tu PC o usá «Subir aquí»." />
          ) : view === "list" ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="w-10 py-2 pl-4">
                    <Check checked={selected.length === entries.length} onClick={() => setSelected(selected.length === entries.length ? [] : entries.map((e) => e.name))} />
                  </th>
                  <th className="py-2 font-medium">Nombre</th>
                  <th className="px-2 py-2 text-right font-medium">Tamaño</th>
                  <th className="px-2 py-2 font-medium">Modificado</th>
                  <th className="w-28 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const Ico = iconFor(e);
                  const on = selected.includes(e.name);
                  return (
                    <tr key={e.name}
                      onClick={() => toggle(e.name)}
                      onDoubleClick={() => e.dir && go([...path, e.name])}
                      className={cn("group cursor-default border-b border-border/60", on ? "bg-primary/10" : "hover:bg-surface-2/60")}>
                      <td className="py-2 pl-4"><Check checked={on} onClick={() => toggle(e.name)} /></td>
                      <td className="py-2">
                        <button onClick={(ev) => { if (e.dir) { ev.stopPropagation(); go([...path, e.name]); } }}
                          className={cn("flex min-w-0 items-center gap-2.5 text-left", e.dir && "hover:text-primary")}>
                          <Ico className={cn("size-4 shrink-0", e.dir ? "text-primary" : "text-muted-foreground")} />
                          <span className="truncate">{e.name}</span>
                          {e.dir && <span className="font-mono text-[10px] text-muted-foreground">{e.children?.length ?? 0} ítems</span>}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">{e.dir ? "—" : fmtBytes(e.size)}</td>
                      <td className="px-2 py-2 font-mono text-xs text-muted-foreground">{e.mtime}</td>
                      <td className="px-4 py-2" onClick={(ev) => ev.stopPropagation()}>{rowActions(e)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 p-4">
              {entries.map((e) => {
                const Ico = iconFor(e);
                const on = selected.includes(e.name);
                return (
                  <div key={e.name} onClick={() => toggle(e.name)} onDoubleClick={() => e.dir && go([...path, e.name])}
                    className={cn("group relative overflow-hidden rounded-md border bg-card transition-colors",
                      on ? "border-primary glow-primary" : "border-border hover:border-muted-foreground/40")}>
                    <div className="grid aspect-[4/3] place-items-center"
                      style={isImg(e.name) ? { background: `linear-gradient(135deg, oklch(0.45 0.1 ${thumbHue(e.name)}), oklch(0.3 0.08 ${thumbHue(e.name) + 60}))` } : undefined}>
                      <Ico className={cn("size-8", e.dir ? "text-primary" : "text-muted-foreground", isImg(e.name) && "opacity-50")} />
                    </div>
                    <div className="border-t border-border px-2 py-1.5">
                      <div className="truncate text-xs">{e.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{e.dir ? `${e.children?.length ?? 0} ítems` : fmtBytes(e.size)}</div>
                    </div>
                    <div className="absolute left-1.5 top-1.5"><Check checked={on} onClick={() => toggle(e.name)} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BULK BAR */}
        {selected.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-pop animate-in slide-in-from-bottom-2 fade-in">
              <span className="px-3 font-mono text-xs">{selected.length} seleccionado(s)</span>
              <div className="h-5 w-px bg-border" />
              <BarBtn onClick={() => download(selFiles)} disabled={!selFiles.some((f) => !f.dir)}><Download className="size-3.5" /> Descargar</BarBtn>
              <BarBtn onClick={() => setSendOpen(true)} disabled={!selFiles.some((f) => !f.dir)}><Send className="size-3.5" /> Enviar a…</BarBtn>
              <BarBtn danger onClick={() => setDelOpen(true)}><Trash2 className="size-3.5" /> Eliminar</BarBtn>
              <IconBtn title="Deseleccionar" onClick={() => setSelected([])}><X className="size-3.5" /></IconBtn>
            </div>
          </div>
        )}

        <footer className="flex items-center gap-4 border-t border-border px-4 py-1.5 font-mono text-[11px] text-muted-foreground">
          <span>{fullPath}</span>
          <span>{entries.length} elementos</span>
          <span className="ml-auto">Doble clic abre carpetas · arrastrá archivos para subir</span>
        </footer>

        {dragging && (
          <div className="pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-background/85 backdrop-blur-sm">
            <div className="text-center">
              <Upload className="mx-auto size-10 text-primary" />
              <p className="mt-3 text-lg font-semibold">Soltar en {phone.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{fullPath}</p>
            </div>
          </div>
        )}
      </section>

      {/* SEND DIALOG */}
      <Dialog open={sendOpen} onOpenChange={(o) => { setSendOpen(o); if (!o) setSendTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar a otro teléfono</DialogTitle>
            <DialogDescription>
              {selFiles.filter((f) => !f.dir).length} archivo(s) se copiarán a la misma ruta <span className="font-mono">{fullPath}</span> del destino. Los nombres repetidos reciben sufijo (_1).
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-1.5">
            {PHONES.filter((p) => p.id !== phoneId).map((p) => (
              <button key={p.id} disabled={!p.online} onClick={() => setSendTarget(p.id)}
                className={cn("flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm",
                  !p.online && "cursor-not-allowed opacity-40",
                  sendTarget === p.id ? "border-primary bg-primary/10 glow-primary" : "border-border hover:border-muted-foreground/40")}>
                <span className={cn("size-2 rounded-full", p.online ? "bg-success" : "bg-muted-foreground")} />
                <span className="font-mono">{p.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setSendOpen(false)} className="h-9 rounded-md border border-border px-4 text-sm hover:bg-surface-2">Cancelar</button>
            <button onClick={doSend} disabled={!sendTarget}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40">
              <Send className="size-3.5" /> Enviar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selected.length} elemento(s) de {phone.name}?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              {selected.slice(0, 5).map((s) => `${fullPath}/${s}`).join("\n")}
              {selected.length > 5 && ` …y ${selected.length - 5} más`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Check({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn("grid size-4 place-items-center rounded-sm border transition-colors",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-surface hover:border-muted-foreground")}>
      {checked && <svg viewBox="0 0 12 12" className="size-3"><path d="M2.5 6.5l2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>}
    </button>
  );
}
function IconBtn({ children, danger, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button {...p} className={cn("grid size-7 place-items-center rounded-sm text-muted-foreground",
      danger ? "hover:bg-destructive/15 hover:text-destructive" : "hover:bg-surface-2 hover:text-foreground")}>{children}</button>
  );
}
function BarBtn({ children, danger, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button {...p} className={cn("inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm disabled:opacity-40",
      danger ? "text-destructive hover:bg-destructive/15" : "hover:bg-surface-2")}>{children}</button>
  );
}
function Empty({ icon: I, title, text }: { icon: typeof Folder; title: string; text: string }) {
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div>
        <I className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-3 font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
