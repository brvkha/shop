package com.khaleo.flashcard.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
class ActivityLogPublishIT {

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
    void shouldPublishActivityLogAsynchronouslyOnSuccessPath() {
        publisher.publishLearningStateEvent(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        RatingGiven.EASY,
                        2200L)
                .join();

        verify(repository, timeout(1000).times(1)).save(any());
        assertThat(retryService.deadLetterCount()).isZero();
    }
}
