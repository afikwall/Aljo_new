import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface GeofenceMapPreviewProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  radiusMeters?: number;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  height?: string;
}

export const GeofenceMapPreview = ({
  latitude,
  longitude,
  radiusMeters = 200,
  draggable = false,
  onPositionChange,
  height = "300px",
}: GeofenceMapPreviewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  const hasValidCoords =
    latitude != null &&
    longitude != null &&
    !(latitude === 0 && longitude === 0);

  useEffect(() => {
    if (!hasValidCoords || !mapContainerRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      // Fix Leaflet marker icons in Vite
      const iconRetinaUrl = (await import("leaflet/dist/images/marker-icon-2x.png")).default;
      const iconUrl = (await import("leaflet/dist/images/marker-icon.png")).default;
      const shadowUrl = (await import("leaflet/dist/images/marker-shadow.png")).default;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
      });

      if (cancelled || !mapContainerRef.current) return;

      // Clean up existing map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView(
        [latitude!, longitude!],
        15
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([latitude!, longitude!], {
        draggable,
      }).addTo(map);

      const circle = L.circle([latitude!, longitude!], {
        radius: radiusMeters,
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.15,
        color: "hsl(var(--primary))",
        weight: 2,
      }).addTo(map);

      if (draggable && onPositionChange) {
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onPositionChange(pos.lat, pos.lng);
        });
      }

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
      setLoaded(true);

      // Fix map size after render
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hasValidCoords, latitude, longitude, draggable]);

  // Update circle radius when it changes
  useEffect(() => {
    if (circleRef.current && loaded) {
      circleRef.current.setRadius(radiusMeters);
    }
  }, [radiusMeters, loaded]);

  // Update marker/circle position when coords change (without re-init)
  useEffect(() => {
    if (markerRef.current && circleRef.current && loaded && hasValidCoords) {
      markerRef.current.setLatLng([latitude!, longitude!]);
      circleRef.current.setLatLng([latitude!, longitude!]);
      mapRef.current?.setView([latitude!, longitude!], mapRef.current.getZoom());
    }
  }, [latitude, longitude, loaded, hasValidCoords]);

  if (!hasValidCoords) {
    return (
      <div
        className="rounded-lg border overflow-hidden bg-muted/30 flex flex-col items-center justify-center gap-2"
        style={{ height }}
      >
        <MapPin className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Set coordinates to preview the geofence area
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};