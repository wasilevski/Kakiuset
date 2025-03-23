import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Snackbar, Button, Box, Alert } from '@mui/material';
import { sheetsService } from '../services/sheetsService';

// Helsinki coordinates
const HELSINKI_LAT = 60.1699;
const HELSINKI_LNG = 24.9384;

// Custom poop icon
const poopIcon = L.divIcon({
  html: '💩',
  className: 'poop-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

export default function Map() {
  const [poopLocations, setPoopLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const reports = await sheetsService.getReports();
        setPoopLocations(reports.map(report => ({
          latitude: parseFloat(report[1]),
          longitude: parseFloat(report[2]),
          timestamp: report[0]
        })));
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleMapClick = (e) => {
    if (e && e.latlng) {
      setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmReport = async () => {
    try {
      setIsLoading(true);
      await sheetsService.addReport(selectedLocation.lat, selectedLocation.lng);
      setShowConfirmDialog(false);
      setSelectedLocation(null);
      // Refresh reports after adding a new one
      const reports = await sheetsService.getReports();
      setPoopLocations(reports.map(report => ({
        latitude: parseFloat(report[1]),
        longitude: parseFloat(report[2]),
        timestamp: report[0]
      })));
    } catch (error) {
      console.error('Error adding report:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReport = () => {
    setSelectedLocation(null);
    setShowConfirmDialog(false);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={[HELSINKI_LAT, HELSINKI_LNG]}
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
        <MapClickHandler onMapClick={handleMapClick} />
        {poopLocations.map((location, index) => (
          <Marker
            key={index}
            position={[location.latitude, location.longitude]}
            icon={poopIcon}
          />
        ))}
      </MapContainer>

      <Snackbar
        open={showConfirmDialog}
        message="Report dog poop at this location?"
        action={
          <Box>
            <Button color="primary" onClick={handleConfirmReport} disabled={isLoading}>
              Yes
            </Button>
            <Button color="error" onClick={handleCancelReport} disabled={isLoading}>
              No
            </Button>
          </Box>
        }
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
} 