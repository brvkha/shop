package com.khaleo.flashcard.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.khaleo.flashcard.integration.support.IntegrationPersistenceTestBase;
import com.khaleo.flashcard.service.persistence.PersistenceValidationException;
import com.khaleo.flashcard.service.persistence.PersistenceValidationException.PersistenceErrorCode;
import com.khaleo.flashcard.service.persistence.RelationalPersistenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class UserDailyLimitValidationIT extends IntegrationPersistenceTestBase {

    @Autowired
    private RelationalPersistenceService service;

    @Test
    void shouldRejectDailyLearningLimitOutsideAllowedRange() {
        assertThatThrownBy(() -> service.createUser(new RelationalPersistenceService.CreateUserRequest(
                "daily-limit@example.com",
                "hash",
                10000)))
                .isInstanceOf(PersistenceValidationException.class)
                .satisfies(ex -> assertThat(((PersistenceValidationException) ex).getErrorCode())
                        .isEqualTo(PersistenceErrorCode.INVALID_DAILY_LEARNING_LIMIT));
    }
}
