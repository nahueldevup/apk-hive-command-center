import { createFileRoute } from '@tanstack/react-router';
import { LocationsWorkspace } from '@/components/proteo/LocationsWorkspace';

export const Route = createFileRoute('/mapa')({
  head: () => ({ meta: [
    { title: 'ProteoMesh · Mapa y Ubicaciones' },
    { name: 'description', content: 'Gestioná puntos GPS, grupos y ubicaciones predeterminadas para tu granja de CloudPhones.' },
    { property: 'og:title', content: 'ProteoMesh · Mapa y Ubicaciones' },
    { property: 'og:description', content: 'Explorá el mapa y asigná ubicaciones a tus CloudPhones.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: LocationsWorkspace,
});