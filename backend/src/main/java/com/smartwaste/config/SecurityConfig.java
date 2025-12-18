package com.smartwaste.config;

import com.smartwaste.security.JwtFilter;
import com.smartwaste.security.SecurityHeadersFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	private final JwtFilter jwtFilter;
	private final SecurityHeadersFilter securityHeadersFilter;

	public SecurityConfig(JwtFilter jwtFilter, SecurityHeadersFilter securityHeadersFilter) {
		this.jwtFilter = jwtFilter;
		this.securityHeadersFilter = securityHeadersFilter;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder(12); // Increased rounds for better security
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
		configuration.setAllowedHeaders(Arrays.asList("*"));
		configuration.setAllowCredentials(true);
		configuration.setMaxAge(3600L); // Cache preflight requests for 1 hour
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable()) // Disabled for JWT stateless auth
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.headers(headers -> headers
				.frameOptions(frame -> frame.deny())
				.contentTypeOptions(contentType -> contentType.disable())
			)
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/api/auth/**", "/api/health", "/actuator/health").permitAll()
				.requestMatchers("/api/admin/**").hasAuthority("ADMIN")
				.requestMatchers("/api/collector/**").hasAuthority("COLLECTOR")
				.anyRequest().authenticated()
			)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

		// Add security headers filter before JWT filter
		http.addFilterBefore(securityHeadersFilter, UsernamePasswordAuthenticationFilter.class);
		http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
