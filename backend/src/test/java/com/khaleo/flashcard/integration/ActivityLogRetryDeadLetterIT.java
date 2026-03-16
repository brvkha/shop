package com.khaleo.flashcard.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import com.khaleo.flashcard.model.dynamo.RatingGiven;
import com.khaleo.flashcard.repository.dynamo.StudyActivityLogRepository;
import com.khaleo.flashcard.service.activitylog.ActivityLogRetryService;
import com.khaleo.flashcard.service.activitylog.StudyActivityLogPublisher;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(classes = {StudyActivityLogPublisher.class, ActivityLogRetryService.class})
class ActivityLogRetryDeadLetterIT {

    @MockBean
    private StudyActivityLogRepository repository;

    @Autowired
    private StudyActivityLogPublisher publisher;

    @Autowired
    private ActivityLogRetryService retryService;

    @BeforeEach
    void resetState() {
        retryService.clearDeadLetters();
    }

    @Test
    void shouldRetryThenMoveToDeadLetterWhenDynamoWriteFails() {
        doThrow(new RuntimeException("DynamoDB unavailable"))
                .when(repository)
                .save(any());

        publisher.publishLearningStateEvent(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        RatingGiven.HARD,
                        875L)
                .join();

        verify(repository, timeout(8000).times(3)).save(any());
        assertThat(retryService.deadLetterCount()).isEqualTo(1);
    }
}
