import { useMemo, useRef, useState } from "react";
import {
  Search, Upload, Trash2, Package, Layers, Check, X, Loader2, AlertTriangle, Star, Cpu, Hash,
  Smartphone, ChevronDown, Rocket, CircleSlash,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { APKS, PHONES, type Apk } from "@/lib/proteo-mock";
import { cn } from "@/lib/utils";

type Filter = "all" | "default" | "bundle" | "apk";
type JobState = "queued" | "running" | "ok" | "skip" | "fail";
type Upload = { id: string; name: string; progress: number; stage: string };

const hue = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

export function AppIcon({ apk, size = 36 }: { apk: Apk; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-md font-mono text-sm font-semibold text-foreground"
      style={{ width: size, height: size, background: `oklch(0.38 0.09 ${hue(apk.pkg)})` }}
    >
      {apk.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function isArmSplit(s: string) {
  return /arm|armeabi/.test(s) || (/x86\./.test(s) && !/x86_64/.test(s));
}

export function ApkRepository() {
  const [apks, setApks] = useState<Apk[]>(APKS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string>(APKS[0].id);
  const [targets, setTargets] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Record<string, JobState>>({});
  const [installing, setInstalling] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<Apk | null>(null);
  const [showSplits, setShowSplits] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () =>
      apks.filter((a) => {
        const q = query.toLowerCase();
        const okQ = !q || a.name.toLowerCase().includes(q) || a.pkg.includes(q);
        const okF = filter === "all" || (filter === "default" ? a.isDefault : a.type === filter);
        return okQ && okF;
      }),
    [apks, query, filter],
  );
  const sel = apks.find((a) => a.id === selectedId) ?? null;
  const online = PHONES.filter((p) => p.online);
  const totalSize = apks.reduce((s, a) => s + a.size, 0);

  const selectApk = (id: string) => {
    setSelectedId(id);
    setTargets([]);
    setJobs({});
    setShowSplits(false);
  };

  const toggleDefault = (id: string) => {
    setApks((xs) => xs.map((a) => (a.id === id ? { ...a, isDefault: !a.isDefault } : a)));
    const a = apks.find((x) => x.id === id)!;
    toast.success(a.isDefault ? `${a.name} ya no se autoinstala` : `${a.name} se instalará en cada CloudPhone nuevo`);
  };

  const startUpload = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["apk", "apkm", "xapk", "apks", "zip"].includes(ext ?? "")) {
        toast.error(`${file.name}: formato no soportado`);
        return;
      }
      setUploads((u) => [...u, { id, name: file.name, progress: 0, stage: "Subiendo" }]);
      let p = 0;
      const t = setInterval(() => {
        p += 8 + Math.random() * 14;
        const stage = p < 70 ? "Subiendo" : p < 90 ? "Validando bundle" : "Extrayendo metadatos (aapt2)";
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: Math.min(p, 100), stage } : x)));
        if (p >= 100) {
          clearInterval(t);
          const base = file.name.replace(/\.[^.]+$/, "");
          const apk: Apk = {
            id, name: base.split(/[_.-]/).filter(Boolean).slice(-1)[0]?.replace(/^\w/, (c) => c.toUpperCase()) || base,
            file: file.name, pkg: base.toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 32) || "com.unknown",
            version: "1.0.0", code: "1", size: +(file.size / 1024 ** 2).toFixed(1) || 1,
            type: ext === "apk" ? "apk" : "bundle", format: ext === "apk" ? undefined : (ext as Apk["format"]),
            splits: ext === "apk" ? undefined : ["base.apk"], abi: "x86_64", isDefault: false,
            added: new Date().toISOString().slice(0, 10), sha: id.replace(/-/g, "").slice(0, 16), installedOn: [],
          };
          setTimeout(() => {
            setUploads((u) => u.filter((x) => x.id !== id));
            setApks((xs) => [apk, ...xs]);
            selectApk(id);
            toast.success(`${file.name} agregado al repositorio`);
          }, 400);
        }
      }, 250);
    });
  };

  const install = async () => {
    if (!sel || !targets.length) return;
    setInstalling(true);
    const init: Record<string, JobState> = {};
    targets.forEach((t) => (init[t] = sel.installedOn.includes(t) ? "skip" : "queued"));
    setJobs(init);
    const queue = targets.filter((t) => init[t] === "queued");
    const results: Record<string, JobState> = { ...init };
    const worker = async () => {
      while (queue.length) {
        const t = queue.shift()!;
        setJobs((j) => ({ ...j, [t]: "running" }));
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 1200));
        const r: JobState = Math.random() < 0.88 ? "ok" : "fail";
        results[t] = r;
        setJobs((j) => ({ ...j, [t]: r }));
      }
    };
    await Promise.all([worker(), worker()]);
    const ok = Object.entries(results).filter(([, v]) => v === "ok").map(([k]) => k);
    setApks((xs) => xs.map((a) => (a.id === sel.id ? { ...a, installedOn: [...new Set([...a.installedOn, ...ok])] } : a)));
    const v = Object.values(results);
    const fails = v.filter((x) => x === "fail").length;
    (fails ? toast.warning : toast.success)(
      `${sel.name}: ${ok.length} ok · ${v.filter((x) => x === "skip").length} omitidas · ${fails} fallos`,
    );
    setInstalling(false);
  };

  return (
    <div
      className="relative flex min-h-0 flex-1"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); startUpload(e.dataTransfer.files); }}
    >
      <input ref={fileRef} type="file" multiple hidden accept=".apk,.apkm,.xapk,.apks,.zip"
        onChange={(e) => e.target.files && startUpload(e.target.files)} />

      {/* LIST */}
      <section className="flex min-w-0 flex-1 flex-col border-r border-border">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o package…"
              className="h-8 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
          </div>
          <div className="flex rounded-md border border-border bg-surface p-0.5 text-xs">
            {([["all", "Todas"], ["default", "Default"], ["bundle", "Bundles"], ["apk", "APK"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn("rounded-sm px-2.5 py-1 transition-colors", filter === k ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Upload className="size-3.5" /> Subir APK
          </button>
        </div>

        {uploads.length > 0 && (
          <div className="space-y-1.5 border-b border-border bg-surface px-4 py-2">
            {uploads.map((u) => (
              <div key={u.id} className="flex items-center gap-3 text-xs">
                <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                <span className="min-w-0 flex-1 truncate font-mono">{u.name}</span>
                <span className="w-44 shrink-0 text-right text-muted-foreground">{u.stage}</span>
                <div className="h-1.5 w-32 shrink-0 overflow-hidden rounded-full bg-muted">
                  <div className="stripe-progress h-full transition-all" style={{ width: `${u.progress}%` }} />
                </div>
                <span className="w-9 shrink-0 text-right font-mono tabular-nums">{Math.round(u.progress)}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Aplicación</th>
                <th className="px-2 py-2 font-medium">Versión</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 text-right font-medium">Tamaño</th>
                <th className="px-2 py-2 font-medium">Instalada</th>
                <th className="px-4 py-2 text-center font-medium" title="Autoinstalar en CloudPhones nuevos">Default</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const active = a.id === selectedId;
                const inst = a.installedOn.length;
                return (
                  <tr key={a.id} onClick={() => selectApk(a.id)}
                    className={cn("group cursor-pointer border-b border-border/60 transition-colors",
                      active ? "bg-accent/60" : "hover:bg-surface-2/60")}>
                    <td className={cn("px-4 py-2.5", active && "shadow-[inset_2px_0_0_var(--primary)]")}>
                      <div className="flex min-w-0 items-center gap-3">
                        <AppIcon apk={a} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.name}</div>
                          <div className="truncate font-mono text-xs text-muted-foreground">{a.pkg}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs">
                      <div>{a.version}</div>
                      <div className="text-muted-foreground">#{a.code}</div>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {a.type === "apk" ? (
                          <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">APK</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                            <Layers className="size-3" /> .{a.format} · {a.splits?.length}
                          </span>
                        )}
                        {a.obbIgnored && (
                          <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 font-mono text-[10px] text-warning" title="El paquete contenía OBB que no se instalarán">OBB</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs tabular-nums">{a.size.toFixed(1)} MB</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1" title={a.installedOn.join(", ") || "En ningún teléfono"}>
                        {PHONES.map((p) => (
                          <span key={p.id} className={cn("h-3 w-1.5 rounded-[1px]",
                            a.installedOn.includes(p.id) ? "bg-success" : "bg-muted")} />
                        ))}
                        <span className="ml-1.5 font-mono text-xs text-muted-foreground">{inst}/{PHONES.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={a.isDefault} onCheckedChange={() => toggleDefault(a.id)} className="data-[state=checked]:bg-success" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="grid place-items-center py-20 text-center text-sm text-muted-foreground">
              <Package className="mb-2 size-8 opacity-40" />
              Ninguna app coincide con la búsqueda.
            </div>
          )}
          <button onClick={() => fileRef.current?.click()}
            className="mx-4 my-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-md border border-dashed border-border py-4 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <Upload className="size-3.5" /> Soltá archivos en cualquier parte · .apk .apkm .xapk .apks .zip · máx. 300 MB
          </button>
        </div>

        <footer className="flex items-center gap-4 border-t border-border px-4 py-1.5 font-mono text-[11px] text-muted-foreground">
          <span>{apks.length} apps</span>
          <span>{apks.filter((a) => a.isDefault).length} default</span>
          <span>{totalSize.toFixed(1)} MB en apk_repo/</span>
        </footer>
      </section>

      {/* INSPECTOR */}
      <aside className="flex w-[380px] shrink-0 flex-col bg-surface">
        {sel ? (
          <>
            <div className="border-b border-border p-4">
              <div className="flex items-start gap-3">
                <AppIcon apk={sel} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">{sel.name}</h2>
                  <p className="truncate font-mono text-xs text-muted-foreground">{sel.pkg}</p>
                  <p className="mt-0.5 font-mono text-xs">v{sel.version} <span className="text-muted-foreground">({sel.code})</span></p>
                </div>
                <button onClick={() => setToDelete(sel)} title="Eliminar del repositorio"
                  className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border text-xs">
                {[["Tamaño", `${sel.size.toFixed(1)} MB`], ["ABI", sel.abi ?? "universal"], ["Alta", sel.added]].map(([k, v]) => (
                  <div key={k} className="bg-card px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 truncate font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 flex items-center gap-1.5 truncate font-mono text-[11px] text-muted-foreground" title={sel.file}>
                <Hash className="size-3 shrink-0" /> {sel.sha}… · <span className="truncate">{sel.file}</span>
              </div>

              {sel.obbIgnored && (
                <div className="mt-3 flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> Este .xapk incluía datos OBB que no se copian al instalar.
                </div>
              )}

              <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-2.5">
                <Star className={cn("size-4", sel.isDefault ? "text-success" : "text-muted-foreground")} />
                <div className="flex-1">
                  <div className="text-sm font-medium">Autoinstalar por defecto</div>
                  <div className="text-xs text-muted-foreground">Se instala en cada CloudPhone nuevo</div>
                </div>
                <Switch checked={sel.isDefault} onCheckedChange={() => toggleDefault(sel.id)} className="data-[state=checked]:bg-success" />
              </label>

              {sel.splits && (
                <div className="mt-3 rounded-md border border-border bg-card">
                  <button onClick={() => setShowSplits((s) => !s)} className="flex w-full items-center gap-2 px-2.5 py-2 text-xs">
                    <Cpu className="size-3.5 text-primary" />
                    <span className="flex-1 text-left">
                      {sel.splits.length} splits · se instalan {sel.splits.filter((s) => !isArmSplit(s)).length} ({sel.abi})
                    </span>
                    <ChevronDown className={cn("size-3.5 transition-transform", showSplits && "rotate-180")} />
                  </button>
                  {showSplits && (
                    <ul className="max-h-36 space-y-0.5 overflow-auto border-t border-border px-2.5 py-2 font-mono text-[11px]">
                      {sel.splits.map((s) => (
                        <li key={s} className={cn("flex items-center gap-1.5", isArmSplit(s) ? "text-muted-foreground line-through" : "")}>
                          {isArmSplit(s) ? <CircleSlash className="size-3" /> : <Check className="size-3 text-success" />} {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* DEPLOY */}
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Instalar en</h3>
                <div className="flex gap-2 text-xs">
                  <button className="text-primary hover:underline" disabled={installing}
                    onClick={() => setTargets(online.filter((p) => !sel.installedOn.includes(p.id)).map((p) => p.id))}>
                    Faltantes
                  </button>
                  <button className="text-primary hover:underline" disabled={installing} onClick={() => setTargets(online.map((p) => p.id))}>Todas</button>
                  <button className="text-muted-foreground hover:text-foreground" disabled={installing} onClick={() => { setTargets([]); setJobs({}); }}>Limpiar</button>
                </div>
              </div>
              <div className="grid min-h-0 grid-cols-2 gap-1.5 overflow-auto">
                {PHONES.map((p) => {
                  const on = targets.includes(p.id);
                  const has = sel.installedOn.includes(p.id);
                  const job = jobs[p.id];
                  return (
                    <button key={p.id} disabled={!p.online || installing}
                      onClick={() => setTargets((t) => (on ? t.filter((x) => x !== p.id) : [...t, p.id]))}
                      className={cn("flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-all",
                        !p.online && "cursor-not-allowed opacity-40",
                        on ? "border-primary bg-primary/10 glow-primary" : "border-border bg-card hover:border-muted-foreground/40")}>
                      <Smartphone className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono">{p.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className={cn("size-1.5 rounded-full", p.online ? "bg-success" : "bg-muted-foreground")} />
                          {!p.online ? "apagado" : job === "running" ? "instalando…" : job === "ok" ? "instalada" : job === "fail" ? "falló" : job === "skip" ? "ya estaba" : has ? "ya instalada" : "lista"}
                        </div>
                      </div>
                      {job === "running" ? <Loader2 className="size-3.5 animate-spin text-primary" />
                        : job === "ok" ? <Check className="size-3.5 text-success" />
                        : job === "fail" ? <X className="size-3.5 text-destructive" />
                        : has ? <Check className="size-3.5 text-success/60" />
                        : on ? <span className="size-3.5 rounded-sm bg-primary" /> : <span className="size-3.5 rounded-sm border border-border" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto pt-4">
                <button onClick={install} disabled={!targets.length || installing}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                  {installing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                  {installing ? "Instalando (2 en paralelo)…" : targets.length ? `Instalar en ${targets.length} teléfono${targets.length > 1 ? "s" : ""}` : "Elegí teléfonos destino"}
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  {sel.type === "bundle" ? "adb install-multiple · solo splits x86_64" : "adb install -r"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Seleccioná una app</div>
        )}
      </aside>

      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-background/85 backdrop-blur-sm">
          <div className="text-center">
            <Upload className="mx-auto size-10 text-primary" />
            <p className="mt-3 text-lg font-semibold">Soltá para agregar al repositorio</p>
            <p className="font-mono text-xs text-muted-foreground">.apk · .apkm · .xapk · .apks · .zip — hasta 300 MB</p>
          </div>
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra el registro y el archivo de apk_repo/. Las instancias donde ya está instalada no se ven afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const id = toDelete!.id;
                const rest = apks.filter((a) => a.id !== id);
                setApks(rest);
                if (rest[0]) selectApk(rest[0].id);
                toast.success(`${toDelete!.name} eliminada`);
              }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
