package com.smartwaste.entity;

/**
 * Internal lifecycle states for waste requests.
 *
 * NOTE: The underlying database column remains a String to avoid schema changes.
 * This enum is used purely in code to keep transitions strict and explicit.
 */
public enum WasteRequestStatus {
	CREATED,
	ASSIGNED,
	IN_PROGRESS,
	COLLECTED,
	CLOSED;

	/**
	 * Map various incoming string values (including legacy ones) to a strict lifecycle state.
	 *
	 * Legacy mappings:
	 * - PENDING  -> CREATED
	 * - REJECTED -> CLOSED
	 */
	public static WasteRequestStatus fromString(String raw) {
		if (raw == null) {
			throw new IllegalArgumentException("Status cannot be null");
		}
		String value = raw.trim().toUpperCase();

		// Legacy aliases from earlier prototype phases
		if ("PENDING".equals(value)) {
			return CREATED;
		}
		if ("REJECTED".equals(value)) {
			return CLOSED;
		}

		try {
			return WasteRequestStatus.valueOf(value);
		}
		catch (IllegalArgumentException ex) {
			throw new IllegalArgumentException("Unsupported status value: " + raw);
		}
	}

	/**
	 * Map the strict lifecycle state back to the legacy String values used
	 * in the database and frontend API to avoid breaking existing flows.
	 *
	 * - CREATED / ASSIGNED -> PENDING
	 * - IN_PROGRESS       -> IN_PROGRESS
	 * - COLLECTED         -> COLLECTED
	 * - CLOSED            -> REJECTED
	 */
	public String toLegacyString() {
		return switch (this) {
			case CREATED, ASSIGNED -> "PENDING";
			case IN_PROGRESS -> "IN_PROGRESS";
			case COLLECTED -> "COLLECTED";
			case CLOSED -> "REJECTED";
		};
	}
}


