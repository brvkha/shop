package com.khaleo.flashcard.service.persistence;

import com.khaleo.flashcard.entity.CardLearningState;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CardLearningStateUpdateService {

    private static final int MAX_ATTEMPTS = 2;

    private final PersistenceValidationExceptionMapper exceptionMapper;

    public CardLearningState saveWithSingleRetry(
            UUID userId,
            UUID cardId,
            Supplier<CardLearningState> saveAttempt) {

        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(cardId, "cardId must not be null");
        Objects.requireNonNull(saveAttempt, "saveAttempt must not be null");

        int attempts = 0;
        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            try {
                return saveAttempt.get();
            } catch (ObjectOptimisticLockingFailureException ex) {
                log.warn("event=learning_state_retry_on_optimistic_lock userId={} cardId={} attempt={}",
                        userId, cardId, attempts);
                if (attempts >= MAX_ATTEMPTS) {
                    throw exceptionMapper.mapOptimisticLockFailure(ex, userId, cardId);
                }
            }
        }

        throw exceptionMapper.mapOptimisticLockFailure(
                new ObjectOptimisticLockingFailureException(CardLearningState.class, cardId),
                userId,
                cardId);
    }
}
