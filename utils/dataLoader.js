// ============================================
// DATA LOADER - Load and cache JSON data
// ============================================

const DataLoader = {
    cache: {},

    async loadJSON(filename) {
        if (this.cache[filename]) {
            return this.cache[filename];
        }

        try {
            const response = await fetch(`data/${filename}`);
            if (!response.ok) throw new Error(`Failed to load ${filename}`);
            const data = await response.json();
            this.cache[filename] = data;
            return data;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return null;
        }
    },

    async loadAll() {
        const [schedule, curriculum, quizzes, quizzesReview] = await Promise.all([
            this.loadJSON('schedule.json'),
            this.loadJSON('curriculum.json'),
            this.loadJSON('quizzes.json'),
            this.loadJSON('quizzes_review.json')
        ]);

        return {
            schedule,
            curriculum,
            quizzes,
            quizzesReview
        };
    },

    getSchedule(day) {
        return this.cache['schedule.json']?.[day] || null;
    },

    getCurriculum(day) {
        return this.cache['curriculum.json']?.[day] || null;
    },

    getQuizzes(day) {
        return this.cache['quizzes.json']?.[day] || [];
    }
};
