package com.khaleo.flashcard.unit.activitylog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.khaleo.flashcard.model.dynamo.RatingGiven;
import com.khaleo.flashcard.model.dynamo.StudyActivityLog;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

class StudyActivityLogValidationTest {

    @Test
    void shouldSerializeActivityLogWithExpectedValues() {
        StudyActivityLog entry = StudyActivityLog.of(
                UUID.randomUUID(),
                UUID.randomUUID(),
                RatingGiven.AGAIN,
                410L);

        Map<String, AttributeValue> item = entry.toAttributeMap();
        assertThat(item.get("ratingGiven").s()).isEqualTo("AGAIN");
        assertThat(item.get("timeSpentMs").n()).isEqualTo("410");
    }

    @Test
    void shouldRejectMissingRatingOrNegativeTimeSpent() {
        StudyActivityLog invalidRating = StudyActivityLog.of(
                UUID.randomUUID(),
                UUID.randomUUID(),
                RatingGiven.GOOD,
                120L);
        invalidRating.setRatingGiven(null);

        StudyActivityLog invalidTime = StudyActivityLog.of(
                UUID.randomUUID(),
                UUID.randomUUID(),
                RatingGiven.GOOD,
                120L);
        invalidTime.setTimeSpentMs(-1L);

        assertThatThrownBy(invalidRating::toAttributeMap)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ratingGiven");

        assertThatThrownBy(invalidTime::toAttributeMap)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("timeSpentMs");
    }
}
