
// Mock DataLoader and localStorage (Same as before)
const localStorageMock = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};
global.localStorage = localStorageMock;

const DataLoader = {
    cache: {},
    getQuizzes: (day) => [],
    getCurriculum: (day) => ({ blocks: [] })
};
global.DataLoader = DataLoader;

// Paste FlashcardGenerator Code (simplified/essential parts)
const FlashcardGenerator = {
    STORAGE_KEY_PREFIX: '90hari_flashcard_',
    getWeights(day) { return {}; },

    // The UPDATED Critical Function
    selectNextCard(day, flashcards, completedCardIds) {
        // const weights = this.getWeights(day);
        const availableCards = flashcards.filter(card => {
            // Check if THIS card ID has been completed
            return !completedCardIds.has(card.id);
        });

        console.log(`[Select] Available: ${availableCards.length}, Completed Set Size: ${completedCardIds.size}`);

        if (availableCards.length === 0) {
            return null; // All cards answered correctly
        }

        return availableCards[0];
    }
};

// Simulation
async function runTest() {
    console.log("Starting Test with Set...");
    const day = "1";
    // simplified flashcards
    const flashcards = [
        { id: 'card1', weight: 1 },
        { id: 'card2', weight: 1 }
    ];
    const completedCardIds = new Set();

    console.log(`Generated ${flashcards.length} cards.`);

    let iterations = 0;
    while (iterations < 10) {
        iterations++;
        const currentCard = FlashcardGenerator.selectNextCard(day, flashcards, completedCardIds);

        if (!currentCard) {
            console.log("SUCCESS: Simulation finished!");
            return;
        }

        console.log(`Iteration ${iterations}: Do card ${currentCard.id}`);

        // Simulate Correct Answer -> Add to Set
        completedCardIds.add(currentCard.id);
    }

    console.log("FAILURE: Infinite Loop detected");
}

runTest();
