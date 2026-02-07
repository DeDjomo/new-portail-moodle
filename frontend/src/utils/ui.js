/**
 * UI Utilities for Notifications and Modals
 */

// Create Toast Container if not exists
const getToastContainer = () => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
    return container;
};

/**
 * Show a Toast Notification
 * @param {string} message 
 * @param {string} type 'success' | 'error'
 */
export const showToast = (message, type = 'success') => {
    const container = getToastContainer();
    const toast = document.createElement('div');

    // Style based on type
    const bgColor = type === 'success' ? '#10B981' : '#EF4444';
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';

    toast.className = 'toast-notification';
    toast.style.background = bgColor;
    toast.style.color = 'white';
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.75rem';
    toast.style.minWidth = '300px';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease-out';
    toast.style.fontSize = '0.95rem';

    toast.innerHTML = `${icon} <span>${message}</span>`;

    container.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

/**
 * Show a Custom Confirmation Modal
 * @param {string} title 
 * @param {string} message 
 * @param {Function} onConfirm 
 */
export const showCustomConfirm = (title, message, onConfirm) => {
    // Remove existing modal if any
    const existing = document.getElementById('custom-confirm-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-modal';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backdropFilter = 'blur(4px)';

    const modal = document.createElement('div');
    modal.style.background = 'white';
    modal.style.padding = '2rem';
    modal.style.borderRadius = '16px';
    modal.style.width = '400px';
    modal.style.maxWidth = '90%';
    modal.style.textAlign = 'center';
    modal.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
    modal.style.transform = 'scale(0.95)';
    modal.style.opacity = '0';
    modal.style.transition = 'all 0.2s ease-out';

    modal.innerHTML = `
        <div style="width:60px; height:60px; background:#F3F4F6; border-radius:50%; color:#4B5563; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto; font-size:1.5rem;">
            <i class="fas fa-question"></i>
        </div>
        <h3 style="margin-bottom:0.5rem; color:#111827; font-size:1.25rem;">${title}</h3>
        <p style="color:#6B7280; margin-bottom:2rem; line-height:1.5;">${message}</p>
        <div style="display:flex; gap:1rem; justify-content:center;">
            <button id="btnModalCancel" style="padding:0.75rem 1.5rem; border-radius:8px; border:1px solid #D1D5DB; background:white; color:#374151; cursor:pointer; font-weight:500; flex:1;">Annuler</button>
            <button id="btnModalConfirm" style="padding:0.75rem 1.5rem; border-radius:8px; border:none; background:#111827; color:white; cursor:pointer; font-weight:500; flex:1;">Confirmer</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate In
    requestAnimationFrame(() => {
        modal.style.transform = 'scale(1)';
        modal.style.opacity = '1';
    });

    // Event Listeners
    const cleanup = () => {
        modal.style.transform = 'scale(0.95)';
        modal.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    };

    document.getElementById('btnModalCancel').addEventListener('click', cleanup);
    document.getElementById('btnModalConfirm').addEventListener('click', () => {
        onConfirm();
        cleanup();
    });

    // Valid for "export" context too if we want to customize icon/color dynamically, 
    // but for now this is a generic confirm.
};
