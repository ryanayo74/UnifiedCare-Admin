import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ onSelectAddress }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Initialize the map centered on Cebu City with default zoom
      const map = L.map(mapRef.current).setView([10.3157, 123.8854], 13);

      // Set the tile layer for the map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Define Cebu City bounds
      const cebuCityBounds = [
        [10.2582, 123.8366],  // Southwest boundary
        [10.4783, 124.0362]   // Northeast boundary
      ];

      // Restrict the view to Cebu City bounds
      map.setMaxBounds(cebuCityBounds);
      map.on('drag', function () {
        map.panInsideBounds(cebuCityBounds, { animate: false });
      });

      // Add a draggable marker to the map (starting in Cebu City)
      const marker = L.marker([10.3157, 123.8854], { draggable: true }).addTo(map);

      // Event listener for marker drag end
      marker.on('dragend', function () {
        const { lat, lng } = marker.getLatLng();
        // Fetch the address using reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
          .then(response => response.json())
          .then(data => {
            if (data && data.display_name) {
              onSelectAddress(data.display_name);  // Pass the selected address to the parent component
            }
          })
          .catch(err => console.error('Error fetching address:', err));
      });

      // Center the map and marker on the user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13);  // Center the map on the user's location
            marker.setLatLng([latitude, longitude]);  // Move the marker to the user's location
          },
          (error) => {
            console.error("Error getting location: ", error);
          }
        );
      }

      mapInstanceRef.current = map;
    }
  }, [onSelectAddress]);

  return <div ref={mapRef} style={{ height: "400px", width: "100%" }} />;
};

export default LeafletMap;
