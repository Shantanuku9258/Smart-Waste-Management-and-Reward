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
		<div className="border border-white/50 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg hover-lift">
			<div className="p-5 border-b border-gray-200/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-t-2xl">
				<div>
					<h3 className="text-lg font-bold text-gray-900">Waste Requests Map</h3>
					<p className="text-sm text-gray-600 mt-1">Visualization of all waste pickup requests</p>
					<p className="text-xs text-emerald-600 font-medium mt-1 italic">Live Map Integration (Demo Mode)</p>
				</div>
			</div>
			<div className="p-4">
				{error ? (
					<div className="w-full rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner" style={{ height: 320, minHeight: 320 }}>
						<div className="text-center p-6">
							<p className="text-sm font-medium text-gray-700">Map unavailable</p>
							<p className="text-xs text-gray-500 mt-1">Google Maps failed to load</p>
							<p className="text-xs text-emerald-600 mt-2 font-medium italic">Demo Mode</p>
						</div>
					</div>
				) : (
					<div
						ref={mapRef}
						className="w-full rounded-xl border border-gray-200/50 shadow-inner overflow-hidden bg-white"
						style={{ height: 320, minHeight: 320 }}
					/>
				)}
			</div>
		</div>
	);
}

export function CollectorRequestMap({ requests }) {
	const mapRef = useRef(null);
	const [isLoading, setIsLoading] = useState(true);

	// Only show first assigned request marker
	const request = requests?.[0];

	useEffect(() => {
		let mapInstance;
		let marker;
		let cancelled = false;

		if (!request) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		loadGoogleMaps()
			.then((google) => {
				if (cancelled) return;
				if (!mapRef.current) return;

				// Stop loading state immediately - render map container
				setIsLoading(false);

				// Try to initialize map, but don't block if it fails
				// Google Maps will show its own warnings if there are API issues
				if (google && google.maps && google.maps.Map) {
					try {
						const center = getCoords(request);
						mapInstance = new google.maps.Map(mapRef.current, {
							center,
							zoom: 10,
							mapTypeControl: true,
							streetViewControl: true,
							fullscreenControl: true,
						});

						marker = createMarker(google, mapInstance, request, false); // false = collector map
						
						// Ensure map is visible
						setTimeout(() => {
							if (mapInstance && !cancelled && google.maps) {
								google.maps.event.trigger(mapInstance, 'resize');
							}
						}, 100);
					} catch (mapError) {
						console.error("Map initialization error:", mapError);
						// Don't set error - let Google Maps show its own warnings
					}
				} else {
					// Google Maps API not available, but container is rendered
					// Google will show its own warning popup if script loaded but API failed
					console.warn("Google Maps API not fully initialized, but map container is rendered");
				}
			})
			.catch((err) => {
				console.error("Map load error:", err);
				// Stop loading even on error - render container anyway
				setIsLoading(false);
			});

		return () => {
			cancelled = true;
			if (marker) marker.setMap(null);
		};
	}, [request]);

	return (
		<div className="border border-white/50 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg hover-lift">
			<div className="p-5 border-b border-gray-200/50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-t-2xl">
				<div>
					<h3 className="text-lg font-bold text-gray-900">Assigned Pickup Map</h3>
					<p className="text-sm text-gray-600 mt-1">Visualization of your assigned request location</p>
					<p className="text-xs text-emerald-600 font-medium mt-1 italic">Live Map Integration (Demo Mode)</p>
				</div>
			</div>
			<div className="p-4">
				{!request ? (
					<div className="w-full rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner" style={{ height: 280, minHeight: 280 }}>
						<div className="text-center p-6">
							<p className="text-sm text-gray-500">No assigned requests to show.</p>
							<p className="text-xs text-emerald-600 mt-2 font-medium italic">Map Integration Preview</p>
						</div>
					</div>
				) : isLoading ? (
					<div className="w-full rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner" style={{ height: 280, minHeight: 280 }}>
						<div className="text-center p-6">
							<svg className="animate-spin h-6 w-6 text-emerald-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<p className="text-xs text-gray-500">Loading map...</p>
							<p className="text-xs text-emerald-600 mt-1 font-medium italic">Map Integration Preview</p>
						</div>
					</div>
				) : (
					<div
						ref={mapRef}
						className="w-full rounded-xl border border-gray-200/50 shadow-inner overflow-hidden"
						style={{ height: 280, minHeight: 280 }}
					/>
				)}
			</div>
		</div>
	);
}

