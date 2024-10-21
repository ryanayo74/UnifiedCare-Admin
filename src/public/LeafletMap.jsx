import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ address, onSelectAddress }) => {
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (showMap && !mapInstanceRef.current) {
      // Initialize the map centered on Cebu Province with a broader zoom level
      const map = L.map(mapRef.current).setView([10.3119, 123.9002], 10); // Center on Cebu Province

      // Set the tile layer for the map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add a draggable marker to the map
      const marker = L.marker([10.3119, 123.9002], { draggable: true }).addTo(map);
      markerRef.current = marker;

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

      mapInstanceRef.current = map;
    }
  }, [showMap, onSelectAddress]);

  useEffect(() => {
    if (address) {
      setShowMap(true);

      if (mapInstanceRef.current && markerRef.current) {
        // Fetch coordinates for the selected address using Nominatim API
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`)
          .then(response => response.json())
          .then(data => {
            if (data.length > 0) {
              const { lat, lon } = data[0];
              // Update map view and marker position based on selected address
              mapInstanceRef.current.setView([lat, lon], 13);
              markerRef.current.setLatLng([lat, lon]);
            }
          })
          .catch(err => console.error('Error fetching coordinates:', err));
      }
    }
  }, [address]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          // Set the map view to the user's current location
          mapInstanceRef.current.setView([latitude, longitude], 13);
          markerRef.current.setLatLng([latitude, longitude]);

          // Fetch the address based on current location
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              if (data && data.display_name) {
                onSelectAddress(data.display_name); // Pass the selected address to the parent component
              }
            })
            .catch(err => console.error('Error fetching address:', err));
        }
      }, (error) => {
        console.error("Error getting location:", error);
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div>
      {/* Button to get current location */}
      <button onClick={getCurrentLocation} style={{ marginBottom: '10px' }}>
        Use Current Location
      </button>
      {/* Show map only after address is selected */}
      {showMap && (
        <div ref={mapRef} style={{ height: "400px", width: "100%" }} />
      )}
    </div>
  );
};

export default LeafletMap;