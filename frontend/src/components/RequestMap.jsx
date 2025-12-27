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

function createMarker(google, map, request, isAdmin = false) {
	const position = getCoords(request);
	const marker = new google.maps.Marker({
		position,
		map,
		title: `Request #${request.requestId}`,
	});

	// Admin popup: Request ID, Waste Type, Zone, Address
	// Collector popup: Request ID, Zone, Address
	const infoContent = isAdmin
		? `
      <div style="font-size: 13px; line-height: 1.5; padding: 4px; min-width: 200px;">
        <div style="font-weight: 600; margin-bottom: 6px; color: #111827;">Request #${request.requestId}</div>
        ${request.wasteType ? `<div style="margin-bottom: 4px;"><strong>Waste Type:</strong> ${request.wasteType}</div>` : ""}
        ${request.zoneName ? `<div style="margin-bottom: 4px;"><strong>Zone:</strong> ${request.zoneName}</div>` : request.zoneId ? `<div style="margin-bottom: 4px;"><strong>Zone:</strong> Zone ${request.zoneId}</div>` : ""}
        ${request.pickupAddress ? `<div style="margin-top: 4px; color: #4B5563;"><strong>Address:</strong> ${request.pickupAddress}</div>` : ""}
      </div>
    `
		: `
      <div style="font-size: 13px; line-height: 1.5; padding: 4px; min-width: 200px;">
        <div style="font-weight: 600; margin-bottom: 6px; color: #111827;">Request #${request.requestId}</div>
        ${request.zoneName ? `<div style="margin-bottom: 4px;"><strong>Zone:</strong> ${request.zoneName}</div>` : request.zoneId ? `<div style="margin-bottom: 4px;"><strong>Zone:</strong> Zone ${request.zoneId}</div>` : ""}
        ${request.pickupAddress ? `<div style="margin-top: 4px; color: #4B5563;"><strong>Address:</strong> ${request.pickupAddress}</div>` : ""}
      </div>
    `;

	const info = new google.maps.InfoWindow({
		content: infoContent,
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
						const marker = createMarker(google, mapInstance, req, true); // true = admin map
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
					<p className="text-sm text-gray-500">Visualization of all waste pickup requests</p>
				</div>
			</div>
			<div className="p-4">
				{error ? (
					<div className="w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ height: 320, minHeight: 320 }}>
						<div className="text-center">
							<p className="text-sm font-medium text-gray-700">Map unavailable</p>
							<p className="text-xs text-gray-500 mt-1">Google Maps failed to load</p>
						</div>
					</div>
				) : (
					<div
						ref={mapRef}
						className="w-full rounded-lg border border-gray-200"
						style={{ height: 320, minHeight: 320 }}
					/>
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

				marker = createMarker(google, mapInstance, request, false); // false = collector map
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
					<p className="text-sm text-gray-500">Visualization of your assigned request location</p>
				</div>
			</div>
			<div className="p-4">
				{error ? (
					<div className="w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ height: 280, minHeight: 280 }}>
						<div className="text-center">
							<p className="text-sm font-medium text-gray-700">Map unavailable</p>
							<p className="text-xs text-gray-500 mt-1">Google Maps failed to load</p>
						</div>
					</div>
				) : !request ? (
					<div className="w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ height: 280, minHeight: 280 }}>
						<div className="text-center">
							<p className="text-sm text-gray-500">No assigned requests to show.</p>
						</div>
					</div>
				) : (
					<div
						ref={mapRef}
						className="w-full rounded-lg border border-gray-200"
						style={{ height: 280, minHeight: 280 }}
					/>
				)}
			</div>
		</div>
	);
}

