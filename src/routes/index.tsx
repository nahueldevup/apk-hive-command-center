import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, FolderOpen, PanelLeft, Plus, Smartphone, Plug, MapPin, FolderArchive, Settings } from "lucide-react";
import { ApkRepository } from "@/components/proteo/ApkRepository";
import { FileExplorer } from "@/components/proteo/FileExplorer";
import { PHONES } from "@/lib/proteo-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProteoMesh · APKs y Archivos" },
      { name: "description", content: "Repositorio de APKs y explorador de archivos para la granja de CloudPhones ProteoMesh." },
      { property: "og:title", content: "ProteoMesh · APKs y Archivos" },
      { property: "og:description", content: "Instalá apps en lote y mové archivos entre CloudPhones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<"apks" | "files">("apks");
  const online = PHONES.filter((p) => p.online).length;
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-2 text-muted-foreground">
        <Rail><PanelLeft className="size-4" /></Rail>
        <Rail className="border border-primary/40 bg-primary/10 text-primary"><Plus className="size-4" /></Rail>
        <div className="my-1 h-px w-6 bg-border" />
        <Rail><Smartphone className="size-4" /></Rail>
        <Rail><Plug className="size-4" /></Rail>
        <Rail><MapPin className="size-4" /></Rail>
        <Rail className="bg-sidebar-accent text-primary"><FolderArchive className="size-4" /></Rail>
        <div className="mt-auto"><Rail><Settings className="size-4" /></Rail></div>
      </nav>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border px-4 py-2.5">
          <h1 className="flex items-center gap-2 font-mono text-base font-semibold">
            <Package className="size-4 text-primary" /> APKs y Archivos
          </h1>
          <div className="flex rounded-md border border-border bg-surface p-0.5 text-sm">
            {([["apks", "Repositorio APKs", Package], ["files", "Archivos", FolderOpen]] as const).map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)}
                className={cn("inline-flex items-center gap-1.5 rounded-sm px-3 py-1 transition-colors",
                  tab === k ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <I className="size-3.5" /> {l}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> {online}/{PHONES.length} online
          </div>
        </header>
        {tab === "apks" ? <ApkRepository /> : <FileExplorer />}
      </main>
    </div>
  );
}

function Rail({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button className={cn("grid size-8 place-items-center rounded-md hover:bg-sidebar-accent hover:text-foreground", className)}>{children}</button>;
}
