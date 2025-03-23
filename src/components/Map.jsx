import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Snackbar, Button, Box } from '@mui/material';

// Fix for default marker icons in React-Leaflet
const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helsinki coordinates
const HELSINKI_COORDINATES = [60.1699, 24.9384];

// Custom poop marker icon
const poopIcon = new L.DivIcon({
  className: 'poop-marker',
  html: '💩',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export default function Map() {
  const [poopLocations, setPoopLocations] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMapClick = (location) => {
    setSelectedLocation(location);
    setSnackbarOpen(true);
  };

  const handleReportPoop = () => {
    if (selectedLocation) {
      setPoopLocations([...poopLocations, selectedLocation]);
      setSnackbarOpen(false);
      setSelectedLocation(null);
    }
  };

  const handleCancelReport = () => {
    setSnackbarOpen(false);
    setSelectedLocation(null);
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={HELSINKI_COORDINATES}
        zoom={13}
        maxZoom={19}
        minZoom={10}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker onLocationSelect={handleMapClick} />
        {poopLocations.map((location, index) => (
          <Marker
            key={index}
            position={location}
            icon={poopIcon}
          />
        ))}
      </MapContainer>

      <Snackbar
        open={snackbarOpen}
        message="Report dog poop at this location?"
        action={
          <Box>
            <Button color="primary" onClick={handleReportPoop}>
              Yes
            </Button>
            <Button color="error" onClick={handleCancelReport}>
              No
            </Button>
          </Box>
        }
      />
    </div>
  );
} 