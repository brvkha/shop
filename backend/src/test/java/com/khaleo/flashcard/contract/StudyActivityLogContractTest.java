package com.khaleo.flashcard.contract;

import static org.assertj.core.api.Assertions.assertThat;

import com.khaleo.flashcard.model.dynamo.RatingGiven;
import com.khaleo.flashcard.model.dynamo.StudyActivityLog;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

class StudyActivityLogContractTest {

    @Test
    void shouldExposeRequiredStudyActivityLogShape() {
        StudyActivityLog logEntry = StudyActivityLog.of(
                UUID.randomUUID(),
                UUID.randomUUID(),
                RatingGiven.GOOD,
                1350L);

        Map<String, AttributeValue> item = logEntry.toAttributeMap();

        assertThat(item).containsKeys(
                "logId",
                "timestamp",
                "userId",
                "cardId",
                "ratingGiven",
                "timeSpentMs",
                "writeStatus");

        assertThat(item.get("ratingGiven").s()).isEqualTo("GOOD");
        assertThat(Long.parseLong(item.get("timeSpentMs").n())).isEqualTo(1350L);
    }

    @Test
    void shouldSupportAllExpectedRatingValues() {
        assertThat(RatingGiven.values())
                .containsExactly(RatingGiven.AGAIN, RatingGiven.HARD, RatingGiven.GOOD, RatingGiven.EASY);
    }
}
