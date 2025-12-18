import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

// Fixed demo coordinates per zone (fallback)
const ZONE_COORDS = {
	1: { lat: 19.076, lng: 72.8777 }, // Mumbai
	2: { lat: 28.6139, lng: 77.209 }, // Delhi
	3: { lat: 12.9716, lng: 77.5946 }, // Bengaluru
	4: { lat: 13.0827, lng: 80.2707 }, // Chennai
	5: { lat: 22.5726, lng: 88.3639 }, // Kolkata
};

const DEFAULT_COORD = { lat: 20.5937, lng: 78.9629 }; // India center fallback

function getCoords(request) {
	// If request already has lat/lng, use them (optional future field)
	if (request?.latitude && request?.longitude) {
		return { lat: Number(request.latitude), lng: Number(request.longitude) };
	}

	// Fallback to zone-based coordinates
	const zoneId = request?.zoneId;
	if (zoneId && ZONE_COORDS[zoneId]) {
		return ZONE_COORDS[zoneId];
	}

	return DEFAULT_COORD;
}

function createMarker(google, map, request) {
	const position = getCoords(request);
	const marker = new google.maps.Marker({
		position,
		map,
		title: `Request #${request.requestId}`,
	});

	const info = new google.maps.InfoWindow({
		content: `
      <div style="font-size: 13px; line-height: 1.4;">
        <div><strong>Request #${request.requestId}</strong></div>
        ${request.wasteType ? `<div>Waste: ${request.wasteType}</div>` : ""}
        ${request.zoneId ? `<div>Zone: ${request.zoneId}</div>` : ""}
        ${request.pickupAddress ? `<div>Address: ${request.pickupAddress}</div>` : ""}
      </div>
    `,
	});

	marker.addListener("click", () => {
		info.open({ anchor: marker, map, shouldFocus: false });
	});

	return marker;
}

export function AdminRequestMap({ requests }) {
	const mapRef = useRef(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		let mapInstance;
		let markers = [];
		let cancelled = false;

		loadGoogleMaps()
			.then((google) => {
				if (cancelled) return;
				if (!mapRef.current) return;

				const center = requests?.length ? getCoords(requests[0]) : DEFAULT_COORD;
				mapInstance = new google.maps.Map(mapRef.current, {
					center,
					zoom: 5,
				});

				if (requests?.length) {
					const bounds = new google.maps.LatLngBounds();
					requests.forEach((req) => {
						const marker = createMarker(google, mapInstance, req);
						markers.push(marker);
						bounds.extend(marker.getPosition());
					});
					if (!bounds.isEmpty()) {
						mapInstance.fitBounds(bounds);
					}
				}
			})
			.catch((err) => {
				console.error("Map load error:", err);
				setError("Map unavailable");
			});

		return () => {
			cancelled = true;
			markers.forEach((m) => m.setMap(null));
		};
	}, [requests]);

	return (
		<div className="border border-gray-200 rounded-lg bg-white shadow-sm">
			<div className="p-4 border-b border-gray-200 flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Waste Requests Map</h3>
					<p className="text-sm text-gray-500">All requests (markers only, no routing)</p>
				</div>
			</div>
			<div className="p-4">
				<div
					ref={mapRef}
					className="w-full rounded-lg border border-gray-200"
					style={{ height: 320, minHeight: 320 }}
				/>
				{error && (
					<div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}

export function CollectorRequestMap({ requests }) {
	const mapRef = useRef(null);
	const [error, setError] = useState(null);

	// Only show first assigned request marker
	const request = requests?.[0];

	useEffect(() => {
		let mapInstance;
		let marker;
		let cancelled = false;

		if (!request) return;

		loadGoogleMaps()
			.then((google) => {
				if (cancelled) return;
				if (!mapRef.current) return;

				const center = getCoords(request);
				mapInstance = new google.maps.Map(mapRef.current, {
					center,
					zoom: 10,
				});

				marker = createMarker(google, mapInstance, request);
			})
			.catch((err) => {
				console.error("Map load error:", err);
				setError("Map unavailable");
			});

		return () => {
			cancelled = true;
			if (marker) marker.setMap(null);
		};
	}, [request]);

	return (
		<div className="border border-gray-200 rounded-lg bg-white shadow-sm">
			<div className="p-4 border-b border-gray-200 flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Assigned Pickup Map</h3>
					<p className="text-sm text-gray-500">Your assigned request (marker only)</p>
				</div>
			</div>
			<div className="p-4">
				<div
					ref={mapRef}
					className="w-full rounded-lg border border-gray-200"
					style={{ height: 280, minHeight: 280 }}
				/>
				{error && (
					<div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
						{error}
					</div>
				)}
				{!request && (
					<div className="mt-3 text-sm text-gray-500">No assigned requests to show.</div>
				)}
			</div>
		</div>
	);
}

