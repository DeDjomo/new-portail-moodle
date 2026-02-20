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
};

/**
 * Show a Warning Confirmation Modal (for suspensions/toggles)
 * @param {string} title 
 * @param {string} message 
 * @param {string} confirmButtonText
 * @param {Function} onConfirm 
 */
export const showWarningConfirm = (title, message, confirmButtonText, onConfirm) => {
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
        <div style="width:60px; height:60px; background:#FEF3C7; border-radius:50%; color:#D97706; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto; font-size:1.5rem;">
            <i class="fas fa-pause-circle"></i>
        </div>
        <h3 style="margin-bottom:0.5rem; color:#D97706; font-size:1.25rem;">${title}</h3>
        <p style="color:#6B7280; margin-bottom:2rem; line-height:1.5;">${message}</p>
        <div style="display:flex; gap:1rem; justify-content:center;">
            <button id="btnModalCancel" style="padding:0.75rem 1.5rem; border-radius:10px; border:1px solid #D1D5DB; background:white; color:#374151; cursor:pointer; font-weight:500; min-width:100px;">Annuler</button>
            <button id="btnModalConfirm" style="padding:0.75rem 1.5rem; border-radius:10px; border:none; background:#D97706; color:white; cursor:pointer; font-weight:600; min-width:100px;">${confirmButtonText}</button>
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
};

/**
 * Show a Modal for Course Status Selection
 * @param {Object} options { title, message, confirmText, confirmClass, onConfirm }
 */
export const showCourseStatusModal = ({ title, message, confirmText, confirmClass, onConfirm }) => {
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
    modal.style.padding = '2.5rem';
    modal.style.borderRadius = '24px';
    modal.style.width = '480px';
    modal.style.maxWidth = '90%';
    modal.style.textAlign = 'center';
    modal.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
    modal.style.transform = 'scale(0.95)';
    modal.style.opacity = '0';
    modal.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

    const isPublish = confirmClass === 'publish';
    const accentColor = isPublish ? '#FF6B00' : '#111827';

    modal.innerHTML = `
        <h3 style="margin-bottom:1rem; color:#111827; font-size:1.75rem; font-weight:800; letter-spacing:-0.025em; margin-top: 0.5rem;">${title}</h3>
        <div style="color:#6B7280; margin-bottom:2.5rem; line-height:1.6; font-size:1.1rem; padding: 0 1rem;">${message}</div>
        <div style="display:flex; gap:1rem; justify-content:center; padding: 0 0.5rem;">
            <button id="btnModalCancel" style="padding:0.875rem 2rem; border-radius:14px; border:2px solid #F3F4F6; background:white; color:#6B7280; cursor:pointer; font-weight:600; flex:1; transition:all 0.2s;">Annuler</button>
            <button id="btnModalConfirm" style="padding:0.875rem 2rem; border-radius:14px; border:none; background:${accentColor}; color:white; cursor:pointer; font-weight:700; flex:1; transition:all 0.2s; box-shadow: 0 10px 15px -3px ${accentColor}40;">${confirmText}</button>
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

    // Hover effects
    const cbtn = document.getElementById('btnModalConfirm');
    cbtn.onmouseover = () => cbtn.style.transform = 'translateY(-2px)';
    cbtn.onmouseout = () => cbtn.style.transform = 'translateY(0)';

    const abtn = document.getElementById('btnModalCancel');
    abtn.onmouseover = () => abtn.style.background = '#F9FAFB';
    abtn.onmouseout = () => abtn.style.background = 'white';
};

/**
 * Show a Success Confirmation Modal (for activations)
 * @param {string} title 
 * @param {string} message 
 * @param {string} confirmButtonText
 * @param {Function} onConfirm 
 */
export const showSuccessConfirm = (title, message, confirmButtonText, onConfirm) => {
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
        <div style="width:60px; height:60px; background:#D1FAE5; border-radius:50%; color:#059669; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto; font-size:1.5rem;">
            <i class="fas fa-check-circle"></i>
        </div>
        <h3 style="margin-bottom:0.5rem; color:#059669; font-size:1.25rem;">${title}</h3>
        <p style="color:#6B7280; margin-bottom:2rem; line-height:1.5;">${message}</p>
        <div style="display:flex; gap:1rem; justify-content:center;">
            <button id="btnModalCancel" style="padding:0.75rem 1.5rem; border-radius:10px; border:1px solid #D1D5DB; background:white; color:#374151; cursor:pointer; font-weight:500; min-width:100px;">Annuler</button>
            <button id="btnModalConfirm" style="padding:0.75rem 1.5rem; border-radius:10px; border:none; background:#059669; color:white; cursor:pointer; font-weight:600; min-width:100px;">${confirmButtonText}</button>
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
};

/**
 * Show a Danger Confirmation Modal (for deletions)
 * Requires typing the name to confirm
 * @param {string} title 
 * @param {string} message 
 * @param {string} confirmText - Text user must type to confirm
 * @param {Function} onConfirm 
 */
export const showDangerConfirm = (title, message, confirmText, onConfirm) => {
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
    modal.style.width = '440px';
    modal.style.maxWidth = '90%';
    modal.style.textAlign = 'center';
    modal.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
    modal.style.transform = 'scale(0.95)';
    modal.style.opacity = '0';
    modal.style.transition = 'all 0.2s ease-out';

    modal.innerHTML = `
        <div style="width:60px; height:60px; background:#FEE2E2; border-radius:50%; color:#DC2626; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto; font-size:1.5rem;">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 style="margin-bottom:0.5rem; color:#DC2626; font-size:1.25rem;">${title}</h3>
        <p style="color:#6B7280; margin-bottom:1.5rem; line-height:1.5;">${message}</p>
        <p style="color:#374151; margin-bottom:0.75rem; font-size:0.85rem;">Tapez <strong style="color:#DC2626; background:#FEE2E2; padding:2px 8px; border-radius:4px;">${confirmText}</strong> pour confirmer :</p>
        <input type="text" id="dangerConfirmInput" placeholder="Saisir le nom..." 
            style="width:80%; max-width:280px; padding:10px 16px; border:2px solid #FCA5A5; border-radius:10px; margin:0 auto 1.5rem; font-size:0.95rem; text-align:center; display:block; outline:none; transition:border-color 0.2s;">
        <div style="display:flex; gap:1rem; justify-content:center;">
            <button id="btnModalCancel" style="padding:0.75rem 1.5rem; border-radius:10px; border:1px solid #D1D5DB; background:white; color:#374151; cursor:pointer; font-weight:500; min-width:100px;">Annuler</button>
            <button id="btnModalConfirm" disabled style="padding:0.75rem 1.5rem; border-radius:10px; border:none; background:#FCA5A5; color:white; cursor:not-allowed; font-weight:600; min-width:100px;">Supprimer</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate In
    requestAnimationFrame(() => {
        modal.style.transform = 'scale(1)';
        modal.style.opacity = '1';
    });

    const input = document.getElementById('dangerConfirmInput');
    const confirmBtn = document.getElementById('btnModalConfirm');

    // Enable button only when text matches
    input.addEventListener('input', () => {
        if (input.value.trim().toLowerCase() === confirmText.toLowerCase()) {
            confirmBtn.disabled = false;
            confirmBtn.style.background = '#DC2626';
            confirmBtn.style.cursor = 'pointer';
        } else {
            confirmBtn.disabled = true;
            confirmBtn.style.background = '#FCA5A5';
            confirmBtn.style.cursor = 'not-allowed';
        }
    });

    // Event Listeners
    const cleanup = () => {
        modal.style.transform = 'scale(0.95)';
        modal.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    };

    document.getElementById('btnModalCancel').addEventListener('click', cleanup);
    confirmBtn.addEventListener('click', () => {
        if (!confirmBtn.disabled) {
            onConfirm();
            cleanup();
        }
    });

    // Focus input
    setTimeout(() => input.focus(), 100);
};

