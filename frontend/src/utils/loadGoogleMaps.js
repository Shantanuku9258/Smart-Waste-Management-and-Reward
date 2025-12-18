const GOOGLE_MAPS_API_KEY = "AIzaSyAlSxdckK9zUsXstW6zKVScUWxMw97Qtho";

let loadingPromise = null;

export function loadGoogleMaps() {
	// Reuse the same promise to avoid injecting multiple scripts
	if (loadingPromise) return loadingPromise;

	loadingPromise = new Promise((resolve, reject) => {
		if (window.google && window.google.maps) {
			resolve(window.google);
			return;
		}

		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
		script.async = true;
		script.defer = true;

		script.onload = () => {
			if (window.google && window.google.maps) {
				resolve(window.google);
			} else {
				reject(new Error("Google Maps failed to load"));
			}
		};

		script.onerror = () => reject(new Error("Google Maps failed to load"));
		document.head.appendChild(script);
	});

	return loadingPromise;
}

