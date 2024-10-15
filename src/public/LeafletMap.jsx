import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ onSelectAddress }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Initialize the map
      const map = L.map(mapRef.current).setView([51.505, -0.09], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([51.505, -0.09], { draggable: true }).addTo(map);

      // Event listener for marker drag
      marker.on('dragend', function () {
        const { lat, lng } = marker.getLatLng();
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
          .then(response => response.json())
          .then(data => {
            if (data && data.display_name) {
              onSelectAddress(data.display_name);
            }
          })
          .catch(err => console.error('Error fetching address:', err));
      });

      // Use the Geolocation API to get the user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13); // Center map on user's location
            marker.setLatLng([latitude, longitude]); // Move marker to user's location
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