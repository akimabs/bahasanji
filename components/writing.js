// ============================================
// WRITING COMPONENT - Interactive canvas for Hiragana
// ============================================

const WritingComponent = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentCharIndex: 0,
    chars: [],
    charData: null,
    currentStrokeIndex: 0,
    writingCount: 0,
    targetCount: 30, // Default as per user request
    onComplete: null,

    async start(chars, targetCount = 30, onComplete = null) {
        console.log('Starting writing practice for:', chars);
        this.chars = Array.isArray(chars) ? chars : [chars];
        if (this.chars.length === 0) this.chars = ['あ']; // Absolute fallback

        this.currentCharIndex = 0;
        this.targetCount = targetCount;
        this.onComplete = onComplete;
        this.writingCount = 0;

        await this.loadCurrentChar();
    },

    isAnimating: false,
    showTutorialResult: false,
    isLoading: false,

    async loadCurrentChar() {
        this.currentStrokeIndex = 0;
        this.writingCount = 0;
        this.isAnimating = false;
        this.isLoading = true;
        this.render();

        const char = this.chars[this.currentCharIndex];
        const encodedChar = encodeURIComponent(char);
        const subDir = this.isKatakana(char) ? 'katakana' : 'hiragana';

        // strokesvg CDN path
        const url = `https://cdn.jsdelivr.net/gh/zhengkyl/strokesvg@main/dist/${subDir}/${encodedChar}.svg`;

        try {
            console.log('Fetching writing SVG from:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const svgText = await response.text();
            this.parseSVGData(svgText);
            console.log('Writing data loaded from SVG');
        } catch (e) {
            console.error('Failed to load kana data:', e);
            this.charData = { shadows: [], strokes: [], defs: '' };
        } finally {
            this.isLoading = false;
            this.render();
        }

        if (this.charData && this.charData.shadows.length > 0) {
            setTimeout(() => this.playAnimation(), 500);
        }
    },

    isKatakana(char) {
        return char >= '\u30A0' && char <= '\u30FF';
    },

    parseSVGData(svgText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            console.error('SVG Parsing Error:', parserError.textContent);
            this.charData = { shadows: [], strokes: [], defs: '' };
            return;
        }

        // Extract defs for clipPaths
        const defs = doc.querySelector('defs')?.innerHTML || '';

        // Extract shadows (for background reference)
        // strokesvg structure: <g data-strokesvg="shadows"> containing <path> or <g>
        const shadowsGroup = doc.querySelector('g[data-strokesvg="shadows"]');
        const shadows = Array.from(shadowsGroup?.children || []).map(child => {
            if (child.tagName === 'g') {
                const firstPath = child.querySelector('path');
                return {
                    type: 'group',
                    html: child.outerHTML,
                    d: firstPath ? firstPath.getAttribute('d') : ''
                };
            }
            return { type: 'path', html: child.outerHTML, d: child.getAttribute('d') };
        }).filter(s => s.d && s.d.trim() !== ''); // Filter out empty elements

        // Extract strokes (for animation)
        const strokesGroup = doc.querySelector('g[data-strokesvg="strokes"]');
        const strokes = Array.from(strokesGroup?.children || []).map(child => {
            if (child.tagName === 'g') {
                // Animation logic will need to handle groups
                return { type: 'group', html: child.outerHTML };
            }
            return { type: 'path', html: child.outerHTML };
        }).slice(0, shadows.length); // Ensure sync with shadows

        this.charData = { defs, shadows, strokes };
    },

    render() {
        const char = this.chars[this.currentCharIndex] || '?';
        const romaji = this.getRomaji(char);
        const progress = Math.round((this.writingCount / this.targetCount) * 100);
        const hasStrokes = this.charData && this.charData.shadows && this.charData.shadows.length > 0;
        const showResult = this.isAnimating || this.showTutorialResult;

        let html = `
            <div class="writing-view">
                <div class="header">
                    <div class="header-content">
                        <button class="header-back" onclick="App.goBack()">←</button>
                        <h1>LATIHAN MENULIS</h1>
                        <div class="header-meta">${this.currentCharIndex + 1}/${this.chars.length}</div>
                    </div>
                </div>

                <div class="container mt-24">
                    <div class="writing-container">
                        <div class="writing-header-box">
                            <div id="char-ref" class="char-large-ref">
                                <div class="kana-main">${char}</div>
                                <div class="romaji-sub">${romaji}</div>
                            </div>
                            <div class="writing-meta-info">
                                <div class="stat-row">
                                    <span class="label">REPETISI</span>
                                    <span id="writing-count" class="value">${this.writingCount} / ${this.targetCount}</span>
                                </div>
                                <div class="progress-mini">
                                    <div id="writing-progress" class="progress-mini-fill" style="width: ${progress}%"></div>
                                </div>
                                <div class="writing-actions-mini">
                                    ${this.isLoading ?
                `<span class="writing-tip">Memuat data...</span>` :
                (hasStrokes ?
                    `<button class="btn-sm btn-yellow" onclick="WritingComponent.playAnimation()">LIHAT CARA TULIS</button>` :
                    `<span class="writing-tip" style="color: #666">Gagal memuat tutorial</span>`)
            }
                                </div>
                            </div>
                        </div>

                        <div class="canvas-wrapper">
                            <svg id="writing-svg" viewBox="0 0 1024 1024" class="writing-bg" xmlns="http://www.w3.org/2000/svg">
                                <defs>${this.charData?.defs || ''}</defs>
                                <!-- Background character hidden as requested -->
                                <g id="shadows-container" style="display: ${showResult ? 'block' : 'none'}">${this.renderBackgroundStrokes()}</g>
                                <g id="anim-strokes-container" style="display: ${this.isAnimating ? 'block' : 'none'}; stroke: #444; stroke-width: 128; stroke-linecap: round; fill: none;">${this.renderAnimStrokes()}</g>
                                ${this.renderStrokeNumbers()}
                            </svg>
                            <canvas id="writing-canvas" width="1024" height="1024" style="z-index: 5; position: relative;"></canvas>
                            <div id="stroke-hint" class="stroke-hint">GORESAN ${this.currentStrokeIndex + 1}/${hasStrokes ? this.charData.shadows.length : '?'}</div>
                        </div>

                        <div id="writing-actions" class="writing-actions">
                            <button class="btn btn-red" onclick="WritingComponent.clearCanvas(true)">ULANG</button>
                            ${this.renderActions()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app').innerHTML = html;
        this.initCanvas();
    },

    nextChar() {
        this.currentCharIndex++;
        if (this.currentCharIndex < this.chars.length) {
            this.loadCurrentChar();
        } else {
            this.finish();
        }
    },

    renderActions() {
        if (this.writingCount >= this.targetCount) {
            return `<button class="btn btn-green" onclick="WritingComponent.nextChar()">LANJUT →</button>`;
        } else {
            return `
                <button class="btn btn-gray" disabled>MENULIS... (${this.writingCount}/${this.targetCount})</button>
            `;
        }
    },

    updateUI() {
        const char = this.chars[this.currentCharIndex];
        const romaji = this.getRomaji(char);
        const charRef = document.getElementById('char-ref');
        if (charRef) {
            charRef.innerHTML = `
                <div class="kana-main">${char}</div>
                <div class="romaji-sub">${romaji}</div>
            `;
        }

        // Update SVG strokes and numbers
        const svg = document.getElementById('writing-svg');
        if (svg) {
            const defs = svg.querySelector('defs');
            if (defs) defs.innerHTML = this.charData?.defs || '';

            const shadowsContainer = document.getElementById('shadows-container');
            const showResult = this.isAnimating || this.showTutorialResult;
            if (shadowsContainer) {
                shadowsContainer.style.display = showResult ? 'block' : 'none';
                shadowsContainer.innerHTML = this.renderBackgroundStrokes();
            }

            const animContainer = document.getElementById('anim-strokes-container');
            if (animContainer) {
                animContainer.style.display = this.isAnimating ? 'block' : 'none';
                animContainer.innerHTML = this.renderAnimStrokes();
            }

            // Keep numbers on top
            const numbers = svg.querySelectorAll('.stroke-number-group');
            numbers.forEach(n => svg.appendChild(n));

            // Trigger animation for current stroke if animating
            if (this.isAnimating) {
                setTimeout(() => {
                    // Only animate paths belonging to the current stroke index
                    const currentStrokes = animContainer.querySelectorAll(`[data-index="${this.currentStrokeIndex}"] path, path[data-index="${this.currentStrokeIndex}"]`);
                    currentStrokes.forEach(path => {
                        try {
                            const length = path.getTotalLength();
                            path.style.strokeDasharray = length;
                            path.style.strokeDashoffset = length;
                            path.getBoundingClientRect(); // Force reflow
                            path.style.transition = 'stroke-dashoffset 0.8s linear';
                            path.style.strokeDashoffset = '0';
                        } catch (e) {
                            console.error('Error animating path:', e);
                        }
                    });
                }, 10);
            }
        }

        // Update Stroke Hint
        const hint = document.getElementById('stroke-hint');
        if (hint && this.charData && this.charData.shadows) {
            const hasShadows = this.charData.shadows.length > 0;
            const displayIdx = hasShadows ? Math.min(this.currentStrokeIndex, this.charData.shadows.length - 1) : 0;
            const totalStrokes = hasShadows ? this.charData.shadows.length : '?';

            hint.innerText = this.isAnimating ? `DEMO: Goresan ${displayIdx + 1}` : `GORESAN ${this.currentStrokeIndex + 1}/${totalStrokes}`;
            if (this.isAnimating) {
                hint.classList.add('demo-active');
            } else {
                hint.classList.remove('demo-active');
            }
        }

        // Update Repetition Count
        const count = document.getElementById('writing-count');
        if (count) count.innerText = `${this.writingCount} / ${this.targetCount}`;

        // Update Progress Bar
        const progressFill = document.getElementById('writing-progress');
        if (progressFill) {
            const progress = Math.round((this.writingCount / this.targetCount) * 100);
            progressFill.style.width = `${progress}%`;
        }

        // Update Actions
        const actions = document.getElementById('writing-actions');
        if (actions) {
            actions.innerHTML = `
                <button class="btn btn-red" onclick="WritingComponent.clearCanvas(true)">ULANG</button>
                ${this.renderActions()}
            `;
        }
    },

    renderStrokeNumbers() {
        if (!this.charData || !this.charData.shadows || !this.isAnimating) return '';

        const points = [];
        this.charData.shadows.forEach(s => {
            const d = s.d || '';
            // Robust regex for SVG path start point: handles m/M, spaces, commas, and negative numbers
            const match = d.match(/[Mm]\s*([\d.-]+)[\s,]*([\d.-]+)/);
            if (match) {
                points.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
            }
        });

        return points.map((p, idx) => `
            <g class="stroke-number-group" style="pointer-events: none">
                <circle cx="${p.x}" cy="${p.y}" r="35" fill="var(--black)" />
                <text x="${p.x}" y="${p.y + 14}" text-anchor="middle" fill="white" font-size="45" font-weight="900">
                    ${idx + 1}
                </text>
            </g>
        `).join('');
    },

    playAnimation() {
        if (!this.charData || !this.charData.shadows || this.isAnimating) return;

        this.isAnimating = true;
        let originalStrokeIndex = this.currentStrokeIndex;
        this.currentStrokeIndex = 0;
        this.clearCanvas(false);

        const btn = document.querySelector('.btn-yellow');
        if (btn) btn.innerText = 'SEDANG DICONTOHKAN...';

        const animate = (idx) => {
            if (idx >= this.charData.shadows.length) {
                // End demonstration snappily and hide everything
                this.isAnimating = false;
                this.showTutorialResult = false;
                this.currentStrokeIndex = originalStrokeIndex;
                if (btn) btn.innerText = 'LIHAT CARA TULIS ▶';
                this.updateUI();
                return;
            }

            this.currentStrokeIndex = idx;
            this.updateUI();

            const isLast = idx === this.charData.shadows.length - 1;
            setTimeout(() => animate(idx + 1), isLast ? 1000 : 1200);
        };

        animate(0);
    },


    renderBackgroundStrokes() {
        if (!this.charData || !this.charData.shadows) return '';

        // Only show if animating (Result hidden at the end per user request)
        if (!this.isAnimating) return '';

        return this.charData.shadows.map((s, idx) => {
            let className = 'stroke-bg animating finished';

            // During active animation, show strokes up to the current one
            if (this.isAnimating) {
                if (idx > this.currentStrokeIndex) return '';
                // Highlight the one that is currently being drawn
                if (idx === this.currentStrokeIndex) className = 'stroke-bg animating current';
            }

            if (s.type === 'group') {
                const temp = document.createElement('div');
                temp.innerHTML = s.html;
                temp.querySelectorAll('path').forEach(p => {
                    p.classList.add(...className.split(' '));
                });
                return temp.innerHTML;
            }
            return s.html.replace('<path', `<path class="${className}"`);
        }).join('');
    },

    renderAnimStrokes() {
        if (!this.charData || !this.charData.strokes || !this.isAnimating) return '';

        // For animation, we only need the current stroke as the background-strokes layer handles the rest
        const s = this.charData.strokes[this.currentStrokeIndex];
        if (!s) return '';

        if (s.html.startsWith('<g')) {
            return s.html.replace('<g', `<g data-index="${this.currentStrokeIndex}"`);
        }
        return s.html.replace('<path', `<path data-index="${this.currentStrokeIndex}"`);
    },

    initCanvas() {
        const canvas = document.getElementById('writing-canvas');
        if (!canvas) return;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Mouse/Touch events
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseleave', () => this.stopDrawing());
        window.addEventListener('mouseup', () => this.stopDrawing());

        canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        window.addEventListener('touchend', () => this.stopDrawing());
    },

    startDrawing(e) {
        this.isDrawing = true;
        this.showTutorialResult = false;
        this.updateUI();
        const pos = this.getMousePos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    },

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    },

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        // Simple "stroke finished" logic
        // For now, we just assume any drawing on the canvas completes the current stroke
        // Advanced: checking path proximity
        this.completeStroke();
    },

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    completeStroke() {
        this.currentStrokeIndex++;

        if (this.currentStrokeIndex >= this.charData.shadows.length) {
            // Character finished one time
            this.writingCount++;
            this.currentStrokeIndex = 0;

            // Auto clear for next repetition
            setTimeout(() => {
                this.clearCanvas(false); // false means don't reset stroke index to zero again manually, it's already 0
                this.updateUI();
            }, 500);
        } else {
            // Update UI without destroying canvas
            this.updateUI();
        }
    },

    clearCanvas(resetStroke = true) {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.showTutorialResult = false;
        if (resetStroke) {
            this.currentStrokeIndex = 0;
            this.updateUI();
        } else {
            this.updateUI();
        }
    },

    finish() {
        if (this.onComplete) this.onComplete();
        App.goBack();
    },

    getRomaji(char) {
        const kanaMap = {
            'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
            'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
            'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
            'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
            'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
            'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
            'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
            'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
            'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
            'わ': 'wa', 'を': 'wo', 'ん': 'n',
            'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
            'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
            'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
            'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
            'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
            'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
            'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
            'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
            'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
            'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
            'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
            'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
            'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
            'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
            'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
        };
        return kanaMap[char] || '';
    }
};
