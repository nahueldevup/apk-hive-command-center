import { createFileRoute } from "@tanstack/react-router";
import { LocationsWorkspace } from "@/components/proteo/LocationsWorkspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProteoMesh · Centro de geolocalización" },
      { name: "description", content: "Mapa, catálogo de ubicaciones y asignación GPS para CloudPhones ProteoMesh." },
      { property: "og:title", content: "ProteoMesh · Centro de geolocalización" },
      { property: "og:description", content: "Organizá ubicaciones, accesos rápidos y asignaciones GPS en un solo espacio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LocationsWorkspace,
});
