import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Location, LocationGroup } from '@/lib/locations';

export default function LocationMap({ locations, groups, selected, onSelect, onPick, fitKey }: { locations: Location[]; groups: LocationGroup[]; selected: Location | null; onSelect: (id: string) => void; onPick: (lat: number, lng: number) => void; fitKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const callbacks = useRef({ onSelect, onPick });
  callbacks.current = { onSelect, onPick };
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { zoomControl: false }).setView([-34.603722, -58.381592], 12);
    mapRef.current = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', e => callbacks.current.onPick(e.latlng.lat, e.latlng.lng));
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    locations.forEach(l => {
      const color = groups.find(g => g.id === l.group_id)?.color ?? 'primary';
      const active = selected?.id === l.id;
      const marker = L.marker([l.latitude, l.longitude], { icon: L.divIcon({ className: 'location-marker-wrap', html: `<span class="location-marker marker-${color} ${active ? 'marker-active' : ''}"><span></span></span>`, iconSize: [30, 38], iconAnchor: [15, 35] }) });
      const label = document.createElement('span'); label.textContent = l.name;
      marker.bindTooltip(label, { direction: 'top', offset: [0, -30] }).on('click', () => callbacks.current.onSelect(l.id)).addTo(layer);
    });
  }, [locations, groups, selected?.id]);
  useEffect(() => { if (selected) mapRef.current?.flyTo([selected.latitude, selected.longitude], 13, { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.6 }); }, [selected?.id, selected?.latitude, selected?.longitude]);
  useEffect(() => { if (fitKey && locations.length) mapRef.current?.fitBounds(L.latLngBounds(locations.map(l => [l.latitude, l.longitude])), { padding: [55, 55], maxZoom: 13 }); }, [fitKey]);
  return <div ref={container} className="location-map h-full w-full" aria-label="Mapa interactivo de ubicaciones" />;
}