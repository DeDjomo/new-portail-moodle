import ActualiteService from '../../services/actualiteService.js';
import { requireAuth } from '../../utils/auth-guard.js';
import { setupLogout, showToast, showDangerConfirm } from '../../utils/ui.js';

let newsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const user = requireAuth('STANDARD_ADMIN');
    if (!user) return;

    // 2. Logout Logic
    setupLogout();

    // 3. Load News (filtered by admin, unless superadmin)
    const loadId = user.type === 'SUPER_ADMIN' ? null : user.id;
    loadNews(loadId);

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = newsData.filter(item =>
            item.title.toLowerCase().includes(term)
        );
        renderNews(filtered);
    });
});

async function loadNews(adminId) {
    const list = document.getElementById('newsList');
    try {
        const response = await ActualiteService.getByAdmin(adminId);
        newsData = response.data || response || [];
        renderNews(newsData);
    } catch (error) {
        console.error(error);
        list.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#DC2626;">Erreur de chargement</td></tr>';
    }
}

function renderNews(news) {
    const list = document.getElementById('newsList');
    if (news.length === 0) {
        list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:40px; color:#9CA3AF;">Aucune actualité trouvée</td></tr>';
        return;
    }

    list.innerHTML = news.map(item => `
        <tr>
            <td>
                <div style="font-weight:600; color:var(--text-primary);">${item.title}</div>
            </td>
            <td>${new Date(item.created_at).toLocaleDateString('fr-FR')}</td>
            <td>
                <div class="actions-group">
                    <a href="edit-actualite.html?id=${item.id}" class="action-btn" title="Modifier" style="background:#DBEAFE; color:#2563EB;">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="../actualite-detail.html?id=${item.id}" target="_blank" class="action-btn" title="Voir" style="background:#EDE9FE; color:#7C3AED;">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="action-btn" onclick="window.confirmDeleteNews(${item.id}, '${item.title.replace(/'/g, "\\'")}')" title="Supprimer" style="background:#FEE2E2; color:#DC2626; border:none; cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.confirmDeleteNews = (id, title) => {
    const admin = JSON.parse(localStorage.getItem('admin'));
    showDangerConfirm(
        'Supprimer l\'actualité',
        `Êtes-vous sûr de vouloir supprimer l'actualité "<strong>${title}</strong>" ? Cette action est irréversible.`,
        'supprimer',
        async () => {
            try {
                await ActualiteService.delete(id);
                showToast('Actualité supprimée avec succès');
                const loadId = admin.type === 'SUPER_ADMIN' ? null : admin.id;
                loadNews(loadId);
            } catch (error) {
                console.error('Delete error:', error);
                showToast('Erreur lors de la suppression', 'error');
            }
        }
    );
};
