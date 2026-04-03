import ActualiteService from '../services/actualiteService.js';
import { resolveAssetPath } from '../services/api.js';

let currentSlide = 0;
let newsData = [];
let adminMode = false;
let currentDeleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const inner = document.getElementById('newsCarouselInner');
    const loader = document.getElementById('loader');

    try {
        const response = await ActualiteService.getAll();
        newsData = response.data || response || [];

        if (loader) loader.style.display = 'none';

        if (newsData.length === 0) {
            inner.innerHTML = `
                <div style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; height: 100%; text-align: center; padding: 2rem;">
                    <i class="fas fa-newspaper" style="font-size: 4rem; color: var(--primary); margin-bottom: 1.5rem; opacity: 0.8;"></i>
                    <h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Pas d'actualités pour le moment</h2>
                    <p style="font-size: 1.2rem; color: rgba(255,255,255,0.7); max-width: 500px;">Restez connectés ! De nouvelles actualités et informations sur nos formations seront publiées très prochainement.</p>
                </div>
            `;
            const dots = document.getElementById('newsDots');
            if (dots) dots.style.display = 'none';
            return;
        }

        renderCarousel(newsData);

        // Force play all injected videos
        const videos = inner.querySelectorAll('video');
        videos.forEach(v => {
            v.play().catch(e => console.warn("Autoplay was prevented or failed:", e));
        });

        initCarouselEvents();

    } catch (error) {
        console.error('Error loading news:', error);
        if (loader) loader.style.display = 'none';
    }

    // Initialiser les événements du modal
    initDeleteModalEvents();
});

function renderCarousel(news) {
    const inner = document.getElementById('newsCarouselInner');
    const dotsContainer = document.getElementById('newsDots');

    // Slides
    let slidesHtml = news.map(item => createSlide(item)).join('');

    // Add clones for seamless loop
    if (news.length > 1) {
        slidesHtml += createSlide(news[0]); // Clone first slide at the end
    }

    inner.innerHTML = slidesHtml;

    // Ajouter les boutons de suppression si en mode admin
    if (adminMode) {
        addDeleteButtons();
    }

    // Dots
    if (news.length > 1) {
        dotsContainer.innerHTML = news.map((_, idx) => `
            <span class="news-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
        `).join('');
    }
}

