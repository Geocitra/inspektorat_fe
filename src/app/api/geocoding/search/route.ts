// src/app/api/geocoding/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ data: [] });
    }

    try {
        // 1. Coba via Photon Komoot (Super Cepat, CORS Friendly, Data Global OSM)
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=id`;
        const photonRes = await fetch(photonUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'GeoAPIP-Inspektorat/1.0',
            },
            next: { revalidate: 3600 }, // Cache 1 jam
        });

        if (photonRes.ok) {
            const photonData = await photonRes.json();
            const features = photonData.features || [];

            if (features.length > 0) {
                const results = features.map((f: any) => {
                    const props = f.properties || {};
                    const nameParts = [
                        props.name,
                        props.street,
                        props.district,
                        props.city || props.county,
                        props.state,
                        props.country,
                    ].filter(Boolean);

                    return {
                        place_id: props.osm_id || Math.random(),
                        display_name: nameParts.join(', '),
                        lat: f.geometry.coordinates[1].toString(),
                        lon: f.geometry.coordinates[0].toString(),
                    };
                });

                return NextResponse.json({ data: results });
            }
        }

        // 2. Fallback via Nominatim OpenStreetMap
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=id&limit=6&addressdetails=1`;
        const nomRes = await fetch(nominatimUrl, {
            headers: {
                'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
                'User-Agent': 'GeoAPIP-Inspektorat/1.0 (apip-support@inspektorat.go.id)',
            },
            next: { revalidate: 3600 },
        });

        if (nomRes.ok) {
            const nomData = await nomRes.json();
            return NextResponse.json({ data: nomData || [] });
        }

        return NextResponse.json({ data: [] });
    } catch (err: any) {
        return NextResponse.json({ data: [], error: err.message }, { status: 500 });
    }
}
