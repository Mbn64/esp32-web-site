// Modern Enhanced JavaScript - static/js/modern.js

class ModernUI {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.initializeComponents();
    }

    init() {
        // Initialize theme
        this.initTheme();
        
        // Initialize loading screen
        this.initLoadingScreen();
        
        // Initialize scroll effects
        this.initScrollEffects();
        
        // Initialize animations
        this.initAnimations();
        
        // Initialize utilities
        this.initUtilities();
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme;
        
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
        
        // Trigger theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    }

    // Loading Screen
    initLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;

        // Show loading screen immediately
        loadingScreen.style.display = 'flex';

        // Hide loading screen when page is loaded
        const hideLoading = () => {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, Math.random() * 1000 + 500); // Random delay between 500ms and 1.5s
        };

        if (document.readyState === 'complete') {
            hideLoading();
        } else {
            window.addEventListener('load', hideLoading);
        }
    }

    // Scroll Effects
    initScrollEffects() {
        // Navbar blur effect
        const navbar = document.querySelector('.navbar-blur');
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                    navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                } else {
                    navbar.style.background = 'rgba(255, 255, 255, 0.8)';
                    navbar.style.boxShadow = 'none';
                }
            });
        }

        // Back to top button
        this.initBackToTop();

        // Parallax effects
        this.initParallax();
    }

    initBackToTop() {
        const backToTop = document.getElementById('backToTop');
        if (!backToTop) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.remove('opacity-0', 'invisible');
                backToTop.classList.add('opacity-100', 'visible');
            } else {
                backToTop.classList.add('opacity-0', 'invisible');
                backToTop.classList.remove('opacity-100', 'visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-bg');
        if (parallaxElements.length === 0) return;

        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 0.1;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        };

        // Throttle scroll events
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // Animations
    initAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        // Stagger animations for cards
        this.initStaggerAnimations();
    }

    initStaggerAnimations() {
        const cardGroups = document.querySelectorAll('.stagger-container');
        
        cardGroups.forEach(container => {
            const cards = container.querySelectorAll('.card-modern, .stagger-item');
            
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animate-fade-in');
                }, index * 100);
            });
        });
    }

    // Component Initialization
    initializeComponents() {
        this.initDropdowns();
        this.initModals();
        this.initTooltips();
        this.initTabs();
        this.initAccordions();
        this.initForms();
        this.initCharts();
    }

    // Dropdown functionality
    initDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (!trigger || !menu) return;

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(dropdown);
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    this.closeDropdown(dropdown);
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeDropdown(dropdown);
                }
            });
        });
    }

    toggleDropdown(dropdown) {
        const isActive = dropdown.classList.contains('active');
        
        // Close all other dropdowns
        document.querySelectorAll('.dropdown.active').forEach(dd => {
            dd.classList.remove('active');
        });

        if (!isActive) {
            dropdown.classList.add('active');
        }
    }

    closeDropdown(dropdown) {
        dropdown.classList.remove('active');
    }

    // Modal functionality
    initModals() {
        const modalTriggers = document.querySelectorAll('[data-modal-target]');
        const modalCloses = document.querySelectorAll('[data-modal-close]');
        
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = trigger.getAttribute('data-modal-target');
                this.openModal(targetId);
            });
        });

        modalCloses.forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const backdrop = document.querySelector('.modal-backdrop');
        
        if (!modal) return;

        // Create backdrop if it doesn't exist
        if (!backdrop) {
            const newBackdrop = document.createElement('div');
            newBackdrop.className = 'modal-backdrop';
            document.body.appendChild(newBackdrop);
        }

        document.body.style.overflow = 'hidden';
        backdrop.classList.add('show');
        modal.classList.add('show');
    }

    closeModal() {
        const backdrop = document.querySelector('.modal-backdrop');
        const modals = document.querySelectorAll('.modal.show');
        
        document.body.style.overflow = '';
        if (backdrop) backdrop.classList.remove('show');
        modals.forEach(modal => modal.classList.remove('show'));
    }

    // Tooltip functionality
    initTooltips() {
        const tooltips = document.querySelectorAll('.tooltip');
        
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('mouseenter', () => {
                this.showTooltip(tooltip);
            });

            tooltip.addEventListener('mouseleave', () => {
                this.hideTooltip(tooltip);
            });
        });
    }

    showTooltip(element) {
        // Tooltip implementation would go here
        // For now, relying on CSS :hover states
    }

    hideTooltip(element) {
        // Tooltip implementation would go here
    }

    // Tab functionality
    initTabs() {
        const tabGroups = document.querySelectorAll('.tab-group');
        
        tabGroups.forEach(group => {
            const tabs = group.querySelectorAll('.tab-button');
            const panels = group.querySelectorAll('.tab-panel');
            
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs and panels
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding panel
                    tab.classList.add('active');
                    if (panels[index]) {
                        panels[index].classList.add('active');
                    }
                });
            });
        });
    }

    // Accordion functionality
    initAccordions() {
        const accordions = document.querySelectorAll('.accordion');
        
        accordions.forEach(accordion => {
            const triggers = accordion.querySelectorAll('.accordion-trigger');
            
            triggers.forEach(trigger => {
                trigger.addEventListener('click', () => {
                    const content = trigger.nextElementSibling;
                    const isOpen = trigger.classList.contains('active');
                    
                    // Close all other accordion items
                    triggers.forEach(t => {
                        t.classList.remove('active');
                        if (t.nextElementSibling) {
                            t.nextElementSibling.style.maxHeight = null;
                        }
                    });
                    
                    // Toggle current item
                    if (!isOpen) {
                        trigger.classList.add('active');
                        content.style.maxHeight = content.scrollHeight + 'px';
                    }
                });
            });
        });
    }

    // Form enhancements
    initForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Add floating labels
            this.initFloatingLabels(form);
            
            // Add form validation
            this.initFormValidation(form);
            
            // Add loading states
            this.initFormLoading(form);
        });
    }

    initFloatingLabels(form) {
        const inputs = form.querySelectorAll('.form-input');
        
        inputs.forEach(input => {
            const wrapper = input.parentElement;
            if (!wrapper.classList.contains('form-group')) return;
            
            const label = wrapper.querySelector('.form-label');
            if (!label) return;
            
            // Add floating label functionality
            input.addEventListener('focus', () => {
                wrapper.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    wrapper.classList.remove('focused');
                }
            });
            
            // Check initial state
            if (input.value) {
                wrapper.classList.add('focused');
            }
        });
    }

    initFormValidation(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
        
        form.addEventListener('submit', (e) => {
            let isValid = true;
            
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        let isValid = true;
        let errorMessage = '';
        
        // Clear previous errors
        this.clearFieldError(field);
        
        // Required validation
        if (required && !value) {
            isValid = false;
            errorMessage = 'این فیلد الزامی است';
        }
        
        // Email validation
        else if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'فرمت ایمیل صحیح نیست';
            }
        }
        
        // Phone validation
        else if (field.name === 'phone' && value) {
            const phoneRegex = /^09\d{9}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'شماره موبایل صحیح نیست';
            }
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }
        
        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-red-500 text-sm mt-1';
        errorElement.textContent = message;
        
        field.parentElement.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    initFormLoading(form) {
        form.addEventListener('submit', () => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                this.setButtonLoading(submitBtn, true);
            }
        });
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = `
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                در حال پردازش...
            `;
        } else {
            button.disabled = false;
            // Restore original button text
            button.innerHTML = button.getAttribute('data-original-text') || 'ارسال';
        }
    }

    // Chart initialization
    initCharts() {
        const chartElements = document.querySelectorAll('[data-chart]');
        
        chartElements.forEach(element => {
            const chartType = element.getAttribute('data-chart');
            const chartData = JSON.parse(element.getAttribute('data-chart-data') || '{}');
            
            switch (chartType) {
                case 'line':
                    this.createLineChart(element, chartData);
                    break;
                case 'bar':
                    this.createBarChart(element, chartData);
                    break;
                case 'doughnut':
                    this.createDoughnutChart(element, chartData);
                    break;
                default:
                    console.warn(`Unknown chart type: ${chartType}`);
            }
        });
    }

    createLineChart(element, data) {
        // Simple line chart implementation
        // In a real application, you'd use a charting library like Chart.js or D3.js
        element.innerHTML = '<div class="chart-placeholder">Line Chart Placeholder</div>';
    }

    createBarChart(element, data) {
        element.innerHTML = '<div class="chart-placeholder">Bar Chart Placeholder</div>';
    }

    createDoughnutChart(element, data) {
        element.innerHTML = '<div class="chart-placeholder">Doughnut Chart Placeholder</div>';
    }

    // Utility functions
    initUtilities() {
        // Global utilities
        window.ModernUI = this;
        
        // Notification system
        this.notifications = new NotificationSystem();
        
        // AJAX helpers
        this.initAjaxHelpers();
        
        // Keyboard shortcuts
        this.initKeyboardShortcuts();
        
        // Performance monitoring
        this.initPerformanceMonitoring();
    }

    initAjaxHelpers() {
        // Configure axios defaults
        if (window.axios) {
            axios.defaults.headers.common['X-CSRFToken'] = window.APP_CONFIG?.csrfToken;
            axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
            
            // Request interceptor
            axios.interceptors.request.use(config => {
                // Show loading indicator
                this.showGlobalLoading();
                return config;
            });
            
            // Response interceptor
            axios.interceptors.response.use(
                response => {
                    this.hideGlobalLoading();
                    return response;
                },
                error => {
                    this.hideGlobalLoading();
                    this.handleAjaxError(error);
                    return Promise.reject(error);
                }
            );
        }
    }

    showGlobalLoading() {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 z-50 transform scale-x-0 origin-left transition-transform duration-300';
            document.body.appendChild(loader);
        }
        
        setTimeout(() => {
            loader.style.transform = 'scaleX(1)';
        }, 10);
    }

    hideGlobalLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.transform = 'scaleX(0)';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        }
    }

    handleAjaxError(error) {
        let message = 'خطایی رخ داده است';
        
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    message = 'شما وارد سیستم نشده‌اید';
                    break;
                case 403:
                    message = 'شما اجازه دسترسی به این بخش را ندارید';
                    break;
                case 404:
                    message = 'صفحه یا منبع مورد نظر یافت نشد';
                    break;
                case 500:
                    message = 'خطای سرور رخ داده است';
                    break;
                default:
                    message = error.response.data?.message || message;
            }
        } else if (error.request) {
            message = 'مشکل در ارتباط با سرور';
        }
        
        this.notifications.show(message, 'error');
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openGlobalSearch();
            }
            
            // Escape to close modals/dropdowns
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }
            
            // Alt + T for theme toggle
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    openGlobalSearch() {
        const searchButton = document.querySelector('[data-search-trigger]');
        if (searchButton) {
            searchButton.click();
        }
    }

    closeAllOverlays() {
        // Close all modals
        this.closeModal();
        
        // Close all dropdowns
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
    }

    initPerformanceMonitoring() {
        // Performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Page Load Performance:', {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        totalTime: perfData.loadEventEnd - perfData.fetchStart
                    });
                }, 1000);
            });
        }
    }

    // Event listeners setup
    setupEventListeners() {
        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Online/offline detection
        window.addEventListener('online', () => {
            this.notifications.show('اتصال اینترنت برقرار شد', 'success');
        });

        window.addEventListener('offline', () => {
            this.notifications.show('اتصال اینترنت قطع شده است', 'warning');
        });

        // Visibility change (tab focus/blur)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
    }

    handleResize() {
        // Handle responsive changes
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile', isMobile);
        
        // Emit resize event for components
        window.dispatchEvent(new CustomEvent('responsiveChange', {
            detail: { isMobile }
        }));
    }

    onPageHidden() {
        // Pause animations, timers, etc.
        document.body.classList.add('page-hidden');
    }

    onPageVisible() {
        // Resume animations, timers, etc.
        document.body.classList.remove('page-hidden');
    }

    // Public API methods
    showNotification(message, type = 'info', duration = 5000) {
        return this.notifications.show(message, type, duration);
    }

    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(message, options);
            
            modal.querySelector('.confirm-yes').addEventListener('click', () => {
                resolve(true);
                this.closeModal();
            });
            
            modal.querySelector('.confirm-no').addEventListener('click', () => {
                resolve(false);
                this.closeModal();
            });
        });
    }

    createConfirmModal(message, options) {
        const modal = document.createElement('div');
        modal.className = 'modal confirm-modal';
        modal.innerHTML = `
            <div class="modal-content p-6 max-w-md">
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-question-circle text-yellow-500 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold mb-4">${options.title || 'تأیید'}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-center space-x-4 space-x-reverse">
                        <button class="confirm-yes btn-modern btn-primary">
                            ${options.confirmText || 'تأیید'}
                        </button>
                        <button class="confirm-no btn-modern btn-outline">
                            ${options.cancelText || 'انصراف'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.openModal(modal.id);
        
        return modal;
    }
}

// Notification System
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = new Map();
        this.idCounter = 0;
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-20 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const id = ++this.idCounter;
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }
        
        return id;
    }

    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} transform translate-x-full transition-all duration-300`;
        notification.setAttribute('data-notification-id', id);
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: 'border-green-500 bg-green-50',
            error: 'border-red-500 bg-red-50',
            warning: 'border-yellow-500 bg-yellow-50',
            info: 'border-blue-500 bg-blue-50'
        };
        
        notification.innerHTML = `
            <div class="flex items-center p-4 bg-white rounded-xl shadow-lg border-r-4 ${colors[type]} min-w-80 max-w-md">
                <div class="flex-shrink-0 ml-3">
                    <i class="fas ${icons[type]} text-${type === 'error' ? 'red' : type === 'warning' ? 'yellow' : type === 'success' ? 'green' : 'blue'}-500"></i>
                </div>
                <div class="flex-1">
                    <p class="text-gray-800 text-sm">${message}</p>
                </div>
                <button class="flex-shrink-0 mr-3 text-gray-400 hover:text-gray-600 transition-colors" onclick="window.ModernUI.notifications.dismiss(${id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return notification;
    }

    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.classList.remove('show');
        notification.classList.add('translate-x-full');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }

    clear() {
        this.notifications.forEach((notification, id) => {
            this.dismiss(id);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.modernUI = new ModernUI();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernUI;
}