function createSlide(item) {
    const banner = item.image_url ? resolveAssetPath(item.image_url) : 'public/images/banniere1.png';
    const videoUrl = item.video_url ? resolveAssetPath(item.video_url) : null;
    const embedUrl = item.video_url ? getEmbedUrl(item.video_url) : null;

    let mediaHtml = `<div class="slide-image" style="background-image: url('${banner}');"></div>`;

    if (embedUrl) {
        mediaHtml = `<iframe class="slide-video" src="${embedUrl}" style="border:none; pointer-events:none;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    } else if (videoUrl) {
        mediaHtml = `
            <video class="slide-video" autoplay muted loop playsinline poster="${banner}">
                <source src="${videoUrl}" type="video/mp4">
            </video>
        `;
    }

    const adminDeleteBtn = adminMode ? `
        <button class="delete-slide-btn" onclick="event.stopPropagation(); showDeleteModal('${item.id}', '${item.title.replace(/'/g, "\\'")}')">
            <i class="fas fa-trash"></i>
        </button>
    ` : '';

    return `
        <div class="news-slide" data-id="${item.id}" onclick="location.href='actualite-detail.html?id=${item.id}'">
            ${mediaHtml}
            <div class="news-slide-overlay"></div>
            <div class="news-slide-content container">
                <span class="news-tag">Événement</span>
                <h2 class="news-title">${item.title}</h2>
                <p class="news-desc">${item.description || 'Découvrez cette actualité en exclusivité sur ENSPY Training.'}</p>
                <a href="actualite-detail.html?id=${item.id}" class="news-play-btn" onclick="event.stopPropagation();">
                    <i class="fas fa-play"></i> REGARDER LA VIDÉO
                </a>
            </div>
            ${adminDeleteBtn}
        </div>
    `;
}

function initCarouselEvents() {
    const inner = document.getElementById('newsCarouselInner');
    const totalRealSlides = newsData.length;
    if (totalRealSlides <= 1) return;

    const dots = document.querySelectorAll('.news-dot');

    const showSlide = (n, bypassTransition = false) => {
        currentSlide = n;
        inner.style.transition = bypassTransition ? 'none' : 'transform 0.8s ease-in-out';
        inner.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === (currentSlide % totalRealSlides));
        });

        if (!bypassTransition) {
            inner.addEventListener('transitionend', function handler() {
                if (currentSlide === totalRealSlides) {
                    showSlide(0, true);
                }
                inner.removeEventListener('transitionend', handler);
            });
        }
    };

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            showSlide(idx);
        });
    });

    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 8000);
}

function getEmbedUrl(url) {
    if (!url) return null;
    // YouTube
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&loop=1&playlist=${match[1]}&rel=0&showinfo=0`;
    // Vimeo
    match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}?background=1&autoplay=1&muted=1&loop=1`;
    return null;
}

// Fonctions pour le mode admin
function toggleAdminMode() {
    adminMode = !adminMode;
    renderCarousel(newsData);
    
    const btn = document.querySelector('.btn-secondary');
    if (btn) {
        btn.innerHTML = adminMode ? 
            '<i class="fas fa-eye"></i> Quitter mode admin' : 
            '<i class="fas fa-cog"></i> Mode admin';
    }
}

function addDeleteButtons() {
    const style = document.createElement('style');
    style.textContent = `
        .delete-slide-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 10;
            background: rgba(255, 68, 68, 0.9);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            transition: all 0.3s;
            border: 2px solid white;
        }
        
        .delete-slide-btn:hover {
            background: #ff4444;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

// Fonctions pour le modal de suppression
function initDeleteModalEvents() {
    const input = document.getElementById('deleteValidationInput');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const message = document.getElementById('deleteValidationMessage');

    if (input) {
        input.addEventListener('input', function() {
            const isValid = this.value.toLowerCase() === 'supprimer';
            
            if (isValid) {
                confirmBtn.disabled = false;
                confirmBtn.classList.add('active');
                message.textContent = '✓ Vous pouvez maintenant supprimer';
                message.classList.add('success');
                this.classList.remove('error');
            } else {
                confirmBtn.disabled = true;
                confirmBtn.classList.remove('active');
                message.textContent = 'Veuillez saisir "supprimer" pour confirmer';
                message.classList.remove('success');
                
                if (this.value.length > 0) {
                    this.classList.add('error');
                } else {
                    this.classList.remove('error');
                }
            }
        });

        // Permettre la suppression avec Entrée
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                confirmDelete();
            }
        });
    }
}

// Fonction globale pour afficher le modal
window.showDeleteModal = function(id, title) {
    currentDeleteId = id;
    document.getElementById('deleteActualiteTitle').textContent = title;
    document.getElementById('deleteValidationInput').value = '';
    document.getElementById('deleteValidationInput').classList.remove('error');
    document.getElementById('confirmDeleteBtn').disabled = true;
    document.getElementById('confirmDeleteBtn').classList.remove('active');
    document.getElementById('deleteValidationMessage').textContent = 'Veuillez saisir "supprimer" pour confirmer';
    document.getElementById('deleteValidationMessage').classList.remove('success');
    document.getElementById('deleteModal').style.display = 'block';
}

// Fonction globale pour fermer le modal
window.closeDeleteModal = function() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteId = null;
}

// Fonction globale pour confirmer la suppression
window.confirmDelete = async function() {
    const input = document.getElementById('deleteValidationInput');
    
    if (input.value.toLowerCase() === 'supprimer' && currentDeleteId) {
        try {
            // Afficher un loader
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suppression...';
            confirmBtn.disabled = true;
            
            await ActualiteService.delete(currentDeleteId);
            
            // Fermer le modal
            closeDeleteModal();
            
            // Recharger les données
            const response = await ActualiteService.getAll();
            newsData = response.data || response || [];
            renderCarousel(newsData);
            
            // Message de succès (optionnel)
            alert('Actualité supprimée avec succès !');
            
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression. Veuillez réessayer.');
            
            // Restaurer le bouton
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Supprimer';
            confirmBtn.disabled = false;
        }
    }
}

// Fermer le modal si on clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        closeDeleteModal();
    }
}