package com.khaleo.flashcard.service.persistence;

import lombok.Getter;

@Getter
public class PersistenceValidationException extends RuntimeException {

    private final PersistenceErrorCode errorCode;

    public PersistenceValidationException(PersistenceErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public PersistenceValidationException(PersistenceErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public enum PersistenceErrorCode {
        DUPLICATE_EMAIL,
        INVALID_DAILY_LEARNING_LIMIT,
        INVALID_CARD_CONTENT,
        MISSING_RELATIONSHIP,
        OPTIMISTIC_LOCK_CONFLICT,
        VALIDATION_REJECTED
    }
}
