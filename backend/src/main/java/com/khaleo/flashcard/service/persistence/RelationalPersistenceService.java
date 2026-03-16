package com.khaleo.flashcard.service.persistence;

import com.khaleo.flashcard.entity.Card;
import com.khaleo.flashcard.entity.CardLearningState;
import com.khaleo.flashcard.entity.Deck;
import com.khaleo.flashcard.entity.User;
import com.khaleo.flashcard.entity.enums.CardLearningStateType;
import com.khaleo.flashcard.model.dynamo.RatingGiven;
import com.khaleo.flashcard.repository.CardLearningStateRepository;
import com.khaleo.flashcard.repository.CardRepository;
import com.khaleo.flashcard.repository.DeckRepository;
import com.khaleo.flashcard.repository.UserRepository;
import com.khaleo.flashcard.service.activitylog.StudyActivityLogPublisher;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class RelationalPersistenceService {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final CardLearningStateRepository cardLearningStateRepository;
    private final StudyActivityLogPublisher studyActivityLogPublisher;
    private final PersistenceValidationExceptionMapper exceptionMapper;
    private final CardLearningStateUpdateService cardLearningStateUpdateService;

    public User createUser(CreateUserRequest request) {
        try {
            User user = User.builder()
                    .email(request.email())
                    .passwordHash(request.passwordHash())
                    .dailyLearningLimit(request.dailyLearningLimit())
                    .build();

            User saved = userRepository.saveAndFlush(user);
            log.info("event=relational_user_create_success userId={} email={}", saved.getId(), saved.getEmail());
            return saved;
        } catch (RuntimeException ex) {
            log.error("event=relational_user_create_failed email={} reason={}", request.email(), ex.getMessage(), ex);
            throw exceptionMapper.mapCreateUserFailure(ex, request.email());
        }
    }

    public Deck createDeck(UUID authorId, CreateDeckRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> exceptionMapper.missingRelationship("user", authorId.toString()));

        try {
            Deck deck = Deck.builder()
                    .author(author)
                    .name(request.name())
                    .description(request.description())
                    .coverImageUrl(request.coverImageUrl())
                    .isPublic(request.isPublic())
                    .tags(request.tags())
                    .build();

            Deck saved = deckRepository.save(deck);
            log.info("event=relational_deck_create_success deckId={} authorId={}", saved.getId(), authorId);
            return saved;
        } catch (RuntimeException ex) {
            log.error("event=relational_deck_create_failed authorId={} reason={}", authorId, ex.getMessage(), ex);
            throw exceptionMapper.mapCreateDeckFailure(ex, authorId);
        }
    }

    public Card createCard(UUID deckId, CreateCardRequest request) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> exceptionMapper.missingRelationship("deck", deckId.toString()));

        if (deck.getAuthor() == null) {
            throw exceptionMapper.missingRelationship("deck.author", deckId.toString());
        }

        try {
            Card card = Card.builder()
                    .deck(deck)
                    .frontText(request.frontText())
                    .frontMediaUrl(request.frontMediaUrl())
                    .backText(request.backText())
                    .backMediaUrl(request.backMediaUrl())
                    .build();

            Card saved = cardRepository.save(card);
            log.info("event=relational_card_create_success cardId={} deckId={}", saved.getId(), deckId);
            return saved;
        } catch (RuntimeException ex) {
            log.error("event=relational_card_create_failed deckId={} reason={}", deckId, ex.getMessage(), ex);
            throw exceptionMapper.mapCreateCardFailure(ex, deckId);
        }
    }

    public CardLearningState upsertLearningState(UpsertLearningStateRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> exceptionMapper.missingRelationship("user", request.userId().toString()));
        Card card = cardRepository.findById(request.cardId())
                .orElseThrow(() -> exceptionMapper.missingRelationship("card", request.cardId().toString()));

        if (card.getDeck() == null) {
            throw exceptionMapper.missingRelationship("card.deck", request.cardId().toString());
        }
        if (card.getDeck().getAuthor() == null) {
            throw exceptionMapper.missingRelationship("card.deck.author", request.cardId().toString());
        }

        try {
            CardLearningState saved = cardLearningStateUpdateService.saveWithSingleRetry(
                    request.userId(),
                    request.cardId(),
                    () -> {
                        CardLearningState state = cardLearningStateRepository
                                .findByUserIdAndCardId(request.userId(), request.cardId())
                                .orElseGet(() -> CardLearningState.builder()
                                        .user(user)
                                        .card(card)
                                        .build());

                        if (request.state() != null) {
                            state.setState(request.state());
                        }
                        if (request.easeFactor() != null) {
                            state.setEaseFactor(request.easeFactor());
                        }
                        if (request.intervalInDays() != null) {
                            state.setIntervalInDays(request.intervalInDays());
                        }
                        if (request.nextReviewDate() != null) {
                            state.setNextReviewDate(request.nextReviewDate());
                        }

                        return cardLearningStateRepository.saveAndFlush(state);
                    });

            log.info("event=relational_learning_state_upsert_success stateId={} userId={} cardId={}",
                    saved.getId(), request.userId(), request.cardId());

            studyActivityLogPublisher.publishLearningStateEvent(
                    request.userId(),
                    request.cardId(),
                    request.ratingGiven(),
                    request.timeSpentMs());

            return saved;
        } catch (RuntimeException ex) {
            log.error("event=relational_learning_state_upsert_failed userId={} cardId={} reason={}",
                    request.userId(), request.cardId(), ex.getMessage(), ex);
            throw exceptionMapper.mapLearningStateFailure(ex, request.userId(), request.cardId());
        }
    }

    public record CreateUserRequest(String email, String passwordHash, Integer dailyLearningLimit) {
    }

    public record CreateDeckRequest(
            String name,
            String description,
            String coverImageUrl,
            Boolean isPublic,
            String tags) {
    }

    public record CreateCardRequest(
            String frontText,
            String frontMediaUrl,
            String backText,
            String backMediaUrl) {
    }

    public record UpsertLearningStateRequest(
            UUID userId,
            UUID cardId,
            CardLearningStateType state,
            BigDecimal easeFactor,
            Integer intervalInDays,
            Instant nextReviewDate,
            RatingGiven ratingGiven,
            Long timeSpentMs) {
    }
}
