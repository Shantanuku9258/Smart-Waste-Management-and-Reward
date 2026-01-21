package com.smartwaste.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

/**
 * Global Exception Handler
 * Handles all exceptions across the application with proper logging and error responses
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidationExceptions(
		MethodArgumentNotValidException ex, WebRequest request
	) {
		Map<String, String> errors = new HashMap<>();
		ex.getBindingResult().getAllErrors().forEach((error) -> {
			String fieldName = ((FieldError) error).getField();
			String errorMessage = error.getDefaultMessage();
			errors.put(fieldName, errorMessage);
		});

		logger.warn("Validation error: {}", errors);

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.BAD_REQUEST.value());
		response.put("error", "Validation Failed");
		response.put("message", "Invalid input data");
		response.put("errors", errors);
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<Map<String, Object>> handleConstraintViolationException(
		ConstraintViolationException ex, WebRequest request
	) {
		Map<String, String> errors = new HashMap<>();
		for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
			String fieldName = violation.getPropertyPath().toString();
			String errorMessage = violation.getMessage();
			errors.put(fieldName, errorMessage);
		}

		logger.warn("Constraint violation: {}", errors);

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.BAD_REQUEST.value());
		response.put("error", "Constraint Violation");
		response.put("message", "Invalid input data");
		response.put("errors", errors);
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<Map<String, Object>> handleBadCredentialsException(
		BadCredentialsException ex, WebRequest request
	) {
		logger.warn("Authentication failed: {}", ex.getMessage());

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.UNAUTHORIZED.value());
		response.put("error", "Unauthorized");
		response.put("message", "Invalid credentials");
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
		AccessDeniedException ex, WebRequest request
	) {
		logger.warn("Access denied: {}", ex.getMessage());

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.FORBIDDEN.value());
		response.put("error", "Forbidden");
		response.put("message", "You don't have permission to access this resource");
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
		IllegalArgumentException ex, WebRequest request
	) {
		logger.warn("Illegal argument: {}", ex.getMessage());

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.BAD_REQUEST.value());
		response.put("error", "Bad Request");
		response.put("message", ex.getMessage());
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
	}

	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<Map<String, Object>> handleIllegalStateException(
		IllegalStateException ex, WebRequest request
	) {
		logger.warn("Illegal state: {}", ex.getMessage());

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.NOT_FOUND.value());
		response.put("error", "Not Found");
		response.put("message", ex.getMessage() != null ? ex.getMessage() : "Resource not found");
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(
		MaxUploadSizeExceededException ex, WebRequest request
	) {
		logger.warn("File upload size exceeded: {}", ex.getMessage());

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
		response.put("error", "Payload Too Large");
		response.put("message", "The uploaded file exceeds the maximum allowed size of 10MB");
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
	}

	@ExceptionHandler(RuntimeException.class)
	public ResponseEntity<Map<String, Object>> handleRuntimeException(
		RuntimeException ex, WebRequest request
	) {
		logger.error("Runtime exception: ", ex);

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
		response.put("error", "Internal Server Error");
		response.put("message", "An unexpected error occurred");
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleGenericException(
		Exception ex, WebRequest request
	) {
		logger.error("Unexpected exception: ", ex);

		Map<String, Object> response = new HashMap<>();
		response.put("timestamp", LocalDateTime.now());
		response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
		response.put("error", "Internal Server Error");
		response.put("message", "An unexpected error occurred. Please try again later.");
		response.put("path", request.getDescription(false).replace("uri=", ""));

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
	}
}
