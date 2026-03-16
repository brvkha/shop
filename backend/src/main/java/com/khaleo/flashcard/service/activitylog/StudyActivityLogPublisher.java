package com.khaleo.flashcard.service.activitylog;

import com.khaleo.flashcard.model.dynamo.RatingGiven;
import com.khaleo.flashcard.model.dynamo.StudyActivityLog;
import com.khaleo.flashcard.repository.dynamo.StudyActivityLogRepository;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyActivityLogPublisher {

    private final StudyActivityLogRepository repository;
    private final ActivityLogRetryService retryService;

    public CompletableFuture<Void> publishLearningStateEvent(
            UUID userId,
            UUID cardId,
            RatingGiven ratingGiven,
            Long timeSpentMs) {

        StudyActivityLog logEntry = StudyActivityLog.of(
                userId,
                cardId,
                ratingGiven == null ? RatingGiven.GOOD : ratingGiven,
                timeSpentMs == null ? 0L : timeSpentMs);

        return publishAsync(logEntry);
    }

    public CompletableFuture<Void> publishAsync(StudyActivityLog logEntry) {
        return CompletableFuture.runAsync(() -> retryService.publishWithRetry(logEntry, () -> repository.save(logEntry)))
                .exceptionally(ex -> {
                    log.error("event=activity_log_publish_async_error logId={} reason={}",
                            logEntry.getLogId(), ex.getMessage(), ex);
                    return null;
                });
    }
}
