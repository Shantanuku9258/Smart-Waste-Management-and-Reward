# Java 17 runtime
FROM eclipse-temurin:17-jdk-alpine

# Install Maven
RUN apk add --no-cache maven

# Set working directory
WORKDIR /app

# Copy pom first
COPY pom.xml .

# Download dependencies
RUN mvn -B dependency:go-offline

# Copy source code
COPY src src

# Build app
RUN mvn -B package -DskipTests

# Expose port (Render injects PORT)
EXPOSE 8080

# Run Spring Boot app
CMD ["sh", "-c", "java -jar target/backend-0.0.1-SNAPSHOT.jar"]
