// ============================================
// SETTINGS MANAGER - Persistence for user preferences
// ============================================

const SettingsManager = {
    settings: {
        hideRomaji: false,
    },

    load() {
        const saved = localStorage.getItem('nipp_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
        return this.settings;
    },

    save() {
        localStorage.setItem('nipp_settings', JSON.stringify(this.settings));
    },

    set(key, value) {
        if (key in this.settings) {
            this.settings[key] = value;
            this.save();
        }
    },

    get(key) {
        return this.settings[key];
    }
};

// Initialize settings on load
SettingsManager.load();
