package com.khaleo.flashcard.config.dynamo;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

@Configuration
public class DynamoDbClientConfig {

    @Bean
    public DynamoDbClient dynamoDbClient(
            @Value("${app.dynamo.region:us-east-1}") String region,
            @Value("${app.dynamo.endpoint:}") String endpoint) {

        var builder = DynamoDbClient.builder()
            .region(Region.of(region));

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }
}
