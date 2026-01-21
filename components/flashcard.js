// ============================================
// FLASHCARD COMPONENT - Weighted quiz system
// ============================================

const FlashcardComponent = {
    currentDay: null,
    flashcards: [],
    answeredCards: [],
    currentCard: null,
    correctCount: 0,
    wrongCount: 0,
    isAnswering: false,

    autoPlay() {
        if (!this.currentCard) return;

        // Find correct answer
        const correctAnswer = this.currentCard.correctAnswer;

        // Simulate click
        this.selectOption(correctAnswer);

        // Schedule next move
        setTimeout(() => {
            if (this.currentCard) { // Check if session not finished
                this.autoPlay();
            }
        }, 800); // Slightly slower than 500ms transition to be safe
    },

    async start(day) {
        this.currentDay = day;
        this.answeredCards = [];
        this.completedCardIds = new Set();
        this.correctCount = 0;
        this.wrongCount = 0;

        // Load quizzes and generate flashcards
        const quizzes = DataLoader.getQuizzes(day);
        this.flashcards = FlashcardGenerator.generateFromQuizzes(day, quizzes);

        if (this.flashcards.length === 0) {
            Drawer.show({
                title: 'BELUM TERSEDIA',
                message: 'Flashcards untuk hari ini belum tersedia.',
                confirmText: 'KEMBALI',
                cancelText: null,
                type: 'info',
                onConfirm: () => App.navigateToLesson(day)
            });
            return;
        }

        this.nextCard();
        this.render();
    },

    nextCard() {
        this.currentCard = FlashcardGenerator.selectNextCard(
            this.currentDay,
            this.flashcards,
            this.completedCardIds
        );

        if (!this.currentCard) {
            // All cards answered correctly
            this.showCompletion();
        }
    },

    selectOption(selectedAnswer) {
        if (this.isAnswering) return;
        this.isAnswering = true;

        const isCorrect = selectedAnswer === this.currentCard.correctAnswer;

        // Update weights
        FlashcardGenerator.updateWeight(this.currentDay, this.currentCard.id, isCorrect);

        if (isCorrect) {
            this.completedCardIds.add(this.currentCard.id);
        }

        // Record answer
        this.answeredCards.push({
            id: this.currentCard.id,
            correct: isCorrect
        });

        if (isCorrect) {
            this.correctCount++;
            this.showFeedback(selectedAnswer, true);

            // Auto-advance after 500ms
            setTimeout(() => {
                this.isAnswering = false;
                this.nextCard();
                this.render();
            }, 500);
        } else {
            this.wrongCount++;
            this.showFeedback(selectedAnswer, false);

            // Stay on question, reset after 1s
            setTimeout(() => {
                this.isAnswering = false;
                this.render();
            }, 1000);
        }
    },

    showFeedback(selectedAnswer, isCorrect) {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            const answer = option.dataset.answer;
            if (answer === selectedAnswer) {
                option.classList.add(isCorrect ? 'correct' : 'wrong');
            }
        });
    },

    showCompletion() {
        const totalAttempts = this.correctCount + this.wrongCount;
        const accuracy = Math.round((this.correctCount / totalAttempts) * 100);
        const missionsComplete = ProgressManager.areMissionsComplete(this.currentDay);

        let completionMessage = '';
        let buttonHtml = '';

        if (missionsComplete) {
            // Mark day as complete
            ProgressManager.markDayComplete(this.currentDay, {
                correct: this.correctCount,
                total: this.flashcards.length,
                attempts: totalAttempts
            });
            completionMessage = 'Hari ini resmi kamu selesaikan!';
            buttonHtml = `<button class="btn btn-green" onclick="App.navigateToMap()">KEMBALI KE MAP</button>`;
        } else {
            completionMessage = 'Flashcard selesai, tapi MISI belum tuntas!';
            buttonHtml = `
                <p style="margin-bottom: 16px; font-size: 14px; opacity: 0.8;">Selesaikan semua misi di halaman materi untuk membuka hari berikutnya.</p>
                <button class="btn btn-purple" onclick="App.navigateToLesson(${this.currentDay})">KEMBALI KE MATERI</button>
            `;
        }

        const html = `
            <div class="completion-screen">
                <div class="completion-icon">${missionsComplete ? '🎉' : '⚠️'}</div>
                <h1>HARI ${this.currentDay} FLASHCARD SELESAI!</h1>
                <p>${completionMessage}</p>
                
                <div class="completion-stats">
                    <div class="stat-box">
                        <div class="stat-box-value">${this.correctCount}</div>
                        <div class="stat-box-label">Benar</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-value">${totalAttempts}</div>
                        <div class="stat-box-label">Total Jawaban</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-value">${accuracy}%</div>
                        <div class="stat-box-label">Akurasi</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-value">${this.wrongCount}</div>
                        <div class="stat-box-label">Salah</div>
                    </div>
                </div>
                
                ${buttonHtml}
            </div>
        `;

        document.getElementById('app').innerHTML = html;
    },

    render() {
        if (!this.currentCard) return;

        const progress = this.answeredCards.filter(a => a.correct).length;
        const total = this.flashcards.length;

        // Custom layout for vocab/hiragana
        const isStructured = this.currentCard.instruction && this.currentCard.word;

        let html = `
            <div class="flashcard-view">
                <div class="flashcard-header">
                    <div class="flashcard-progress">${progress}/${total}</div>
                    <div style="display:flex; gap:8px;">
                        ${App.isDev ? `<button class="btn btn-blue" onclick="FlashcardComponent.autoPlay()" style="padding: 4px 8px; font-size: 12px;">AUTO</button>` : ''}
                        <button class="btn btn-red" onclick="App.exitFlashcards()">EXIT</button>
                    </div>
                </div>
                
                <div class="flashcard-container">
                    <div class="flashcard">
                        <div class="flashcard-question">
                            ${isStructured ? `
                                <div class="instruction-text">${this.currentCard.instruction}</div>
                                <div class="word-box">
                                    <div class="word-main">${this.currentCard.word}</div>
                                    ${this.renderHint(true)}
                                </div>
                            ` : `
                                <div class="question-text">${this.currentCard.question}</div>
                                ${this.renderHint(false)}
                            `}
                        </div>
                        
                        <div class="flashcard-options">
        `;

        this.currentCard.options.forEach((option, index) => {
            const key = String.fromCharCode(65 + index); // A, B, C, D
            html += `
                <div class="option" data-answer="${option}" onclick="FlashcardComponent.selectOption('${option}')">
                    <div class="option-key">${key}</div>
                    ${option}
                </div>
            `;
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app').innerHTML = html;

        // Keyboard support
        this.setupKeyboard();
    },

    renderHint(isInsideBox = false) {
        const settings = SettingsManager.load();

        // Always hide hint if:
        // 1. User setting 'hideRomaji' is ON
        // 2. There is no hint data
        // 3. This is a READING quiz (otherwise it leaks the answer)
        const isReadingQuiz = this.currentCard.type === 'vocab-reading' || this.currentCard.type === 'hiragana';

        if (settings.hideRomaji || !this.currentCard.hint || isReadingQuiz) return '';

        const className = isInsideBox ? 'word-sub' : 'question-subtext';
        return `<div class="${className}">(${this.currentCard.hint})</div>`;
    },

    setupKeyboard() {
        document.onkeydown = (e) => {
            if (this.isAnswering) return;

            const key = e.key.toUpperCase();
            const index = key.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3

            if (index >= 0 && index < this.currentCard.options.length) {
                this.selectOption(this.currentCard.options[index]);
            }
        };
    }
};
