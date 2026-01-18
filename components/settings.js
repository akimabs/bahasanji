// ============================================
// SETTINGS COMPONENT - User preferences UI
// ============================================

const SettingsComponent = {
    render() {
        const settings = SettingsManager.load();

        return `
            <div class="header">
                <div class="header-content">
                    <button class="header-back" onclick="App.navigateToMap()">←</button>
                    <h1>PENGATURAN</h1>
                    <div style="width: 40px;"></div> <!-- Spacer -->
                </div>
            </div>
            
            <div class="container">
                <div class="settings-view">
                    <div class="settings-card">
                        <h3>Tampilan</h3>
                        <div class="checklist-item ${settings.hideRomaji ? 'checked' : ''}" onclick="SettingsComponent.handleCheck('hideRomaji')">
                            <div class="checkbox-box">${settings.hideRomaji ? '✓' : ''}</div>
                            <div class="setting-info">
                                <div class="setting-label">Sembunyikan Romaji</div>
                                <div class="setting-description">Menghilangkan teks alfabet (seperti "ue", "ao") agar fokus pada Hiragana.</div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-card mt-24">
                        <h3>Progress</h3>
                        <p style="font-size: 12px; opacity: 0.7; margin-bottom: 8px;">DANGER ZONE: Tindakan ini tidak dapat dibatalkan.</p>
                        <button class="btn btn-red" onclick="SettingsComponent.resetProgress()">RESET SEMUA PROGRESS</button>
                    </div>
                </div>
            </div>
        `;
    },

    handleCheck(key) {
        const currentValue = SettingsManager.get(key);
        SettingsManager.set(key, !currentValue);
        App.navigateToSettings(); // Re-render
    },

    resetProgress() {
        Drawer.show({
            title: 'HAPUS PROGRESS?',
            message: 'Semua progress belajar Anda akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'YA, HAPUS',
            cancelText: 'BATAL',
            type: 'danger',
            onConfirm: () => {
                localStorage.clear();
                window.location.reload();
            }
        });
    }
};
