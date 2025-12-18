package com.smartwaste.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT Authentication Filter
 * Validates JWT tokens and sets authentication in security context
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

	private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

	private final JwtUtil jwtUtil;
	private final MyUserDetailsService userDetailsService;

	@Autowired
	public JwtFilter(JwtUtil jwtUtil, MyUserDetailsService userDetailsService) {
		this.jwtUtil = jwtUtil;
		this.userDetailsService = userDetailsService;
	}

	@Override
	protected void doFilterInternal(
		HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain
	) throws ServletException, IOException {

		String authHeader = request.getHeader("Authorization");

		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			String token = authHeader.substring(7);

			try {
				String username = jwtUtil.extractUsername(token);

				if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
					UserDetails userDetails = userDetailsService.loadUserByUsername(username);

					if (jwtUtil.isTokenValid(token)) {
						UsernamePasswordAuthenticationToken authentication =
							new UsernamePasswordAuthenticationToken(
								userDetails,
								null,
								userDetails.getAuthorities()
							);
						authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
						SecurityContextHolder.getContext().setAuthentication(authentication);
						logger.debug("Authenticated user: {}", username);
					} else {
						logger.warn("Invalid token for user: {}", username);
					}
				}
			} catch (Exception ex) {
				logger.error("Error processing JWT token: {}", ex.getMessage());
				// Continue filter chain - let Spring Security handle unauthorized access
			}
		}

		filterChain.doFilter(request, response);
	}
}
