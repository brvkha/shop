package com.khaleo.flashcard.service.activitylog;

import com.khaleo.flashcard.config.activitylog.ActivityLogPublishPolicy;
import com.khaleo.flashcard.model.dynamo.StudyActivityLog;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ActivityLogRetryService {

    private final ActivityLogPublishPolicy policy;
    private final Queue<StudyActivityLog> deadLetterQueue = new ConcurrentLinkedQueue<>();

    public ActivityLogRetryService() {
        this(ActivityLogPublishPolicy.defaultPolicy());
    }

    public ActivityLogRetryService(ActivityLogPublishPolicy policy) {
        this.policy = policy;
    }

    public void publishWithRetry(StudyActivityLog logEntry, ThrowingRunnable publishAttempt) {
        int attempt = 0;
        while (attempt < policy.maxAttempts()) {
            attempt++;
            try {
                publishAttempt.run();
                log.info("event=activity_log_publish_success logId={} attempt={} userId={} cardId={}",
                        logEntry.getLogId(), attempt, logEntry.getUserId(), logEntry.getCardId());
                return;
            } catch (Exception ex) {
                boolean retry = policy.shouldRetry(attempt, ex);
                log.warn("event=activity_log_publish_retry logId={} attempt={} retry={} reason={}",
                        logEntry.getLogId(), attempt, retry, ex.getMessage());
                if (!retry) {
                    break;
                }
                try {
                    Thread.sleep(policy.retryBackoff().toMillis());
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        deadLetterQueue.add(logEntry);
        log.error("event=activity_log_dead_letter logId={} userId={} cardId={} attempts={}",
                logEntry.getLogId(), logEntry.getUserId(), logEntry.getCardId(), policy.maxAttempts());
    }

    public int deadLetterCount() {
        return deadLetterQueue.size();
    }

    public void clearDeadLetters() {
        deadLetterQueue.clear();
    }

    @FunctionalInterface
    public interface ThrowingRunnable {
        void run() throws Exception;
    }
}
