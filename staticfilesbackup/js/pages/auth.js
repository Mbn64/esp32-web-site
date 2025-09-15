// static/js/pages/auth.js
class AuthPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupParticles();
        this.setupFormValidation();
        this.setupPasswordToggle();
        this.setupUsernameCheck();
        this.setupPasswordStrength();
        this.setupFormSubmission();
        this.setupAnimations();
    }

    setupParticles() {
        const particlesContainer = document.querySelector('.auth-particles');
        if (!particlesContainer) return;

        // Create floating particles
        for (let i = 0; i < 20; i++) {
            this.createParticle(particlesContainer);
        }
    }

    createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 10 + 10}s ease-in-out infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        
        container.appendChild(particle);

        // Add keyframe animation dynamically
        if (!document.getElementById('particle-animation')) {
            const style = document.createElement('style');
            style.id = 'particle-animation';
            style.textContent = `
                @keyframes particleFloat {
                    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
                    25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
                    50% { transform: translateY(-40px) translateX(-5px); opacity: 0.4; }
                    75% { transform: translateY(-20px) translateX(-15px); opacity: 0.9; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupFormValidation() {
        const forms = document.querySelectorAll('.needs-validation');
        
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.showFormErrors(form);
                }
                
                form.classList.add('was-validated');
            });

            // Real-time validation
            const inputs = form.querySelectorAll('input[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    validateField(field) {
        const wrapper = field.closest('.input-wrapper');
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        
        if (field.checkValidity()) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (feedback) feedback.style.display = 'none';
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            if (feedback) {
                feedback.style.display = 'block';
                if (field.validationMessage) {
                    feedback.textContent = field.validationMessage;
                }
            }
        }
    }

    clearFieldError(field) {
        if (field.value.length > 0 && field.classList.contains('is-invalid')) {
            field.classList.remove('is-invalid');
            const feedback = field.parentNode.querySelector('.invalid-feedback');
            if (feedback) feedback.style.display = 'none';
        }
    }

    showFormErrors(form) {
        const invalidFields = form.querySelectorAll(':invalid');
        if (invalidFields.length > 0) {
            invalidFields[0].focus();
            this.showToast('لطفاً فیلدهای مشخص شده را تصحیح کنید', 'error');
        }
    }

    setupPasswordToggle() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.password-toggle')) {
                e.preventDefault();
                const button = e.target.closest('.password-toggle');
                const input = button.parentNode.querySelector('input');
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            }
        });
    }

    setupUsernameCheck() {
        const usernameInput = document.getElementById('id_username');
        if (!usernameInput) return;

        const statusElement = document.getElementById('username-status');
        const feedbackElement = document.getElementById('username-feedback');
        let checkTimeout;

        usernameInput.addEventListener('input', (e) => {
            clearTimeout(checkTimeout);
            const username = e.target.value.trim();

            if (username.length < 3) {
                this.updateUsernameStatus('', 'neutral');
                return;
            }

            this.updateUsernameStatus('در حال بررسی...', 'checking');

            checkTimeout = setTimeout(() => {
                this.checkUsernameAvailability(username);
            }, 500);
        });
    }

    async checkUsernameAvailability(username) {
        try {
            const response = await fetch(`/ajax/check-username/?username=${encodeURIComponent(username)}`);
            const data = await response.json();

            if (data.available) {
                this.updateUsernameStatus('✅ در دسترس', 'available');
                const input = document.getElementById('id_username');
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                this.updateUsernameStatus('❌ در دسترس نیست', 'unavailable');
                const input = document.getElementById('id_username');
                const feedback = document.getElementById('username-feedback');
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
                if (feedback) {
                    feedback.textContent = data.message;
                    feedback.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error checking username:', error);
            this.updateUsernameStatus('خطا در بررسی', 'error');
        }
    }

    updateUsernameStatus(message, type) {
        const statusElement = document.getElementById('username-status');
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = `input-status ${type}`;
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('id_password1');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;

        const strength = this.calculatePasswordStrength(password);
        
        // Remove all strength classes
        strengthBar.classList.remove('weak', 'fair', 'good', 'strong');
        
        if (password.length === 0) {
            strengthBar.style.width = '0%';
            strengthText.textContent = 'قدرت رمز عبور';
            return;
        }

        switch (strength.level) {
            case 1:
                strengthBar.classList.add('weak');
                strengthText.textContent = 'ضعیف';
                break;
            case 2:
                strengthBar.classList.add('fair');
                strengthText.textContent = 'متوسط';
                break;
            case 3:
                strengthBar.classList.add('good');
                strengthText.textContent = 'خوب';
                break;
            case 4:
                strengthBar.classList.add('strong');
                strengthText.textContent = 'قوی';
                break;
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let level = 1;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score >= 6) level = 4;
        else if (score >= 4) level = 3;
        else if (score >= 3) level = 2;
        else level = 1;

        return { score, level };
    }

    setupFormSubmission() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('.submit-btn');
                if (submitBtn && form.checkValidity()) {
                    this.showButtonLoading(submitBtn);
                }
            });
        });
    }

    showButtonLoading(button) {
        button.classList.add('loading');
        button.disabled = true;

        // Reset after 10 seconds as fallback
        setTimeout(() => {
            button.classList.remove('loading');
            button.disabled = false;
        }, 10000);
    }

    setupAnimations() {
        // Animate form elements on load
        const animateElements = document.querySelectorAll('.auth-form .form-group');
        
        animateElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Animate visual elements
        this.animateVisualElements();
    }

    animateVisualElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        const elements = document.querySelectorAll('.feature-item, .benefit-item, .stat-item');
        elements.forEach(el => observer.observe(el));
    }

    showToast(message, type = 'info') {
        if (window.App && window.App.showToast) {
            window.App.showToast(message, type);
        } else {
            // Fallback
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Global password toggle function
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentNode.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
};

// Global signup validation setup
window.setupSignupValidation = function() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    // Terms checkbox validation
    const termsCheckbox = document.getElementById('terms');
    const submitButton = form.querySelector('.submit-btn');

    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                this.classList.remove('is-invalid');
                const feedback = this.parentNode.querySelector('.invalid-feedback');
                if (feedback) feedback.style.display = 'none';
            }
        });
    }

    // Password confirmation validation
    const password1 = document.getElementById('id_password1');
    const password2 = document.getElementById('id_password2');

    if (password1 && password2) {
        password2.addEventListener('input', function() {
            if (password1.value !== this.value) {
                this.setCustomValidity('رمزهای عبور مطابقت ندارند');
                this.classList.add('is-invalid');
            } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
                if (this.value.length > 0) {
                    this.classList.add('is-valid');
                }
            }
        });
    }
};

// Coming soon function for placeholder links
window.showComingSoon = function(feature) {
    if (window.App && window.App.showToast) {
        window.App.showToast(`${feature} به زودی در دسترس خواهد بود`, 'info');
    } else {
        alert(`${feature} به زودی در دسترس خواهد بود`);
    }
};

