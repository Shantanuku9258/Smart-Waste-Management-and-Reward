package com.smartwaste.config;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * Simple Rate Limiting Implementation
 * In-memory rate limiting for sensitive endpoints
 * For production, consider using Redis or Spring Cloud Gateway
 */
@Component
public class RateLimitingConfig {

	// Rate limit: 5 requests per minute per IP for login
	private static final int LOGIN_RATE_LIMIT = 5;
	private static final long LOGIN_RATE_WINDOW_MS = 60_000; // 1 minute

	// Rate limit: 10 requests per minute per IP for reports
	private static final int REPORT_RATE_LIMIT = 10;
	private static final long REPORT_RATE_WINDOW_MS = 60_000; // 1 minute

	private final ConcurrentHashMap<String, RateLimitInfo> loginAttempts = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, RateLimitInfo> reportAttempts = new ConcurrentHashMap<>();

	public boolean isLoginAllowed(String clientId) {
		return checkRateLimit(clientId, loginAttempts, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);
	}

	public boolean isReportAllowed(String clientId) {
		return checkRateLimit(clientId, reportAttempts, REPORT_RATE_LIMIT, REPORT_RATE_WINDOW_MS);
	}

	private boolean checkRateLimit(
		String clientId,
		ConcurrentHashMap<String, RateLimitInfo> attempts,
		int limit,
		long windowMs
	) {
		long now = System.currentTimeMillis();
		RateLimitInfo info = attempts.computeIfAbsent(clientId, k -> new RateLimitInfo());

		synchronized (info) {
			// Reset if window expired
			if (now - info.windowStart > windowMs) {
				info.count.set(0);
				info.windowStart = now;
			}

			// Check limit
			if (info.count.get() >= limit) {
				return false;
			}

			info.count.incrementAndGet();
			return true;
		}
	}

	private static class RateLimitInfo {
		AtomicInteger count = new AtomicInteger(0);
		long windowStart = System.currentTimeMillis();
	}
}

