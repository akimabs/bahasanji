// SERVICE WORKER - BAHASANJI
const CACHE_NAME = 'bahasanji-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './favicon.svg',
    // Components
    './components/map.js',
    './components/lesson.js',
    './components/settings.js',
    './components/writing.js',
    './components/flashcard.js',
    './components/drawer.js',
    // Utils
    './utils/dataLoader.js',
    './utils/progressManager.js',
    './utils/flashcardGenerator.js',
    './utils/settingsManager.js',
    // Data
    './data/curriculum.json',
    './data/schedule.json',
    './data/quizzes.json',
    './data/quizzes_review.json'
];

// Install Event - Cache Assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching assets...');
                return cache.addAll(ASSETS);
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

// Fetch Event - Serve from Cache, fall back to Network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// Push Notification Event
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Waktunya belajar Jepang!',
        icon: 'favicon.svg',
        badge: 'favicon.svg',
        vibrate: [100, 50, 100]
    };

    event.waitUntil(
        self.registration.showNotification('BAHASANJI', options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('./')
    );
});
