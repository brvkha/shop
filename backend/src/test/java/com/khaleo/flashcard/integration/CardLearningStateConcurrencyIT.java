package com.khaleo.flashcard.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.khaleo.flashcard.entity.CardLearningState;
import com.khaleo.flashcard.service.persistence.CardLearningStateUpdateService;
import com.khaleo.flashcard.service.persistence.PersistenceValidationException;
import com.khaleo.flashcard.service.persistence.PersistenceValidationExceptionMapper;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

@SpringBootTest(classes = {CardLearningStateUpdateService.class, PersistenceValidationExceptionMapper.class})
@SuppressWarnings("null")
class CardLearningStateConcurrencyIT {

    @Autowired
    private CardLearningStateUpdateService updateService;

    @Test
    void shouldRetryOnceAndThenSucceedForOptimisticLockConflict() {
        UUID userId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();
        AtomicInteger attempts = new AtomicInteger(0);

        CardLearningState saved = updateService.saveWithSingleRetry(userId, cardId, () -> {
            if (attempts.getAndIncrement() == 0) {
                throw new ObjectOptimisticLockingFailureException(CardLearningState.class, cardId);
            }
            return CardLearningState.builder().build();
        });

        assertThat(saved).isNotNull();
        assertThat(attempts.get()).isEqualTo(2);
    }

    @Test
    void shouldFailAfterSingleBoundedRetry() {
        UUID userId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();
        AtomicInteger attempts = new AtomicInteger(0);

        assertThatThrownBy(() -> updateService.saveWithSingleRetry(userId, cardId, () -> {
            attempts.incrementAndGet();
            throw new ObjectOptimisticLockingFailureException(CardLearningState.class, cardId);
        }))
                .isInstanceOf(PersistenceValidationException.class);

        assertThat(attempts.get()).isEqualTo(2);
    }
}
