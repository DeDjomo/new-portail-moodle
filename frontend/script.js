/**
 * Frontend Interactivity for the Portal Landing Page
 */

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');

    // Add shadow and higher opacity to header on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(15, 20, 25, 0.95)';
            header.style.boxShadow = 'var(--shadow)';
        } else {
            header.style.backgroundColor = 'var(--glass)';
            header.style.boxShadow = 'none';
        }
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    console.log('ENSPY Portal Frontend Initialized');
});
