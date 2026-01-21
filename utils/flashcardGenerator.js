// ============================================
// FLASHCARD GENERATOR - Weighted-based system
// ============================================

const FlashcardGenerator = {
    STORAGE_KEY_PREFIX: '90hari_flashcard_',

    generateFromQuizzes(day, quizData) {
        let allQuizzes = [];
        const dayInt = parseInt(day);

        // 1. Collect quizzes from the current day (manual quizzes)
        if (quizData && quizData.length > 0) {
            quizData.forEach((quiz, index) => {
                allQuizzes.push({
                    id: `day${day}_q${index}`,
                    question: quiz.question || quiz.text || quiz.questionText,
                    options: quiz.options || [],
                    correctAnswer: quiz.correctAnswer || quiz.answer,
                    type: quiz.type || 'multiple-choice',
                    weight: 1
                });
            });
        }

        // 2. Scan Curriculum for 'vocab' blocks and generate cards
        const curriculum = DataLoader.getCurriculum(day);
        if (curriculum && curriculum.blocks) {
            const vocabBlocks = curriculum.blocks.filter(b => b.type === 'vocab');
            vocabBlocks.forEach((block, blockIdx) => {
                const words = block.content;
                words.forEach((item, itemIdx) => {
                    // Generate Reading Quiz
                    const readingOptions = this.generateOptions(item.reading, words.map(w => w.reading));
                    allQuizzes.push({
                        id: `day${day}_v${blockIdx}_r${itemIdx}`,
                        question: `Apa bacaan dari: ${item.word}?`,
                        instruction: "Apa bacaan dari:",
                        word: item.word,
                        hint: item.reading,
                        options: readingOptions,
                        correctAnswer: item.reading,
                        type: 'vocab-reading',
                        weight: 1.2
                    });

                    // Generate Meaning Quiz
                    const meaningOptions = this.generateOptions(item.meaning, words.map(w => w.meaning));
                    allQuizzes.push({
                        id: `day${day}_v${blockIdx}_m${itemIdx}`,
                        question: `Apa arti dari: ${item.word}?`,
                        instruction: "Apa arti dari:",
                        word: item.word,
                        hint: item.reading,
                        options: meaningOptions,
                        correctAnswer: item.meaning,
                        type: 'vocab-meaning',
                        weight: 1.2
                    });
                });
            });
        }

        // 3. If still not enough (less than 50), pull from ALL previous days to review
        if (allQuizzes.length < 50) {
            const fullQuizzes = DataLoader.cache['quizzes.json'] || {};
            // Also consider vocab from previous days in curriculum
            const fullCurriculum = DataLoader.cache['curriculum.json'] || {};

            for (let i = dayInt - 1; i >= 1; i--) {
                // Pull manual quizzes
                const prevDayQuizzes = fullQuizzes[i.toString()];
                if (prevDayQuizzes) {
                    prevDayQuizzes.forEach((quiz, index) => {
                        allQuizzes.push({
                            id: `day${i}_rev_q${index}`,
                            question: quiz.question || quiz.text || quiz.questionText,
                            options: quiz.options || [],
                            correctAnswer: quiz.correctAnswer || quiz.answer,
                            type: quiz.type || 'review',
                            weight: 0.8
                        });
                    });
                }

                // Pull vocab quizzes from previous days
                const prevCurriculum = fullCurriculum[i.toString()];
                if (prevCurriculum && prevCurriculum.blocks) {
                    const prevVocabs = prevCurriculum.blocks.filter(b => b.type === 'vocab');
                    prevVocabs.forEach((block, bIdx) => {
                        block.content.forEach((item, iIdx) => {
                            allQuizzes.push({
                                id: `day${i}_rev_v${bIdx}_m${iIdx}`,
                                question: `Apa arti dari: ${item.word}?`,
                                instruction: "Apa arti dari:",
                                word: item.word,
                                hint: item.reading,
                                options: this.generateOptions(item.meaning, block.content.map(w => w.meaning)),
                                correctAnswer: item.meaning,
                                type: 'review-vocab',
                                weight: 0.7
                            });
                        });
                    });
                }

                if (allQuizzes.length >= 150) break;
            }
        }

        // 4. Shuffle and limit to 50 cards
        return this.shuffleArray(allQuizzes).slice(0, 50);
    },

    generateOptions(correct, pool) {
        const distractors = pool
            .filter(item => item !== correct)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        return this.shuffleArray([correct, ...distractors]);
    },

    generateFromCurriculum(day) {
        // Fallback: generate basic flashcards from curriculum
        // This is a simplified version - you can expand based on curriculum structure
        const flashcards = [];

        // Example: Hiragana flashcards for early days
        if (day <= 10) {
            const hiragana = [
                { char: 'あ', romaji: 'a' },
                { char: 'い', romaji: 'i' },
                { char: 'う', romaji: 'u' },
                { char: 'え', romaji: 'e' },
                { char: 'お', romaji: 'o' },
                { char: 'か', romaji: 'ka' },
                { char: 'き', romaji: 'ki' },
                { char: 'く', romaji: 'ku' },
                { char: 'け', romaji: 'ke' },
                { char: 'こ', romaji: 'ko' }
            ];

            hiragana.forEach((h, i) => {
                // Create distractors
                const distractors = hiragana
                    .filter(x => x.romaji !== h.romaji)
                    .map(x => x.romaji)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);

                const options = this.shuffleArray([h.romaji, ...distractors]);

                flashcards.push({
                    id: `day${day}_h${i}`,
                    question: `Apa bacaan dari: ${h.char}?`,
                    instruction: "Apa bacaan dari:",
                    word: h.char,
                    options: options,
                    correctAnswer: h.romaji,
                    type: 'hiragana',
                    weight: 1
                });
            });
        }

        return flashcards.slice(0, 50);
    },

    // Weighted selection: wrong answers appear more frequently
    selectNextCard(day, flashcards, completedCardIds) {
        const weights = this.getWeights(day);
        const availableCards = flashcards.filter(card => {
            // Check if THIS card ID has been completed
            return !completedCardIds.has(card.id);
        });

        if (availableCards.length === 0) {
            return null; // All cards answered correctly
        }

        // Apply weights
        const weightedCards = availableCards.map(card => ({
            ...card,
            weight: weights[card.id] || 1
        }));

        // Weighted random selection
        const totalWeight = weightedCards.reduce((sum, card) => sum + card.weight, 0);
        let random = Math.random() * totalWeight;

        for (const card of weightedCards) {
            random -= card.weight;
            if (random <= 0) {
                return card;
            }
        }

        return weightedCards[0]; // Fallback
    },

    updateWeight(day, cardId, isCorrect) {
        const weights = this.getWeights(day);

        if (isCorrect) {
            // Decrease weight (less likely to appear)
            weights[cardId] = Math.max(0.1, (weights[cardId] || 1) * 0.5);
        } else {
            // Increase weight (more likely to appear)
            weights[cardId] = (weights[cardId] || 1) * 2;
        }

        this.saveWeights(day, weights);
    },

    getWeights(day) {
        const key = this.STORAGE_KEY_PREFIX + day;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : {};
    },

    saveWeights(day, weights) {
        const key = this.STORAGE_KEY_PREFIX + day;
        localStorage.setItem(key, JSON.stringify(weights));
    },

    resetWeights(day) {
        const key = this.STORAGE_KEY_PREFIX + day;
        localStorage.removeItem(key);
    },

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
