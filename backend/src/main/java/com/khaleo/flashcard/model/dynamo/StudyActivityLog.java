package com.khaleo.flashcard.model.dynamo;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyActivityLog {

    private String logId;
    private String timestamp;
    private String userId;
    private String cardId;
    private RatingGiven ratingGiven;
    private Long timeSpentMs;
    private String writeStatus;

    public static StudyActivityLog of(UUID userId, UUID cardId, RatingGiven ratingGiven, Long timeSpentMs) {
        return StudyActivityLog.builder()
                .logId(UUID.randomUUID().toString())
                .timestamp(Instant.now().toString())
                .userId(userId.toString())
                .cardId(cardId.toString())
                .ratingGiven(ratingGiven)
                .timeSpentMs(timeSpentMs)
                .writeStatus("PENDING")
                .build();
    }

    public Map<String, AttributeValue> toAttributeMap() {
        validate();
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("logId", AttributeValue.fromS(logId));
        item.put("timestamp", AttributeValue.fromS(timestamp));
        item.put("userId", AttributeValue.fromS(userId));
        item.put("cardId", AttributeValue.fromS(cardId));
        item.put("ratingGiven", AttributeValue.fromS(ratingGiven.name()));
        item.put("timeSpentMs", AttributeValue.fromN(String.valueOf(timeSpentMs)));
        item.put("writeStatus", AttributeValue.fromS(writeStatus == null ? "PENDING" : writeStatus));
        return item;
    }

    private void validate() {
        if (isBlank(logId) || isBlank(timestamp) || isBlank(userId) || isBlank(cardId)) {
            throw new IllegalStateException("StudyActivityLog requires non-empty logId, timestamp, userId, and cardId.");
        }
        if (ratingGiven == null) {
            throw new IllegalStateException("StudyActivityLog requires ratingGiven.");
        }
        if (timeSpentMs == null || timeSpentMs < 0) {
            throw new IllegalStateException("StudyActivityLog requires non-negative timeSpentMs.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