/**
 * Set Button Loading State
 * @param {HTMLButtonElement} btn 
 * @param {boolean} isLoading 
 * @param {string} loadingText 
 * @param {string} originalText 
 */
export const setLoading = (btn, isLoading, loadingText = 'Chargement...', originalText = null) => {
    if (!btn) return;

    if (isLoading) {
        if (originalText) btn.dataset.originalText = originalText;
        else if (!btn.dataset.originalText) btn.dataset.originalText = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || originalText || 'Enregistrer';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
};

/**
 * Setup Logout Logic for Admin Pages
 */
export const setupLogout = () => {
    const btnLogout = document.getElementById('btnLogout');
    if (!btnLogout) return;

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();

        showCustomConfirm(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter de l\'administration ?',
            () => {
                localStorage.removeItem('admin');
                window.location.href = '../login.html';
            }
        );
        // Stylize the modal for logout specifically (optional improvement)
        const modalIcon = document.querySelector('#custom-confirm-modal i');
        if (modalIcon) {
            modalIcon.className = 'fas fa-sign-out-alt';
            modalIcon.parentElement.style.backgroundColor = '#FEE2E2';
            modalIcon.parentElement.style.color = '#DC2626';
        }
        const modalTitle = document.querySelector('#custom-confirm-modal h3');
        if (modalTitle) modalTitle.style.color = '#DC2626';
        const confirmBtn = document.getElementById('btnModalConfirm');
        if (confirmBtn) {
            confirmBtn.style.backgroundColor = '#DC2626';
            confirmBtn.innerText = 'Déconnecter';
        }
    });
};
