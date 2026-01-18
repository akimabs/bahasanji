// ============================================
// DRAWER COMPONENT - Brutalist Bottom Sheet
// ============================================

const Drawer = {
    isOpen: false,
    config: {
        title: '',
        message: '',
        confirmText: 'OK',
        cancelText: 'BATAL',
        onConfirm: null,
        onCancel: null,
        type: 'info' // info, warning, danger
    },

    show(config) {
        this.config = { ...this.config, ...config };
        this.isOpen = true;
        this.render();

        // Trigger animation
        setTimeout(() => {
            const el = document.querySelector('.drawer-sheet');
            if (el) el.classList.add('open');
            const overlay = document.querySelector('.drawer-overlay');
            if (overlay) overlay.classList.add('open');
        }, 10);
    },

    close() {
        const el = document.querySelector('.drawer-sheet');
        const overlay = document.querySelector('.drawer-overlay');
        if (el) el.classList.remove('open');
        if (overlay) overlay.classList.remove('open');

        setTimeout(() => {
            this.isOpen = false;
            const container = document.getElementById('drawer-container');
            if (container) container.innerHTML = '';
        }, 300);
    },

    handleConfirm() {
        if (this.config.onConfirm) this.config.onConfirm();
        this.close();
    },

    handleCancel() {
        if (this.config.onCancel) this.config.onCancel();
        this.close();
    },

    render() {
        const container = document.getElementById('drawer-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'drawer-container';
            document.body.appendChild(newContainer);
        }

        const { title, message, confirmText, cancelText, type } = this.config;

        let titleColor = 'var(--black)';
        if (type === 'danger') titleColor = 'var(--red)';
        if (type === 'warning') titleColor = 'var(--orange)';

        const html = `
            <div class="drawer-overlay" onclick="Drawer.close()"></div>
            <div class="drawer-sheet type-${type}">
                <div class="drawer-handle"></div>
                <div class="drawer-content">
                    <h2 style="color: ${titleColor}">${title}</h2>
                    <p>${message}</p>
                    <div class="drawer-actions">
                        ${cancelText ? `<button class="btn btn-gray" onclick="Drawer.handleCancel()">${cancelText}</button>` : ''}
                        <button class="btn ${type === 'danger' ? 'btn-red' : 'btn-yellow'}" onclick="Drawer.handleConfirm()">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('drawer-container').innerHTML = html;
    }
};
