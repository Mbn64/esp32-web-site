// static/js/pages/add-device.js
class AddDevicePage {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupNameCounter();
        this.setupNameSuggestions();
        this.setupFormSubmission();
        this.setupAnimations();
        this.checkDeviceLimit();
    }

    setupFormValidation() {
        const form = document.getElementById('add-device-form');
        const nameInput = document.getElementById('id_name');

        // Real-time validation
        nameInput.addEventListener('input', () => {
            this.validateName(nameInput);
        });

        nameInput.addEventListener('blur', () => {
            this.validateName(nameInput);
        });

        // Form submission validation
        form.addEventListener('submit', (e) => {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    }

    validateName(input) {
        const value = input.value.trim();
        const minLength = 3;
        const maxLength = 100;
        
        // Clear previous validation
        input.classList.remove('is-valid', 'is-invalid');
        
        if (value.length === 0) {
            this.showFieldError(input, 'نام دستگاه الزامی است');
            return false;
        }
        
        if (value.length < minLength) {
            this.showFieldError(input, `نام دستگاه باید حداقل ${minLength} کاراکتر باشد`);
            return false;
        }
        
        if (value.length > maxLength) {
            this.showFieldError(input, `نام دستگاه نمی‌تواند بیش از ${maxLength} کاراکتر باشد`);
            return false;
        }

        // Check for invalid characters
        const invalidChars = /[<>\"'&]/;
        if (invalidChars.test(value)) {
            this.showFieldError(input, 'نام دستگاه شامل کاراکترهای غیرمجاز است');
            return false;
        }

        // Check for only numbers
        if (/^\d+$/.test(value)) {
            this.showFieldError(input, 'نام دستگاه نمی‌تواند فقط شامل عدد باشد');
            return false;
        }

        this.showFieldSuccess(input, 'نام دستگاه مناسب است ✅');
        return true;
    }

    showFieldError(input, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        
        let feedback = input.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            input.parentNode.appendChild(feedback);
        }
        
        feedback.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i>${message}`;
    }

    showFieldSuccess(input, message) {
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
        
        let feedback = input.parentNode.querySelector('.valid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'valid-feedback';
            input.parentNode.appendChild(feedback);
        }
        
        feedback.innerHTML = `<i class="fas fa-check me-1"></i>${message}`;
    }

    setupNameCounter() {
        const nameInput = document.getElementById('id_name');
        const counter = document.getElementById('name-count');
        const maxLength = 100;

        const updateCounter = () => {
            const currentLength = nameInput.value.length;
            counter.textContent = currentLength;
            
            const percentage = (currentLength / maxLength) * 100;
            const counterElement = counter.parentElement;
            
            counterElement.classList.remove('text-success', 'text-warning', 'text-danger');
            
            if (percentage <= 60) {
                counterElement.classList.add('text-success');
            } else if (percentage <= 85) {
                counterElement.classList.add('text-warning');
            } else {
                counterElement.classList.add('text-danger');
            }
        };

        nameInput.addEventListener('input', updateCounter);
        updateCounter(); // Initial count
    }

    setupNameSuggestions() {
        const nameInput = document.getElementById('id_name');
        let suggestionsContainer;

        const suggestions = [
            'سنسور دما اتاق',
            'کنترلر LED باغ',
            'مانیتور رطوبت گلخانه',
            'سنسور حرکت ورودی',
            'کنترلر آبیاری خودکار',
            'سنسور دود آشپزخانه',
            'مانیتور کیفیت هوا',
            'کنترلر برق خانه هوشمند',
            'سنسور فشار آب',
            'مانیتور انرژی خورشیدی'
        ];

        nameInput.addEventListener('focus', () => {
            if (nameInput.value.trim() === '') {
                this.showSuggestions(nameInput, suggestions);
            }
        });

        nameInput.addEventListener('input', () => {
            const value = nameInput.value.trim().toLowerCase();
            if (value.length >= 2) {
                const filteredSuggestions = suggestions.filter(s => 
                    s.toLowerCase().includes(value)
                );
                if (filteredSuggestions.length > 0) {
                    this.showSuggestions(nameInput, filteredSuggestions);
                } else {
                    this.hideSuggestions();
                }
            } else {
                this.hideSuggestions();
            }
        });

        document.addEventListener('click', (e) => {
            if (!nameInput.contains(e.target) && !e.target.closest('.suggestions-container')) {
                this.hideSuggestions();
            }
        });
    }

    showSuggestions(input, suggestions) {
        this.hideSuggestions();

        const container = document.createElement('div');
        container.className = 'suggestions-container';
        
        suggestions.slice(0, 5).forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            
            item.addEventListener('click', () => {
                input.value = suggestion;
                input.dispatchEvent(new Event('input'));
                this.hideSuggestions();
                input.focus();
            });
            
            container.appendChild(item);
        });

        input.parentNode.appendChild(container);
    }

    hideSuggestions() {
        const existing = document.querySelector('.suggestions-container');
        if (existing) {
            existing.remove();
        }
    }

    setupFormSubmission() {
        const form = document.getElementById('add-device-form');
        const submitBtn = form.querySelector('.submit-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            // Show loading state
            this.setButtonLoading(submitBtn, true);

            try {
                const formData = new FormData(form);
                const response = await fetch(form.action || window.location.pathname, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': this.getCsrfToken()
                    }
                });

                if (response.ok) {
                    // Check if response is JSON (AJAX) or HTML (redirect)
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        
                        if (data.success) {
                            this.showSuccessModal();
                        } else {
                            this.showError(data.message || 'خطا در ثبت درخواست');
                        }
                    } else {
                        // Handle HTML response (likely a redirect)
                        this.showSuccessModal();
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    this.showError(errorData.message || 'خطا در ارسال درخواست');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                this.showError('خطا در ارتباط با سرور');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        });
    }

    setButtonLoading(button, loading) {
        const textSpan = button.querySelector('.btn-text');
        const loadingSpan = button.querySelector('.btn-loading');

        if (loading) {
            button.disabled = true;
            textSpan.style.display = 'none';
            loadingSpan.style.display = 'inline-flex';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            textSpan.style.display = 'inline-flex';
            loadingSpan.style.display = 'none';
            button.classList.remove('loading');
        }
    }

    showSuccessModal() {
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
        
        // Add confetti effect
        this.showConfetti();
    }

    showConfetti() {
        // Simple confetti effect
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = this.getRandomColor();
            confettiContainer.appendChild(confetti);
        }

        // Remove confetti after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showError(message) {
        if (window.App && window.App.showToast) {
            window.App.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    setupAnimations() {
        // Animate form elements on load
        const animateElements = document.querySelectorAll('.form-card, .info-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 100);
                }
            });
        }, {
            threshold: 0.1
        });

        animateElements.forEach(el => {
            el.classList.add('animate-element');
            observer.observe(el);
        });

        // Floating icons animation
        this.createFloatingIcons();
    }

    createFloatingIcons() {
        const icons = ['fa-microchip', 'fa-wifi', 'fa-thermometer-half', 'fa-lightbulb', 'fa-cog'];
        const container = document.querySelector('.add-device-container');

        icons.forEach((icon, index) => {
            const floatingIcon = document.createElement('div');
            floatingIcon.className = 'floating-icon';
            floatingIcon.innerHTML = `<i class="fas ${icon}"></i>`;
            
            floatingIcon.style.left = Math.random() * 100 + '%';
            floatingIcon.style.animationDelay = index * 0.5 + 's';
            
            container.appendChild(floatingIcon);
        });
    }

    async checkDeviceLimit() {
        try {
            const response = await fetch('/api/device-count/', {
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.count >= data.limit) {
                    this.showDeviceLimitWarning(data.count, data.limit);
                } else if (data.count >= data.limit * 0.8) {
                    this.showDeviceLimitInfo(data.count, data.limit);
                }
            }
        } catch (error) {
            console.error('Error checking device limit:', error);
        }
    }

    showDeviceLimitWarning(current, limit) {
        const form = document.getElementById('add-device-form');
        const warning = document.createElement('div');
        warning.className = 'alert alert-warning limit-warning';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>هشدار:</strong> شما به حد مجاز دستگاه‌ها (${current}/${limit}) رسیده‌اید.
            برای افزودن دستگاه جدید، ابتدا یکی از دستگاه‌های موجود را حذف کنید.
        `;
        
        form.parentNode.insertBefore(warning, form);
        
        // Disable form
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <i class="fas fa-ban me-2"></i>
            حد مجاز تعداد دستگاه
        `;
    }

    showDeviceLimitInfo(current, limit) {
        const form = document.getElementById('add-device-form');
        const info = document.createElement('div');
        info.className = 'alert alert-info limit-info';
        info.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            شما ${current} از ${limit} دستگاه مجاز را استفاده کرده‌اید.
        `;
        
        form.parentNode.insertBefore(info, form);
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

// Global function for coming soon features
window.showComingSoon = function(feature) {
    if (window.App && window.App.showToast) {
        window.App.showToast(`${feature} به زودی در دسترس خواهد بود`, 'info');
    } else {
        alert(`${feature} به زودی در دسترس خواهد بود`);
    }
};

