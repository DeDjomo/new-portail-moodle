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
                <div style="width: 100%; display: flex; align-items: center; justify-content: center; color: #fff; height: 100%;">
                    <p>Aucune actualité disponible pour le moment.</p>
                </div>
            `;
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

    return `
        <div class="news-slide" onclick="location.href='actualite-detail.html?id=${item.id}'">
            ${videoUrl ? `
                <video class="slide-video" autoplay muted loop playsinline poster="${banner}">
                    <source src="${videoUrl}" type="video/mp4">
                </video>
            ` : `
                <div class="slide-image" style="background-image: url('${banner}');"></div>
            `}
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
