// ============================================
// MAP COMPONENT - 3-month progression map
// ============================================

const MapComponent = {
    render() {
        const stats = ProgressManager.getStats();

        let html = `
            <div class="header">
                <div class="header-content">
                    <h1>90 HARI JEPANG</h1>
                    <div class="header-stats">
                        <div class="stat">
                            <div class="stat-label">HARI</div>
                            <div class="stat-value">${stats.completed}/90</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">STREAK</div>
                            <div class="stat-value">${stats.streak}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="map-view">
        `;

        // Render 3 months
        for (let month = 1; month <= 3; month++) {
            html += this.renderMonth(month);
        }

        html += '</div>';

        // Add Settings FAB
        html += `
            <div class="fab" onclick="App.navigateToSettings()">
                <span>⚙️</span>
            </div>
        `;

        return html;
    },

    renderMonth(month) {
        const monthProgress = ProgressManager.getMonthProgress(month);
        const startDay = (month - 1) * 30 + 1;
        const endDay = month * 30;

        let html = `
            <div class="month-section">
                <div class="month-header">
                    <div>
                        <h2 class="month-title">BULAN ${month}</h2>
                        <div class="month-progress">
                            ${monthProgress.completed}/30 HARI (${monthProgress.percentage}%)
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${monthProgress.percentage}%"></div>
                    </div>
                </div>
                
                <div class="days-grid">
        `;

        for (let day = startDay; day <= endDay; day++) {
            html += this.renderDayCard(day);
        }

        html += `
                </div>
            </div>
        `;

        return html;
    },

    renderDayCard(day) {
        const isCompleted = ProgressManager.isCompleted(day);
        const canAccess = ProgressManager.canAccessDay(day);
        const progress = ProgressManager.getProgress();
        const isCurrent = progress.currentDay === day;

        let className = 'day-card';
        let icon = '';
        let status = '';

        if (isCompleted) {
            className += ' completed';
            icon = '✓';
            status = 'SELESAI';
        } else if (isCurrent && canAccess) {
            className += ' current';
            icon = '→';
            status = 'AKTIF';
        } else if (canAccess) {
            icon = '○';
            status = 'BUKA';
        } else {
            className += ' locked';
            status = 'TERKUNCI';
        }

        const clickable = canAccess ? `onclick="App.navigateToLesson(${day})"` : '';

        return `
            <div class="${className}" ${clickable}>
                <div class="day-icon">${icon}</div>
                <div class="day-number">${day}</div>
                <div class="day-status">${status}</div>
            </div>
        `;
    }
};
