import EnrollmentService from '../../services/enrollmentService.js';
import { resolveAssetPath } from '../../services/api.js';
import { showToast, showCustomConfirm, showDangerConfirm, setupLogout, showProgressModal } from '../../utils/ui.js';
import { requireAuth } from '../../utils/auth-guard.js';
import StudentService from '../../services/studentService.js';

console.log('Students Page loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const admin = requireAuth('STANDARD_ADMIN');
    if (!admin) return;

    setupLogout();

    let allEnrollments = [];

    // 4. Fetch & Render Data
    try {
        const response = await EnrollmentService.getByAdmin(admin.id);
        allEnrollments = Array.isArray(response) ? response : (response.data || []);

        // Update badge count
        document.getElementById('totalStudentsBadge').textContent = allEnrollments.length;

        renderGroups(allEnrollments);

    } catch (error) {
        console.error('Students Page Error:', error);
        document.getElementById('studentsContainer').innerHTML = '<div style="text-align:center; color:red; padding:2rem;">Erreur lors du chargement des étudiants.</div>';
    }

    // Helper: Export to CSV
    function exportToCSV(data, filename) {
        if (data.length === 0) {
            alert("Aucune donnée à exporter.");
            return;
        }

        const headers = ["username", "firstname", "lastname", "password", "email"];
        const rows = data.map(item => [
            item.email, // username
            item.first_name,
            item.last_name,
            "studentpassword",
            item.email
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += headers.join(",") + "\r\n";

        rows.forEach(rowArray => {
            const row = rowArray.map(field => `"${field}"`).join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function renderGroups(resultSet) {
        const container = document.getElementById('studentsContainer');
        container.innerHTML = '';

        if (resultSet.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 4rem; color: #6B7280;">Aucun étudiant trouvé.</div>`;
            return;
        }

        // Group by Course Title and capture Course ID
        const groups = {};
        const courseIds = {}; // Map title to ID

        resultSet.forEach(item => {
            const courseTitle = item.course_title || 'Sans Titre';
            if (!groups[courseTitle]) {
                groups[courseTitle] = [];
                courseIds[courseTitle] = item.course_id;
            }
            groups[courseTitle].push(item);
        });

        // Render each group
        Object.keys(groups).sort().forEach(courseTitle => {
            const students = groups[courseTitle];
            const courseId = courseIds[courseTitle];

            // Filter Pending students for this course
            const pendingStudents = students.filter(s => s.status === 'PENDING');
            const hasPending = pendingStudents.length > 0;

            // Section Wrapper
            const section = document.createElement('div');
            section.className = 'course-section-group';
            section.style.marginBottom = '3rem';

            // Header Container
            const headerContainer = document.createElement('div');
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'center';
            headerContainer.style.marginBottom = '1rem';

            // Title
            const header = document.createElement('h3');
            header.style.color = '#111827';
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.margin = '0';
            header.style.gap = '0.5rem';
            header.innerHTML = `
                <i class="fas fa-book" style="color:#FF6B00;"></i> 
                ${courseTitle} 
                <span style="background:#F3F4F6; color:#6B7280; padding:2px 8px; border-radius:12px; font-size:0.8rem;">${students.length}</span>
            `;

            // Export Button
            const btnExport = document.createElement('button');
            btnExport.className = 'btn-primary';
            btnExport.style.fontSize = '0.85rem';
            btnExport.style.padding = '0.4rem 1rem';
            btnExport.style.backgroundColor = hasPending ? '#10B981' : '#E5E7EB'; // Green if active, Gray if disabled
            btnExport.style.borderColor = hasPending ? '#10B981' : '#E5E7EB';
            btnExport.style.color = hasPending ? 'white' : '#9CA3AF';
            btnExport.style.cursor = hasPending ? 'pointer' : 'not-allowed';
            btnExport.innerHTML = `<i class="fas fa-file-csv"></i> Exporter (${pendingStudents.length})`;
            btnExport.disabled = !hasPending;

            if (hasPending) {
                btnExport.addEventListener('click', () => {
                    showCustomConfirm(
                        'Exporter et Valider ?',
                        `Voulez-vous exporter les <strong>${pendingStudents.length}</strong> inscriptions en attente pour "<strong>${courseTitle}</strong>" ?`,
                        async () => {
                            // Show Progress Modal
                            const updateProgress = showProgressModal('Export en cours...', 'Préparation des fichiers...');

                            await new Promise(r => setTimeout(r, 500)); // Fake init delay

                            // 1. Export CSV
                            updateProgress(30, 'Génération du CSV...');
                            exportToCSV(pendingStudents, `inscriptions_${courseTitle.replace(/\s+/g, '_')}_pending.csv`);

                            await new Promise(r => setTimeout(r, 500)); // Visual delay

                            // 2. Mark as Done on Backend
                            updateProgress(60, 'Mise à jour des statuts...');
                            try {
                                await EnrollmentService.markAsDone(courseId);
                                updateProgress(100, 'Terminé !');
                                await new Promise(r => setTimeout(r, 500)); // Show 100%

                                // 3. Refresh Data
                                document.getElementById('progressModal').remove();
                                showToast('Export terminé. Statuts mis à jour.', 'success');
                                setTimeout(() => location.reload(), 1000);
                            } catch (err) {
                                console.error(err);
                                document.getElementById('progressModal').remove();
                                showToast('Erreur lors de la mise à jour des statuts.', 'error');
                            }
                        }
                    );
                });
            }

            headerContainer.appendChild(header);
            headerContainer.appendChild(btnExport);
            section.appendChild(headerContainer);

            // Table
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-responsive';

            const table = document.createElement('table');
            table.className = 'custom-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Étudiant</th>
                        <th>Email</th>
                        <th>Date d'inscription</th>
                        <th>Statut</th>
                        <th style="text-align:center;">Notifier</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');

            students.forEach(item => {
                const tr = document.createElement('tr');

                // Format Date
                const date = new Date(item.enrolled_at);
                const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

                // Status Badge
                const statusClass = item.status === 'DONE' ? 'badge-published' : 'badge-draft';
                const statusLabel = item.status === 'DONE' ? 'Effectué' : (item.status === 'PENDING' ? 'En attente' : item.status);

                const studentName = `${item.first_name} ${item.last_name}`;
                const studentInitial = item.first_name.charAt(0);

                tr.innerHTML = `
                    <td>
                        <div class="course-info-cell">
                            <div style="width:32px; height:32px; background:#E5E7EB; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#4B5563; font-weight:bold; margin-right:10px;">
                                ${studentInitial}
                            </div>
                            <span style="font-weight: 600;">${studentName}</span>
                        </div>
                    </td>
                    <td><a href="mailto:${item.email}" style="color:var(--primary); text-decoration:none;">${item.email}</a></td>
                    <td>${dateStr}</td>
                    <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td style="text-align:center;">
                        <button class="btn-notify-email" data-student-id="${item.student_id}" data-course-id="${item.course_id}" data-student-name="${studentName}" data-course-title="${item.course_title}" title="${item.status === 'DONE' ? 'Déjà notifié / Validé' : 'Envoyer un email de confirmation'}" style="background:none; border:1px solid ${item.status === 'DONE' ? '#D1D5DB' : '#10B981'}; color:${item.status === 'DONE' ? '#9CA3AF' : '#10B981'}; width:36px; height:36px; border-radius:50%; cursor:${item.status === 'DONE' ? 'not-allowed' : 'pointer'}; display:inline-flex; align-items:center; justify-content:center; transition:all 0.3s;" ${item.status === 'DONE' ? 'disabled' : ''}>
                            <i class="fas ${item.status === 'DONE' ? 'fa-check' : 'fa-envelope'}"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            tableWrapper.appendChild(table);
            section.appendChild(tableWrapper);
            container.appendChild(section);
        });

        // Attach email notification handlers
        container.querySelectorAll('.btn-notify-email').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const studentId = btn.dataset.studentId;
                const courseId = btn.dataset.courseId;
                const studentName = btn.dataset.studentName;
                const courseTitle = btn.dataset.courseTitle;

                // Confirm before sending using custom modal
                showCustomConfirm(
                    'Confirmer l\'envoi',
                    `Voulez-vous envoyer un email de confirmation d'inscription à <strong>${studentName}</strong> pour le cours "<strong>${courseTitle}</strong>" ?`,
                    async () => {
                        // Show spinner
                        const originalContent = btn.innerHTML;
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                        btn.disabled = true;
                        btn.style.opacity = '0.6';

                        try {
                            await EnrollmentService.sendNotification(studentId, courseId);
                            btn.innerHTML = '<i class="fas fa-check"></i>';
                            btn.style.borderColor = '#10B981';
                            btn.style.color = '#10B981';
                            showToast(`Email envoyé à ${studentName}`, 'success');

                            // After 1.5 seconds, reload the page to show the updated "DONE" status
                            setTimeout(() => {
                                location.reload();
                            }, 1500);
                        } catch (error) {
                            console.error('Email send error:', error);
                            btn.innerHTML = '<i class="fas fa-times"></i>';
                            btn.style.borderColor = '#EF4444';
                            btn.style.color = '#EF4444';
                            showToast('Échec de l\'envoi de l\'email', 'error');

                            setTimeout(() => {
                                btn.innerHTML = originalContent;
                                btn.disabled = false;
                                btn.style.opacity = '1';
                                btn.style.borderColor = '#10B981';
                                btn.style.color = '#10B981';
                            }, 3000);
                        }
                    }
                );
            });
        });
    }

    // Helper: Custom Confirm Modal
    function showCustomConfirm(title, message, onConfirm) {
        // Remove existing if any
        const existing = document.getElementById('customModal');
        if (existing) existing.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'customModal';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.zIndex = '9999';
        modalOverlay.style.backdropFilter = 'blur(4px)';

        const modalContent = document.createElement('div');
        modalContent.style.background = 'white';
        modalContent.style.padding = '2rem';
        modalContent.style.borderRadius = '16px';
        modalContent.style.maxWidth = '400px';
        modalContent.style.width = '90%';
        modalContent.style.textAlign = 'center';
        modalContent.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        modalContent.style.animation = 'fadeUp 0.3s ease-out';


        modalContent.innerHTML = `
            <div style="width:50px; height:50px; background:#D1FAE5; border-radius:50%; color:#059669; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto; font-size:1.5rem;">
                <i class="fas fa-file-export"></i>
            </div>
            <h3 style="margin-bottom:0.5rem; color:#111827; font-size:1.25rem;">${title}</h3>
            <p style="color:#6B7280; margin-bottom:1.5rem; line-height:1.5;">${message}</p>
            <div style="display:flex; gap:1rem; justify-content:center;">
                <button id="btnModalCancel" style="padding:0.6rem 1.2rem; border-radius:8px; border:1px solid #D1D5DB; background:white; color:#374151; cursor:pointer; font-weight:500;">Annuler</button>
                <button id="btnModalConfirm" style="padding:0.6rem 1.2rem; border-radius:8px; border:none; background:#059669; color:white; cursor:pointer; font-weight:500;">Confirmer</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        document.getElementById('btnModalCancel').addEventListener('click', () => {
            modalOverlay.remove();
        });

        document.getElementById('btnModalConfirm').addEventListener('click', () => {
            modalOverlay.remove();
            onConfirm();
        });
    }

    // Helper: Toast Notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '2rem';
        toast.style.right = '2rem';
        toast.style.padding = '1rem 1.5rem';
        toast.style.borderRadius = '8px';
        toast.style.color = 'white';
        toast.style.fontWeight = '500';
        toast.style.zIndex = '10000';
        toast.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '0.5rem';
        toast.style.animation = 'slideInRight 0.3s ease-out';


        if (type === 'success') {
            toast.style.background = '#10B981';
            toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        } else {
            toast.style.background = '#EF4444';
            toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }

        document.body.appendChild(toast);

        // Add Keyframes for animation if not exists
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.innerHTML = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }


    // 5. Search Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allEnrollments.filter(item =>
                item.first_name.toLowerCase().includes(term) ||
                item.last_name.toLowerCase().includes(term) ||
                item.email.toLowerCase().includes(term) ||
                item.course_title.toLowerCase().includes(term)
            );
            renderGroups(filtered);
        });
    }
});
