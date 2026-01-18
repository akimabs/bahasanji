// ============================================
// LESSON COMPONENT - Display curriculum content
// ============================================

const LessonComponent = {
    currentDay: null,

    render(day) {
        this.currentDay = day;
        const schedule = DataLoader.getSchedule(day);
        const curriculum = DataLoader.getCurriculum(day);

        if (!schedule) {
            return '<div class="container"><h1>HARI TIDAK DITEMUKAN</h1></div>';
        }

        let html = `
            <div class="lesson-view">
                <div class="lesson-header">
                    <div class="lesson-meta">HARI ${day} / 90</div>
                    <h1 class="lesson-title">${schedule.title}</h1>
                    <p>${schedule.description}</p>
                </div>
                
                <div class="lesson-content">
        `;

        if (curriculum && curriculum.blocks) {
            html += this.renderBlocks(curriculum.blocks);
        } else {
            html += '<div class="content-block"><p>Konten materi akan segera tersedia.</p></div>';
        }

        const missionComplete = ProgressManager.areMissionsComplete(day);
        const progress = ProgressManager.getProgress();
        const flashcardDone = !!progress.flashcardScores[day];
        const dayComplete = ProgressManager.isCompleted(day);

        let actionHtml = '';
        if (dayComplete) {
            actionHtml = `
                <button class="btn" onclick="App.navigateToMap()">← KEMBALI</button>
                <div class="completion-pill">✅ HARI SELESAI</div>
            `;
        } else if (flashcardDone && missionComplete) {
            actionHtml = `
                <button class="btn btn-green" style="width: 100%" onclick="LessonComponent.finishDay(${day})">YEAY! SELESAIKAN HARI ${day} 🎉</button>
            `;
        } else {
            actionHtml = `
                <button class="btn" onclick="App.navigateToMap()">← KEMBALI</button>
                <button class="btn btn-yellow" onclick="App.startFlashcards(${day})">
                    ${flashcardDone ? 'ULANG' : 'LATIHAN'} →
                    ${flashcardDone ? '✅' : ''}
                </button>
            `;
        }

        html += `
                </div>
                
                <div class="lesson-actions">
                    ${actionHtml}
                </div>
            </div>
        `;

        return html;
    },

    renderBlocks(blocks) {
        let html = '';

        blocks.forEach(block => {
            if (block.type === 'section') {
                html += this.renderSection(block.content);
            } else if (block.type === 'mission') {
                html += this.renderMission(block.content);
            } else if (block.type === 'vocab') {
                html += this.renderVocab(block.content);
            }
        });

        return html;
    },

    renderVocab(items) {
        const settings = SettingsManager.load();
        let html = `
            <div class="content-block section-purple">
                <div class="block-title">
                    <h3>KOSAKATA BARU</h3>
                </div>
                <div class="vocab-grid">
        `;

        items.forEach(item => {
            html += `
                <div class="vocab-item">
                    <div class="vocab-word">${item.word}</div>
                    ${settings.hideRomaji ? '' : `<div class="vocab-reading">(${item.reading})</div>`}
                    <div class="vocab-meaning">${item.meaning}</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
        return html;
    },

    renderSection(content) {
        const colorClass = content.color ? `section-${content.color}` : '';
        let html = `<div class="content-block ${colorClass}">`;

        if (content.title) {
            html += `
                <div class="block-title">
                    ${content.icon ? `<div class="block-label">${this.processIcon(content.icon)}</div>` : ''}
                    <h3>${content.title}</h3>
                </div>
            `;
        }

        if (typeof content.children === 'string') {
            html += `<p>${this.processText(content.children)}</p>`;
        } else if (Array.isArray(content.children)) {
            content.children.forEach(child => {
                if (child.type === 'list') {
                    html += this.renderList(child.content);
                } else if (child.type === 'highlight') {
                    html += this.renderHighlight(child.content);
                } else if (child.type === 'paragraph') {
                    html += `<p>${this.processText(child.content)}</p>`;
                } else if (child.type === 'example') {
                    html += this.renderExample(child.content);
                }
            });
        }

        html += '</div>';
        return html;
    },

    renderList(items) {
        let html = '<ul class="block-list">';
        items.forEach(item => {
            html += `<li>${this.processText(item)}</li>`;
        });
        html += '</ul>';
        return html;
    },

    renderHighlight(content) {
        return `
            <div class="highlight-box">
                <strong>${content.title || 'PENTING'}:</strong> ${this.processText(content.text)}
            </div>
        `;
    },

    renderExample(content) {
        return `
            <div class="highlight-box">
                <strong>${content.title || 'CONTOH'}:</strong><br>
                ${this.processText(content.text)}
            </div>
        `;
    },

    renderMission(items) {
        const completed = ProgressManager.getMissionProgress(this.currentDay);

        let html = `
            <div class="mission-box">
                <h3>MISI HARI INI</h3>
                <p style="font-size: 11px; opacity: 0.7; margin-bottom: 12px;">Selesaikan misi-misi di bawah ini untuk membuka kunci hari berikutnya.</p>
                <div class="mission-list">
        `;

        items.forEach((item, index) => {
            const isChecked = completed.includes(index);
            const writingTask = this.detectWritingTask(item);

            html += `
                <div class="mission-item ${isChecked ? 'completed' : ''}">
                    ${writingTask ? '' : `<div class="mission-check" onclick="LessonComponent.toggleMission(${index})">${isChecked ? '✓' : ''}</div>`}
                    <div class="mission-text" ${writingTask ? '' : `onclick="LessonComponent.toggleMission(${index})"`}>
                        ${this.processText(item)}
                    </div>
                    ${writingTask && !isChecked ? `
                        <button class="btn btn-purple btn-sm" style="margin-left: auto; padding: 4px 8px; font-size: 10px;" 
                                onclick='App.navigateToWriting(${JSON.stringify(writingTask.allChars)}, ${writingTask.count}, () => ProgressManager.markMissionComplete(${this.currentDay}, ${index}))'>
                            TULIS
                        </button>
                    ` : (writingTask && isChecked ? '<div class="mission-check-static">✓</div>' : '')}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
        return html;
    },

    detectWritingTask(text) {
        // Find characters in parentheses: (あ, い, う) or (あ)
        let chars = [];
        const parenMatch = text.match(/\(([^)]+)\)/);
        if (parenMatch) {
            chars = parenMatch[1].split(/[,\s]+/).map(c => c.trim()).filter(c => c.length === 1 && /[ぁ-んァ-ヶ]/.test(c));
        }

        // If no chars in parentheses, look for single char "Tulis あ"
        if (chars.length === 0) {
            const singleMatch = text.match(/Tulis ([ぁ-んァ-ヶ])/);
            if (singleMatch) chars = [singleMatch[1]];
        }

        if (chars.length > 0) {
            const countMatch = text.match(/(\d+) kali/);
            return {
                char: chars[0],
                allChars: chars,
                count: countMatch ? parseInt(countMatch[1]) : 10
            };
        }

        return null;
    },

    toggleMission(index) {
        ProgressManager.toggleMission(this.currentDay, index);
        // Re-render the lesson to show updated state
        const html = this.render(this.currentDay);
        document.getElementById('app').innerHTML = html;
        // Maintain scroll position if possible, but for simplicity just re-render
    },

    finishDay(day) {
        const progress = ProgressManager.getProgress();
        const score = progress.flashcardScores[day] || { correct: 0, total: 50, attempts: 50 };

        ProgressManager.markDayComplete(day, score);
        App.navigateToMap();
    },

    processText(text) {
        const settings = SettingsManager.load();
        let processed = text.replace(/\n/g, '<br>');

        if (settings.hideRomaji) {
            processed = processed.replace(/\([a-z\s\-,']+\)/gi, '');
        }

        return processed;
    },

    processIcon(icon) {
        // Filter out actual emoji icons, keep text categories
        if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(icon)) return '';
        return icon.trim();
    }
};
