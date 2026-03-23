package com.khaleo.flashcard.service.deck;

import com.khaleo.flashcard.controller.deck.dto.DeckStatsResponse;
import com.khaleo.flashcard.repository.CardLearningStateRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeckStatsService {

    private final CardLearningStateRepository cardLearningStateRepository;

    @Transactional(readOnly = true)
    public DeckStatsResponse getDeckStats(UUID deckId) {
        long learning = cardLearningStateRepository.countLearningCardsByDeckId(deckId);
        long review = cardLearningStateRepository.countReviewCardsByDeckId(deckId);
        long new_cards = cardLearningStateRepository.countNewCardsByDeckId(deckId);
        
        return new DeckStatsResponse(
            deckId.toString(),
            learning,
            review,
            new_cards
        );
    }
}
