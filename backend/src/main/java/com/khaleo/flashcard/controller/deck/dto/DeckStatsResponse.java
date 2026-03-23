package com.khaleo.flashcard.controller.deck.dto;

public record DeckStatsResponse(
    String deckId,
    long learning,
    long review,
    long new_cards
) {
}
