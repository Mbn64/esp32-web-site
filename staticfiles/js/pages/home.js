// static/js/pages/home.js
class HomePage {
    constructor() {
        this.init();
    }

    init() {
        this.setupAnimations();
        this.setupCounters();
        this.setupScrollEffects();
        this.setupParticles();
    }

    setupAnimations() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements
        document.querySelectorAll('.feature-card, .stat-card, .cta-card').forEach(el => {
            observer.observe(el);
        });
    }

    setupCounters() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.dataset.target);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    setupScrollEffects() {
        let ticking = false;

        const updateScrollEffects = () => {
            const scrollY = window.pageYOffset;
            
            // Parallax effect for hero particles
            const heroParticles = document.querySelector('.hero-particles');
            if (heroParticles) {
                heroParticles.style.transform = `translateY(${scrollY * 0.5}px)`;
            }

            // Scale effect for hero content
            const heroContent = document.querySelector('.hero-content');
            if (heroContent && scrollY < window.innerHeight) {
                const scale = 1 - (scrollY / window.innerHeight) * 0.1;
                heroContent.style.transform = `scale(${Math.max(scale, 0.9)})`;
            }

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick);
    }

    setupParticles() {
        // Create floating particles
        const particleContainer = document.querySelector('.hero-particles');
        if (!particleContainer) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: floatParticle ${5 + Math.random() * 10}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            particleContainer.appendChild(particle);
        }

        // Add particle animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatParticle {
                0%, 100% { 
                    transform: translateY(0px) translateX(0px) scale(1);
                    opacity: 0.6;
                }
                25% { 
                    transform: translateY(-30px) translateX(10px) scale(1.2);
                    opacity: 1;
                }
                50% { 
                    transform: translateY(-60px) translateX(-10px) scale(0.8);
                    opacity: 0.8;
                }
                75% { 
                    transform: translateY(-30px) translateX(15px) scale(1.1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states to CTA buttons
document.querySelectorAll('.cta-section .btn, .hero-actions .btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (this.href && !this.href.includes('#')) {
            this.classList.add('loading');
            this.style.pointerEvents = 'none';
            
            // Remove loading state after navigation
            setTimeout(() => {
                this.classList.remove('loading');
                this.style.pointerEvents = 'auto';
            }, 3000);
        }
    });
});

