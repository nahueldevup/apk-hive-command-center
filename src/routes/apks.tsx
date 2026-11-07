import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, FolderOpen } from "lucide-react";
import { ApkRepository } from "@/components/proteo/ApkRepository";
import { FileExplorer } from "@/components/proteo/FileExplorer";
import { PHONES } from "@/lib/proteo-mock";
import { cn } from "@/lib/utils";
import { WorkspaceShell } from "@/components/proteo/WorkspaceShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/apks")({
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
    <WorkspaceShell active="apks">
        <header className="flex items-center gap-4 border-b border-border px-4 py-2.5">
          <h1 className="flex items-center gap-2 font-mono text-base font-semibold">
            <Package className="size-4 text-primary" /> APKs y Archivos
          </h1>
          <div className="flex rounded-md border border-border bg-surface p-0.5 text-sm">
            {([["apks", "Repositorio APKs", Package], ["files", "Archivos", FolderOpen]] as const).map(([k, l, I]) => (
              <Button variant="ghost" key={k} onClick={() => setTab(k)}
                className={cn("inline-flex items-center gap-1.5 rounded-sm px-3 py-1 transition-colors",
                  tab === k ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <I className="size-3.5" /> {l}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> {online}/{PHONES.length} online
          </div>
        </header>
        {tab === "apks" ? <ApkRepository /> : <FileExplorer />}
    </WorkspaceShell>
  );
}
