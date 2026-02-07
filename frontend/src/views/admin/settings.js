import AdminService from '../../services/adminService.js';
import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm } from '../../utils/ui.js';

console.log('Settings Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
        window.location.href = '../../login.html';
        return;
    }

    let admin = JSON.parse(adminStr);

    // Helper to update UI
    const updateUI = (data) => {
        document.getElementById('sidebarName').textContent = `${data.first_name} ${data.last_name}`;
        if (data.avatar_url) {
            const fullPath = resolveAssetPath(data.avatar_url);
            document.getElementById('sidebarAvatar').src = fullPath;
            document.getElementById('formAvatarPreview').src = fullPath;
        }

        document.getElementById('lastName').value = data.last_name || '';
        document.getElementById('firstName').value = data.first_name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.phone || '';
    };

    // Initial UI Fill
    updateUI(admin);

    // 3. Logout Logic
    document.getElementById('btnLogout').addEventListener('click', (e) => {
        e.preventDefault();
        showCustomConfirm('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', () => {
            localStorage.removeItem('admin');
            window.location.href = '../../login.html';
        });
    });

    // 4. Avatar Preview (Client side interaction only)
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('formAvatarPreview');

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // 5. Profile Update
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('first_name', document.getElementById('firstName').value);
        formData.append('last_name', document.getElementById('lastName').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('phone', document.getElementById('phone').value);

        if (avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }

        try {
            const response = await AdminService.update(admin.id, formData);

            if (response.admin) {
                // Update Local Storage
                admin = response.admin;
                localStorage.setItem('admin', JSON.stringify(admin));

                // Update UI immediately with new data (including new avatar URL from backend)
                updateUI(admin);

                showToast('Profil mis à jour avec succès !');
            } else {
                // Fallback if backend doesn't return admin object (should probably reload)
                showToast('Profil mis à jour ! Actualisation...', 'success');
                setTimeout(() => location.reload(), 1000);
            }

        } catch (error) {
            console.error(error);
            showToast('Erreur lors de la mise à jour.', 'error');
        }
    });

    // 6. Security Update
    document.getElementById('securityForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;

        if (newPass !== confirmPass) {
            document.getElementById('passwordError').style.display = 'block';
            return;
        }
        document.getElementById('passwordError').style.display = 'none';

        try {
            await AdminService.update(admin.id, { password: newPass });
            showToast('Mot de passe mis à jour ! Redirection...', 'success');

            setTimeout(() => {
                localStorage.removeItem('admin');
                window.location.href = '../../login.html';
            }, 1500);

        } catch (error) {
            console.error(error);
            showToast('Erreur lors du changement de mot de passe.', 'error');
        }
    });
});
