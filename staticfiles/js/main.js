// static/js/main.js
class App {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.setupBackToTop();
        this.setupNavbar();
        this.setupFormValidation();
        this.setupTooltips();
        this.setupModals();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 MBN13 ESP32 Management System Loaded');
        });

        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showToast('خطایی رخ داده است', 'error');
        });

        // Handle network errors
        window.addEventListener('online', () => {
            this.showToast('اتصال اینترنت برقرار شد', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast('اتصال اینترنت قطع شده است', 'warning');
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                document.body.style.overflow = 'auto';
                
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }, 1000);
        }
    }

    setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    setupNavbar() {
        const navbar = document.querySelector('.navbar-custom');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    setupFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });

            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });

                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });
        });
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        let isValid = true;
        let message = '';

        // Required validation
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            message = 'این فیلد اجباری است';
        }

        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'آدرس ایمیل معتبر نیست';
            }
        }

        // Password validation
        if (type === 'password' && value) {
            if (value.length < 8) {
                isValid = false;
                message = 'رمز عبور باید حداقل 8 کاراکتر باشد';
            }
        }

        // Username validation
        if (input.name === 'username' && value) {
            const usernameRegex = /^[a-zA-Z0-9_]+$/;
            if (!usernameRegex.test(value) || value.length < 3) {
                isValid = false;
                message = 'نام کاربری باید شامل حروف، اعداد و _ باشد و حداقل 3 کاراکتر';
            }
        }

        this.setFieldValidation(input, isValid, message);
        return isValid;
    }

    setFieldValidation(input, isValid, message) {
        const formGroup = input.closest('.mb-3, .form-group');
        if (!formGroup) return;

        // Remove existing feedback
        const existingFeedback = formGroup.querySelector('.invalid-feedback, .valid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Remove existing classes
        input.classList.remove('is-valid', 'is-invalid');

        if (!isValid) {
            input.classList.add('is-invalid');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            formGroup.appendChild(feedback);
        } else if (input.value.trim()) {
            input.classList.add('is-valid');
        }
    }

    clearFieldError(input) {
        input.classList.remove('is-invalid');
        const formGroup = input.closest('.mb-3, .form-group');
        if (formGroup) {
            const feedback = formGroup.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        }
    }

    setupTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    setupModals() {
        // Auto-focus first input in modals
        document.addEventListener('shown.bs.modal', (e) => {
            const firstInput = e.target.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        });
    }

    // Utility Methods
    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = this.getToastContainer();
        const toast = this.createToast(message, type);
        
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        
        return toast;
    }

    getToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast-custom toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icons[type]} toast-icon"></i>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="app.removeToast(this.closest('.toast-custom'))">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return toast;
    }

    removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // API Helper
    async apiCall(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.APP_CONFIG.csrfToken
            },
            credentials: 'same-origin'
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error('API Error:', error);
            this.showToast('خطا در ارتباط با سرور', 'error');
            throw error;
        }
    }

    // Format utilities
    formatDate(date, format = 'YYYY/MM/DD') {
        if (!date) return '-';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Initialize app
const app = new App();

// Global utility functions
window.app = app;

// Expose common functions globally
window.showToast = (message, type, duration) => app.showToast(message, type, duration);
window.apiCall = (url, options) => app.apiCall(url, options);

