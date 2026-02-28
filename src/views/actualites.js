import ActualiteService from '../services/actualiteService.js';
import { resolveAssetPath } from '../services/api.js';

let currentSlide = 0;
let newsData = [];

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
});

function renderCarousel(news) {
    const inner = document.getElementById('newsCarouselInner');
    const dotsContainer = document.getElementById('newsDots');

    // Slides
    let slidesHtml = news.map(item => createSlide(item)).join('');

    // Add clones for seamless loop (optional but recommended)
    if (news.length > 1) {
        slidesHtml += createSlide(news[0]); // Clone first slide at the end
    }

    inner.innerHTML = slidesHtml;

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

    return `
        <div class="news-slide" onclick="location.href='actualite-detail.html?id=${item.id}'">
            ${mediaHtml}
            <div class="news-slide-overlay"></div>
            <div class="news-slide-content container">
                <span class="news-tag">Événement</span>
                <h2 class="news-title">${item.title}</h2>
                <p class="news-desc">${item.description || 'Découvrez cette actualité en exclusivité sur ENSPY Training.'}</p>
                <a href="actualite-detail.html?id=${item.id}" class="news-play-btn">
                    <i class="fas fa-play"></i> REGARDER LA VIDÉO
                </a>
            </div>
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
