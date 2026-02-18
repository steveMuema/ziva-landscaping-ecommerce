"use client";

import { useEffect, useRef, useState } from "react";

const MAP_SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 }; // Nairobi

type GoogleMapProps = {
  /** Address strings to geocode and show as markers (e.g. store locations). */
  addresses?: string[];
  /** Height of the map container (CSS value). */
  height?: string;
  /** Optional initial zoom when no addresses. */
  zoom?: number;
  className?: string;
};

// Minimal types for Google Maps JS API (avoids @types/google.maps dependency)
interface GoogleMapsNamespace {
  Map: new (el: HTMLElement, opts: { center: { lat: number; lng: number }; zoom: number; [k: string]: unknown }) => { setCenter: (c: { lat: number; lng: number }) => void; fitBounds: (b: unknown, p?: object) => void };
  Marker: new (opts: { position: { lat: number; lng: number }; map: unknown; title?: string }) => { setMap: (m: unknown) => void };
  Geocoder: new () => { geocode: (req: { address: string }, cb: (results: { geometry: { location: { lat: () => number; lng: () => number } } }[] | null, status: string) => void) => void };
  LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void };
}

declare global {
  interface Window {
    google?: { maps: GoogleMapsNamespace };
    __googleMapsCallback?: () => void;
  }
}

function loadGoogleMapsScript(apiKey: string): Promise<GoogleMapsNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("window undefined"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src^="${MAP_SCRIPT_URL}"]`);
    if (existing) {
      const check = () => (window.google?.maps ? resolve(window.google.maps) : setTimeout(check, 50));
      check();
      return;
    }

    window.__googleMapsCallback = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps failed to load"));
    };

    const script = document.createElement("script");
    script.src = `${MAP_SCRIPT_URL}?key=${encodeURIComponent(apiKey)}&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });
}

export default function GoogleMap({ addresses = [], height = "280px", zoom = 12, className = "" }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  const apiKey = typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "string"
    ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim()
    : "";

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    setError(null);

    loadGoogleMapsScript(apiKey)
      .then((maps) => {
        if (!containerRef.current) return;

        const map = new maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        mapRef.current = map;

        const bounds = new maps.LatLngBounds();
        let hasBounds = false;

        const geocoder = new maps.Geocoder();

        const placeMarker = (lat: number, lng: number, label?: string) => {
          const marker = new maps.Marker({
            position: { lat, lng },
            map,
            title: label ?? undefined,
          });
          markersRef.current.push(marker);
          bounds.extend({ lat, lng });
          hasBounds = true;
        };

        if (addresses.length === 0) {
          placeMarker(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        }

        addresses.forEach((address) => {
          if (!address.trim()) return;
          geocoder.geocode({ address: address.trim() }, (results, status) => {
            if (status !== "OK" || !results?.[0]) return;
            const loc = results[0].geometry.location;
            placeMarker(loc.lat(), loc.lng(), address.trim());
            if (markersRef.current.length === 1) {
              map.setCenter({ lat: loc.lat(), lng: loc.lng() });
            }
            if (hasBounds) {
              map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
            }
          });
        });

        if (addresses.length > 0) {
          const id = setTimeout(() => {
            if (hasBounds) map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }, 1500);
          return () => clearTimeout(id);
        }
      })
      .catch((err) => setError(err?.message ?? "Failed to load map"));
  }, [apiKey, zoom]); // eslint-disable-line react-hooks/exhaustive-deps -- addresses effect below

  useEffect(() => {
    if (!apiKey || !mapRef.current || addresses.length === 0) return;

    const maps = window.google?.maps;
    if (!maps) return;

    (markersRef.current as { setMap: (m: null) => void }[]).forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new maps.LatLngBounds();
    const geocoder = new maps.Geocoder();

    addresses.forEach((address) => {
      if (!address.trim()) return;
      geocoder.geocode({ address: address.trim() }, (results, status) => {
        if (status !== "OK" || !results?.[0]) return;
        const loc = results[0].geometry.location;
        const marker = new maps.Marker({
          position: { lat: loc.lat(), lng: loc.lng() },
          map: mapRef.current!,
          title: address.trim(),
        });
        markersRef.current.push(marker);
        bounds.extend({ lat: loc.lat(), lng: loc.lng() });
        (mapRef.current as { fitBounds: (b: unknown, o?: object) => void })?.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      });
    });
  }, [apiKey, addresses]);

  if (!apiKey) return null;

  return (
    <div className={className}>
      <div ref={containerRef} style={{ height, minHeight: "200px" }} className="w-full rounded-lg bg-slate-100" />
      {error && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400" role="alert">
          Map could not be loaded. Check your API key and that Maps JavaScript API and Geocoding API are enabled.
        </p>
      )}
    </div>
  );
}
