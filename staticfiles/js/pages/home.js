// static/js/pages/home.js
// 🔧 FIXED: Enhanced home page JavaScript with proper GSAP integration

class HomePage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initAnimations();
        this.setupIntersectionObserver();
        this.initParticleBackground();
        this.setupTypewriter();
        this.initCounters();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }

        // Service card interactions
        this.setupServiceCards();
        
        // CTA button effects
        this.setupCTAButtons();
        
        // Form validations
        this.setupFormValidations();
    }

    setupServiceCards() {
        const serviceCards = document.querySelectorAll('.service-card');
        
        serviceCards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                gsap.to(e.target, {
                    duration: 0.3,
                    scale: 1.05,
                    rotationY: 5,
                    z: 50,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener('mouseleave', (e) => {
                gsap.to(e.target, {
                    duration: 0.3,
                    scale: 1,
                    rotationY: 0,
                    z: 0,
                    ease: "power2.out"
                });
            });
        });
    }

    setupCTAButtons() {
        const ctaButtons = document.querySelectorAll('.cta-button, .btn-primary');
        
        ctaButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Add ripple effect
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    setupFormValidations() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateForm(form);
            });
        });
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            const value = input.value.trim();
            const type = input.type;
            
            // Remove previous error styles
            input.classList.remove('border-red-500');
            
            if (input.hasAttribute('required') && !value) {
                this.showFieldError(input, 'این فیلد الزامی است');
                isValid = false;
            } else if (type === 'email' && value && !this.isValidEmail(value)) {
                this.showFieldError(input, 'ایمیل معتبر وارد کنید');
                isValid = false;
            } else if (type === 'tel' && value && !this.isValidPhone(value)) {
                this.showFieldError(input, 'شماره تلفن معتبر وارد کنید');
                isValid = false;
            }
        });
        
        if (isValid) {
            this.submitForm(form);
        }
    }

    showFieldError(input, message) {
        input.classList.add('border-red-500');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^(\+98|0)?9\d{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    async submitForm(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>در حال ارسال...';
        
        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': window.APP_CONFIG.csrfToken
                }
            });
            
            if (response.ok) {
                window.utils.showNotification('پیام شما با موفقیت ارسال شد', 'success');
                form.reset();
            } else {
                throw new Error('خطا در ارسال پیام');
            }
        } catch (error) {
            window.utils.showNotification('خطا در ارسال پیام. لطفاً دوباره تلاش کنید', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    // 🔧 FIXED: Enhanced animations with proper error handling
    initAnimations() {
        // Check if GSAP and ScrollTrigger are loaded
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded, skipping animations');
            return;
        }
        
        if (typeof ScrollTrigger === 'undefined') {
            console.warn('ScrollTrigger not loaded, skipping scroll animations');
            return;
        }

        // Hero animations
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroButtons = document.querySelectorAll('.hero-button');
        
        if (heroTitle) {
            gsap.from(heroTitle, {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: "power3.out",
                delay: 0.5
            });
        }
        
        if (heroSubtitle) {
            gsap.from(heroSubtitle, {
                duration: 1,
                y: 30,
                opacity: 0,
                ease: "power3.out",
                delay: 0.8
            });
        }
        
        if (heroButtons.length > 0) {
            gsap.from(heroButtons, {
                duration: 0.8,
                y: 20,
                opacity: 0,
                stagger: 0.2,
                ease: "power3.out",
                delay: 1.1
            });
        }

        // Feature cards animation
        const featureCards = document.querySelectorAll('.feature-card');
        if (featureCards.length > 0) {
            gsap.from(featureCards, {
                duration: 0.8,
                y: 50,
                opacity: 0,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.features-section',
                    start: 'top 80%',
                    toggleActions: "play none none reverse"
                }
            });
        }

        // Statistics counter animation
        const statsNumbers = document.querySelectorAll('.stat-number');
        if (statsNumbers.length > 0) {
            statsNumbers.forEach(stat => {
                const finalValue = parseInt(stat.dataset.count) || 0;
                
                gsap.to(stat, {
                    duration: 2,
                    textContent: finalValue,
                    roundProps: "textContent",
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: stat,
                        start: 'top 80%',
                        toggleActions: "play none none reverse"
                    }
                });
            });
        }

        // Floating elements
        const floatingElements = document.querySelectorAll('.floating-element');
        if (floatingElements.length > 0) {
            floatingElements.forEach((element, index) => {
                gsap.to(element, {
                    duration: 3 + (index * 0.5),
                    y: -20,
                    rotation: 5,
                    repeat: -1,
                    yoyo: true,
                    ease: "power2.inOut",
                    delay: index * 0.2
                });
            });
        }

        // Parallax backgrounds
        const parallaxBgs = document.querySelectorAll('.parallax-bg');
        if (parallaxBgs.length > 0) {
            parallaxBgs.forEach(bg => {
                gsap.to(bg, {
                    yPercent: -50,
                    ease: "none",
                    scrollTrigger: {
                        trigger: bg,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            });
        }

        // Section reveal animations
        const sections = document.querySelectorAll('.reveal-section');
        if (sections.length > 0) {
            sections.forEach(section => {
                gsap.from(section, {
                    duration: 1,
                    y: 80,
                    opacity: 0,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        toggleActions: "play none none reverse"
                    }
                });
            });
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                } else {
                    entry.target.classList.remove('animate-in');
                }
            });
        }, observerOptions);

        // Observe all animatable elements
        const animatableElements = document.querySelectorAll('.animate-on-scroll');
        animatableElements.forEach(el => observer.observe(el));
    }

    initParticleBackground() {
        const particleContainer = document.querySelector('.particle-background');
        if (!particleContainer) return;

        // Create floating particles
        for (let i = 0; i < 50; i++) {
            this.createParticle(particleContainer);
        }

        // Animate particles
        this.animateParticles();
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            pointer-events: none;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;
        
        container.appendChild(particle);
        return particle;
    }

    animateParticles() {
        const particles = document.querySelectorAll('.particle');
        
        particles.forEach((particle, index) => {
            if (typeof gsap !== 'undefined') {
                gsap.to(particle, {
                    duration: Math.random() * 10 + 10,
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                    rotation: Math.random() * 360,
                    repeat: -1,
                    yoyo: true,
                    ease: "power1.inOut",
                    delay: index * 0.1
                });
            } else {
                // Fallback CSS animation
                particle.style.animation = `floatParticle ${Math.random() * 10 + 10}s infinite ease-in-out`;
                particle.style.animationDelay = `${index * 0.1}s`;
            }
        });

        // Add particle animation CSS if GSAP is not available
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

    setupTypewriter() {
        const typewriterElements = document.querySelectorAll('.typewriter');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            const speed = parseInt(element.dataset.speed) || 100;
            
            element.textContent = '';
            element.style.borderRight = '2px solid currentColor';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, speed);
                } else {
                    // Blinking cursor effect
                    setInterval(() => {
                        element.style.borderRight = element.style.borderRight === 'none' 
                            ? '2px solid currentColor' 
                            : 'none';
                    }, 500);
                }
            };
            
            // Start typewriter when element is in view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        typeWriter();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(element);
        });
    }

    initCounters() {
        const counters = document.querySelectorAll('.counter');
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target) || 0;
            const duration = parseInt(counter.dataset.duration) || 2000;
            const increment = target / (duration / 16); // 60fps
            
            let current = 0;
            counter.textContent = '0';
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const updateCounter = () => {
                            current += increment;
                            if (current < target) {
                                counter.textContent = Math.ceil(current).toLocaleString('fa-IR');
                                requestAnimationFrame(updateCounter);
                            } else {
                                counter.textContent = target.toLocaleString('fa-IR');
                            }
                        };
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(counter);
        });
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
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

// Enhanced scroll performance
let ticking = false;

function updateScrollElements() {
    // Update any scroll-dependent elements here
    const scrollY = window.scrollY;
    
    // Parallax elements
    const parallaxElements = document.querySelectorAll('.parallax-element');
    parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.speed) || 0.5;
        const yPos = -(scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
    
    ticking = false;
}

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(updateScrollElements);
        ticking = true;
    }
}

window.addEventListener('scroll', requestTick);

// Service worker registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for module usage
export default HomePage;
