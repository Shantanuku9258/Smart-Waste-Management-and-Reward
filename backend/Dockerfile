# Use lightweight Java 17 runtime
FROM eclipse-temurin:17-jdk-alpine

# Set working directory inside container
WORKDIR /app

# Copy Maven wrapper & pom first (better caching)
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Download dependencies
RUN ./mvnw -q -B dependency:go-offline

# Copy source code
COPY src src

# Build the application (skip tests)
RUN ./mvnw -q -B package -DskipTests

# Expose port (Render injects PORT env variable)
EXPOSE 8080

# Run the Spring Boot app
CMD ["sh", "-c", "java -jar target/backend-0.0.1-SNAPSHOT.jar"]

