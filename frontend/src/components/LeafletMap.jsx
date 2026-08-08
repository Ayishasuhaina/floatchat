import React, { useEffect, useRef } from 'react';

const LeafletMap = ({ points, center, zoom = 4 }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // If Leaflet is not available, poll for it
    if (!window.L) {
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          initMap();
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = window.L;

      // Calculate center if not provided
      let mapCenter = center || [12.0, 78.0]; // Default near Indian Ocean
      if (!center && points && points.length > 0) {
        const lats = points.map(p => p.latitude).filter(l => l != null);
        const lons = points.map(p => p.longitude).filter(l => l != null);
        if (lats.length > 0) {
          mapCenter = [
            lats.reduce((a, b) => a + b, 0) / lats.length,
            lons.reduce((a, b) => a + b, 0) / lons.length
          ];
        }
      }

      // Create map instance
      const map = L.map(mapContainerRef.current).setView(mapCenter, zoom);
      mapInstanceRef.current = map;

      // CartoDB Dark Matter tile layer for an extremely premium dark theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Add circle markers for each point
      points.forEach(pt => {
        if (pt.latitude == null || pt.longitude == null) return;
        
        // Custom circle marker (sleek, customizable vector style instead of pixelated default pin)
        const marker = L.circleMarker([pt.latitude, pt.longitude], {
          radius: 7,
          fillColor: pt.color || '#38bdf8', // Neon Sky-Blue
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.85
        });

        // Dynamic popup html
        const popupContent = `
          <div style="font-family: Inter, sans-serif; color: #1e293b; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">Float ${pt.float_id || 'ARGO'}</h4>
            <p style="margin: 0 0 2px 0; font-size: 12px;"><b>Location:</b> ${pt.latitude.toFixed(3)}°N, ${pt.longitude.toFixed(3)}°E</p>
            ${pt.timestamp ? `<p style="margin: 0 0 2px 0; font-size: 12px;"><b>Time:</b> ${new Date(pt.timestamp).toLocaleDateString()}</p>` : ''}
            ${pt.cycle_number !== undefined ? `<p style="margin: 0 0 2px 0; font-size: 12px;"><b>Cycle:</b> ${pt.cycle_number}</p>` : ''}
            ${pt.value ? `<p style="margin: 0 0 2px 0; font-size: 12px;"><b>Reading:</b> ${pt.value}</p>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent).addTo(map);
      });

      // Fit bounds if we have multiple points
      if (points.length > 1) {
        try {
          const latLons = points
            .filter(p => p.latitude != null && p.longitude != null)
            .map(p => [p.latitude, p.longitude]);
          if (latLons.length > 0) {
            const bounds = L.latLngBounds(latLons);
            map.fitBounds(bounds, { padding: [30, 30] });
          }
        } catch (err) {
          console.warn("Failed to fit bounds:", err);
        }
      }
    }

    // Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points, center, zoom]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[350px] rounded-xl border border-slate-800 shadow-inner"
        style={{ background: '#0f172a' }}
      />
    </div>
  );
};

export default LeafletMap;
