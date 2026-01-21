const GOOGLE_MAPS_API_KEY = "AIzaSyAlSxdckK9zUsXstW6zKVScUWxMw97Qtho";
const LOAD_TIMEOUT = 10000; // 10 seconds timeout

let loadingPromise = null;

export function loadGoogleMaps() {
	// Reuse the same promise to avoid injecting multiple scripts
	if (loadingPromise) return loadingPromise;

	loadingPromise = new Promise((resolve, reject) => {
		// Check if already loaded
		if (window.google && window.google.maps) {
			resolve(window.google || {});
			return;
		}

		// Set timeout to prevent hanging
		const timeoutId = setTimeout(() => {
			// Even on timeout, resolve to allow map container to render
			// Google Maps will show its own warning if there are issues
			resolve(window.google || {});
		}, LOAD_TIMEOUT);

		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
		script.async = true;
		script.defer = true;

		script.onload = () => {
			clearTimeout(timeoutId);
			// Resolve immediately when script loads, even if Google Maps API isn't fully initialized
			// This allows the map container to render and Google will show its own warnings
			resolve(window.google || {});
		};

		script.onerror = () => {
			clearTimeout(timeoutId);
			// Even on script error, resolve to allow map container to render
			resolve({});
		};

		document.head.appendChild(script);
	});

	return loadingPromise;
}

