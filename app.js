// ============================================
// MAIN APP - Router and orchestration
// ============================================

const App = {
    currentView: 'map',
    previousView: null,
    previousLessonDay: null,

    async init() {
        console.log('🚀 Initializing BAHASANJI...');

        // Load all data
        await DataLoader.loadAll();

        // Setup History API handling
        window.onpopstate = (e) => this.handlePopState(e);

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('✅ Service Worker Registered', reg))
                .catch(err => console.error('❌ Service Worker Failed', err));
        }

        // Hide loading screen
        document.getElementById('loading').classList.add('hidden');

        // Initial navigation
        const path = window.location.hash.slice(1);
        if (path.startsWith('lesson/')) {
            const day = parseInt(path.split('/')[1]);
            this.navigateToLesson(day, false);
        } else if (path === 'settings') {
            this.navigateToSettings(false);
        } else {
            this.navigateToMap(false);
        }

        console.log('✅ App ready!');
    },

    handlePopState(event) {
        const state = event.state;
        if (!state) {
            this.navigateToMap(false);
            return;
        }

        switch (state.view) {
            case 'map': this.navigateToMap(false); break;
            case 'settings': this.navigateToSettings(false); break;
            case 'lesson': this.navigateToLesson(state.day, false); break;
            case 'writing':
                // Writing might need context, but for simple back we use what's in state
                if (state.chars) WritingComponent.start(state.chars, state.count);
                this.currentView = 'writing';
                break;
            default: this.navigateToMap(false);
        }
    },

    navigateToMap(push = true) {
        if (push) history.pushState({ view: 'map' }, '', '#map');
        this.previousView = this.currentView;
        this.currentView = 'map';
        document.onkeydown = null;
        const html = MapComponent.render();
        document.getElementById('app').innerHTML = html;
        window.scrollTo(0, 0);
    },

    navigateToSettings(push = true) {
        if (push) history.pushState({ view: 'settings' }, '', '#settings');
        this.previousView = this.currentView;
        this.currentView = 'settings';
        const html = SettingsComponent.render();
        document.getElementById('app').innerHTML = html;
        window.scrollTo(0, 0);
    },

    navigateToLesson(day, push = true) {
        if (!ProgressManager.canAccessDay(day)) {
            Drawer.show({
                title: 'HARI TERKUNCI',
                message: 'Selesaikan hari sebelumnya terlebih dahulu untuk membuka materi ini.',
                confirmText: 'MENGERTI',
                cancelText: null,
                type: 'warning'
            });
            return;
        }

        if (push) history.pushState({ view: 'lesson', day }, '', `#lesson/${day}`);
        this.previousView = this.currentView;
        this.previousLessonDay = day;
        this.currentView = 'lesson';
        document.onkeydown = null;
        const html = LessonComponent.render(day);
        document.getElementById('app').innerHTML = html;
        window.scrollTo(0, 0);
    },

    async navigateToWriting(char, count, onComplete, push = true) {
        if (push) history.pushState({ view: 'writing', chars: char, count }, '', '#writing');
        this.previousView = this.currentView;
        this.currentView = 'writing';
        document.onkeydown = null;
        await WritingComponent.start(char, count, onComplete);
        window.scrollTo(0, 0);
    },

    goBack() {
        history.back();
    },

    async startFlashcards(day) {
        this.currentView = 'flashcard';
        await FlashcardComponent.start(day);
    },

    exitFlashcards() {
        Drawer.show({
            title: 'KELUAR?',
            message: 'Progress latihan Anda tidak akan tersimpan jika keluar sekarang.',
            confirmText: 'YA, KELUAR',
            cancelText: 'LANJUT',
            type: 'warning',
            onConfirm: () => this.navigateToMap()
        });
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
