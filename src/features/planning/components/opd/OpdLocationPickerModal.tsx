// src/features/planning/components/opd/OpdLocationPickerModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    MapPin, Search, Layers, Check, X, 
    Navigation, Building2, Loader2, ArrowLeft, Crosshair
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';

interface OpdLocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCoordinates?: string; // Format: "latitude,longitude"
    initialAddress?: string;
    onSelectLocation: (coordinates: string, address?: string) => void;
}

interface SearchResult {
    id: string;
    displayName: string;
    lat: number;
    lng: number;
}

export default function OpdLocationPickerModal({
    isOpen,
    onClose,
    initialCoordinates = '-7.250445,112.768845', // Default: Surabaya / Jawa Timur
    initialAddress = '',
    onSelectLocation,
}: OpdLocationPickerModalProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // State koordinat tengah peta
    const [currentLat, setCurrentLat] = useState<number>(-7.250445);
    const [currentLng, setCurrentLng] = useState<number>(112.768845);
    const [currentAddress, setCurrentAddress] = useState<string>(initialAddress);
    const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

    // Search bar state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);

    // Inisialisasi koordinat awal
    useEffect(() => {
        if (initialCoordinates) {
            const parts = initialCoordinates.split(',');
            if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    setCurrentLat(lat);
                    setCurrentLng(lng);
                }
            }
        }
    }, [initialCoordinates]);

    // Reverse Geocoding via Photon Komoot (CORS-Friendly, Fast, OpenStreetMap Based)
    const reverseGeocode = async (lat: number, lng: number) => {
        setIsResolvingAddress(true);
        try {
            const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Reverse geocoding response error');
            const data = await res.json();
            
            const feature = data.features?.[0];
            if (feature && feature.properties) {
                const props = feature.properties;
                const parts: string[] = [];
                if (props.name) parts.push(props.name);
                if (props.street) {
                    const streetPart = props.housenumber ? `${props.street} No. ${props.housenumber}` : props.street;
                    if (!parts.includes(streetPart)) parts.push(streetPart);
                }
                if (props.district && !parts.includes(props.district)) parts.push(props.district);
                if (props.city && !parts.includes(props.city)) parts.push(props.city);
                if (props.state && !parts.includes(props.state)) parts.push(props.state);

                const formatted = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setCurrentAddress(formatted);
            }
        } catch (err) {
            console.debug('Reverse geocode fallback:', err);
        } finally {
            setIsResolvingAddress(false);
        }
    };

    // Forward Geocoding dengan Debounce 450ms via Photon Komoot
    const handleSearchInput = (query: string) => {
        setSearchQuery(query);

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            setShowResultsDropdown(false);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lat=${currentLat}&lon=${currentLng}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();

                const results: SearchResult[] = (data.features || []).map((f: any, idx: number) => {
                    const props = f.properties || {};
                    const parts: string[] = [];
                    if (props.name) parts.push(props.name);
                    if (props.street) parts.push(props.street);
                    if (props.city) parts.push(props.city);
                    if (props.state) parts.push(props.state);
                    if (props.country) parts.push(props.country);

                    return {
                        id: `${props.osm_id || idx}-${idx}`,
                        displayName: parts.join(', ') || props.name || 'Lokasi Terdeteksi',
                        lng: f.geometry?.coordinates?.[0] || 0,
                        lat: f.geometry?.coordinates?.[1] || 0,
                    };
                });

                setSearchResults(results);
                setShowResultsDropdown(results.length > 0);
            } catch (err) {
                console.debug('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 450);
    };

    // Inisialisasi Peta Leaflet Fullscreen Langsung
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        let mapInstance: any = null;

        const initMap = async () => {
            if (!mapContainerRef.current || !isMounted) return;

            const L = (await import('leaflet')).default;

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            // Buat instance Leaflet Map
            mapInstance = L.map(mapContainerRef.current, {
                center: [currentLat, currentLng],
                zoom: 16,
                zoomControl: false,
                preferCanvas: true,
            });

            L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

            // Layer Google Maps Roadmap
            const googleRoadmap = L.tileLayer(
                'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
                {
                    maxZoom: 20,
                    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                    attribution: '&copy; Google Maps',
                }
            );

            // Layer Google Maps Satellite Hybrid
            const googleSatellite = L.tileLayer(
                'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
                {
                    maxZoom: 20,
                    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                    attribution: '&copy; Google Maps Satellite',
                }
            );

            if (mapType === 'satellite') {
                googleSatellite.addTo(mapInstance);
            } else {
                googleRoadmap.addTo(mapInstance);
            }

            // Event Listeners saat Peta Digeser
            mapInstance.on('movestart', () => {
                if (isMounted) setIsDragging(true);
            });

            let moveDebounceTimer: NodeJS.Timeout;
            mapInstance.on('move', () => {
                const center = mapInstance.getCenter();
                if (isMounted) {
                    setCurrentLat(center.lat);
                    setCurrentLng(center.lng);
                }
            });

            mapInstance.on('moveend', () => {
                const center = mapInstance.getCenter();
                if (isMounted) {
                    setIsDragging(false);
                    setCurrentLat(center.lat);
                    setCurrentLng(center.lng);
                    clearTimeout(moveDebounceTimer);
                    moveDebounceTimer = setTimeout(() => {
                        reverseGeocode(center.lat, center.lng);
                    }, 400);
                }
            });

            mapInstanceRef.current = mapInstance;

            // Trigger InvalidateSize seketika
            setTimeout(() => mapInstance?.invalidateSize(), 50);
            setTimeout(() => mapInstance?.invalidateSize(), 200);
        };

        initMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isOpen, mapType]);

    // Ganti Tipe Peta (Roadmap vs Satellite)
    const toggleMapType = () => {
        setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap');
    };

    // Terbang ke hasil pencarian
    const selectSearchResult = (item: SearchResult) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([item.lat, item.lng], 17, { duration: 1.5 });
        }
        setCurrentLat(item.lat);
        setCurrentLng(item.lng);
        setCurrentAddress(item.displayName);
        setShowResultsDropdown(false);
        setSearchQuery('');
    };

    // Deteksi Lokasi Pengguna Saat Ini (GPS Geolocation)
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Peramban Anda tidak mendukung geolokasi GPS.');
            return;
        }

        toast.info('Mendeteksi titik koordinat GPS Anda...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
                }
                toast.success('Lokasi GPS berhasil ditemukan');
            },
            () => {
                toast.error('Gagal mendapatkan izin lokasi GPS.');
            },
            { enableHighAccuracy: true }
        );
    };

    // Submit Titik Lokasi Terpilih
    const handleConfirmLocation = () => {
        const formattedCoords = `${currentLat.toFixed(6)},${currentLng.toFixed(6)}`;
        onSelectLocation(formattedCoords, currentAddress);
        toast.success('Titik Lokasi & Koordinat Geospasial Ditetapkan', {
            description: formattedCoords
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-900 flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* 1. TOPBAR HEADER LEGA & BERSIH */}
            <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between z-10 shrink-0 shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Tutup Peta"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            Geotagging Titik Lokasi Kantor Perangkat Daerah (OPD)
                        </h2>
                        <p className="text-slate-400 text-xs">
                            Geser dan perbesar peta selayar penuh; posisikan pin tepat di atas gedung kantor dinas.
                        </p>
                    </div>
                </div>

                {/* TOMBOL KANAN: TOGGLE LAYER & GPS */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleMapType}
                        className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white rounded-none flex items-center gap-1.5 font-semibold"
                    >
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        {mapType === 'roadmap' ? 'Mode Satelit' : 'Mode Peta Jalan'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseCurrentLocation}
                        className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white rounded-none flex items-center gap-1.5 font-semibold"
                    >
                        <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                        Lokasi Saya
                    </Button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. AREA PETA FULLSCREEN SELAYAR */}
            <div className="relative flex-1 w-full h-full bg-slate-900 overflow-hidden">
                {/* SEARCH BAR MENGAMBANG DI KIRI ATAS */}
                <div className="absolute top-4 left-4 z-1000 w-80 sm:w-96 space-y-1">
                    <div className="relative bg-white/95 backdrop-blur border border-slate-300 shadow-2xl flex items-center px-3 h-10">
                        <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchInput(e.target.value)}
                            placeholder="Cari kantor dinas, jalan, distrik, atau kota..."
                            className="w-full text-xs bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 font-semibold"
                        />
                        {isSearching && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0 ml-2" />}
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setShowResultsDropdown(false);
                                }}
                                className="text-slate-400 hover:text-slate-600 ml-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* DROPDOWN HASIL PENCARIAN */}
                    {showResultsDropdown && searchResults.length > 0 && (
                        <div className="bg-white border border-slate-200 shadow-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                            {searchResults.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectSearchResult(item)}
                                    className="w-full text-left p-3 hover:bg-blue-50/70 transition-colors flex items-start gap-2.5 text-xs"
                                >
                                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="font-bold text-slate-800 line-clamp-1">{item.displayName}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                            {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* WADAH PETA LEAFLET SELAYAR PENUH */}
                <div ref={mapContainerRef} className="w-full h-full z-0" />

                {/* 3. CENTER PIN TRACKER (MARKER DIAM DI TENGAH ALA GOJEK/GRAB) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-500">
                    <div className="relative flex flex-col items-center -translate-y-1/2">
                        {/* Pin Icon dengan Animasi Lift saat Dragging */}
                        <div
                            className={`transition-transform duration-200 ease-out ${
                                isDragging ? '-translate-y-3 scale-110' : 'translate-y-0 scale-100'
                            }`}
                        >
                            <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-2xl border-2 border-white flex items-center justify-center ring-4 ring-blue-500/20">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            {/* Titik Lancip Bawah */}
                            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-blue-600 mx-auto -mt-0.5" />
                        </div>

                        {/* Bayangan Pin di Tanah */}
                        <div
                            className={`w-4 h-2 bg-slate-950/50 rounded-full blur-[1px] transition-all duration-200 ${
                                isDragging ? 'scale-50 opacity-30 mt-3.5' : 'scale-100 opacity-80 mt-1'
                            }`}
                        />
                    </div>
                </div>

                {/* 4. FLOATING BOTTOM CARD PANEL (MENGAMBANG DI BAWAH TENGAH SEPERTI APLIKASI GIS MODERN) */}
                <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[680px] z-1000">
                    <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Koordinat Terpilih:
                                </span>
                                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100">
                                    {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                                </span>
                                {isResolvingAddress && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                        Mendeteksi alamat...
                                    </span>
                                )}
                            </div>

                            <p className="text-xs font-semibold text-slate-800 truncate leading-relaxed" title={currentAddress}>
                                📍 {currentAddress || 'Geser peta untuk memilih titik lokasi kantor dinas.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="rounded-none border-slate-300 text-xs px-4 h-9"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmLocation}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold px-6 h-9 shadow-lg flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                Terapkan Titik Lokasi Ini
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
