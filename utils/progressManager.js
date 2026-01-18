// ============================================
// PROGRESS MANAGER - Track user progress
// ============================================

const ProgressManager = {
    STORAGE_KEY: '90hari_progress',

    getProgress() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }

        // Default progress
        return {
            completedDays: [],
            currentDay: 1,
            flashcardScores: {},
            missionProgress: {}, // New: Stores completed mission indices per day
            streak: 0,
            totalXP: 0,
            lastAccessDate: new Date().toISOString().split('T')[0]
        };
    },

    saveProgress(progress) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    },

    isCompleted(day) {
        const progress = this.getProgress();
        return progress.completedDays.includes(day);
    },

    canAccessDay(day) {
        const progress = this.getProgress();

        // Day 1 always accessible
        if (day === 1) return true;

        // Check if previous day is completed
        const previousDay = day - 1;
        return progress.completedDays.includes(previousDay);
    },

    markDayComplete(day, score) {
        const progress = this.getProgress();

        if (!progress.completedDays.includes(day)) {
            progress.completedDays.push(day);
            progress.completedDays.sort((a, b) => a - b);
        }

        progress.flashcardScores[day] = score;
        progress.currentDay = Math.max(progress.currentDay, day + 1);
        progress.totalXP += score.correct * 10;

        // Update streak
        this.updateStreak(progress);

        this.saveProgress(progress);
        return progress;
    },

    getMissionProgress(day) {
        const progress = this.getProgress();
        return progress.missionProgress[day] || [];
    },

    toggleMission(day, index) {
        const progress = this.getProgress();
        if (!progress.missionProgress[day]) {
            progress.missionProgress[day] = [];
        }

        const missionIdx = progress.missionProgress[day].indexOf(index);
        if (missionIdx === -1) {
            progress.missionProgress[day].push(index);
        } else {
            progress.missionProgress[day].splice(missionIdx, 1);
        }

        this.saveProgress(progress);
        return progress.missionProgress[day];
    },

    markMissionComplete(day, index) {
        const progress = this.getProgress();
        if (!progress.missionProgress[day]) {
            progress.missionProgress[day] = [];
        }

        if (!progress.missionProgress[day].includes(index)) {
            progress.missionProgress[day].push(index);
            this.saveProgress(progress);
        }
    },

    areMissionsComplete(day) {
        const curriculum = DataLoader.getCurriculum(day);
        if (!curriculum || !curriculum.blocks) return true;

        const missionBlock = curriculum.blocks.find(b => b.type === 'mission');
        if (!missionBlock) return true;

        const totalMissions = missionBlock.content.length;
        const completedMissions = this.getMissionProgress(day).length;

        return completedMissions >= totalMissions;
    },

    updateStreak(progress) {
        const today = new Date().toISOString().split('T')[0];
        const lastAccess = progress.lastAccessDate;

        const todayDate = new Date(today);
        const lastDate = new Date(lastAccess);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Same day, keep streak
        } else if (diffDays === 1) {
            // Consecutive day, increment streak
            progress.streak += 1;
        } else {
            // Streak broken
            progress.streak = 1;
        }

        progress.lastAccessDate = today;
    },

    getStats() {
        const progress = this.getProgress();
        const totalDays = 90;
        const completed = progress.completedDays.length;
        const percentage = Math.round((completed / totalDays) * 100);

        return {
            completed,
            total: totalDays,
            percentage,
            streak: progress.streak,
            xp: progress.totalXP,
            currentDay: progress.currentDay
        };
    },

    getMonthProgress(month) {
        const progress = this.getProgress();
        const startDay = (month - 1) * 30 + 1;
        const endDay = month * 30;

        let completed = 0;
        for (let day = startDay; day <= endDay; day++) {
            if (progress.completedDays.includes(day)) {
                completed++;
            }
        }

        return {
            completed,
            total: 30,
            percentage: Math.round((completed / 30) * 100)
        };
    },

    resetProgress() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
