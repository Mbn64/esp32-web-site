// static/js/pages/verify.js
class VerifyPage {
    constructor() {
        this.timeLeft = 15 * 60; // 15 minutes in seconds
        this.resendTimeLeft = 60; // 1 minute for resend
        this.timerInterval = null;
        this.resendInterval = null;
        this.init();
        window.verifyPageInstance = this;
    }

    init() {
        this.setupCodeInputs();
        this.startTimer();
        this.startResendTimer();
        this.setupForm();
        this.setupFloatingElements();
        this.focusFirstInput();
    }

    setupCodeInputs() {
        const digits = document.querySelectorAll('.code-digit');
        const hiddenInput = document.getElementById('id_code');

        digits.forEach((digit, index) => {
            digit.addEventListener('input', (e) => {
                this.handleDigitInput(e, index, digits, hiddenInput);
            });

            digit.addEventListener('keydown', (e) => {
                this.handleDigitKeydown(e, index, digits);
            });

            digit.addEventListener('paste', (e) => {
                this.handlePaste(e, digits, hiddenInput);
            });

            digit.addEventListener('focus', () => {
                digit.select();
            });
        });
    }

    handleDigitInput(event, index, digits, hiddenInput) {
        const input = event.target;
        let value = input.value.replace(/\D/g, ''); // Only digits
        
        if (value.length > 1) {
            value = value.slice(0, 1);
        }
        
        input.value = value;

        // Move to next input if current is filled
        if (value && index < digits.length - 1) {
            digits[index + 1].focus();
        }

        this.updateHiddenInput(digits, hiddenInput);
        this.validateCode();
    }

    handleDigitKeydown(event, index, digits) {
        const input = event.target;

        // Handle backspace
        if (event.key === 'Backspace' && !input.value && index > 0) {
            event.preventDefault();
            digits[index - 1].focus();
            digits[index - 1].value = '';
            this.updateHiddenInput(digits, document.getElementById('id_code'));
        }

        // Handle arrow keys
        if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            digits[index - 1].focus();
        }

        if (event.key === 'ArrowRight' && index < digits.length - 1) {
            event.preventDefault();
            digits[index + 1].focus();
        }

        // Handle number keys
        if (/^\d$/.test(event.key)) {
            event.preventDefault();
            input.value = event.key;
            if (index < digits.length - 1) {
                digits[index + 1].focus();
            }
            this.updateHiddenInput(digits, document.getElementById('id_code'));
            this.validateCode();
        }
    }

    handlePaste(event, digits, hiddenInput) {
        event.preventDefault();
        const pasteData = event.clipboardData.getData('text').replace(/\D/g, '');
        
        if (pasteData.length === 6) {
            for (let i = 0; i < 6; i++) {
                digits[i].value = pasteData[i] || '';
            }
            this.updateHiddenInput(digits, hiddenInput);
            this.validateCode();
            digits[5].focus();
        }
    }

    updateHiddenInput(digits, hiddenInput) {
        const code = Array.from(digits).map(digit => digit.value).join('');
        hiddenInput.value = code;
    }

    validateCode() {
        const digits = document.querySelectorAll('.code-digit');
        const code = Array.from(digits).map(digit => digit.value).join('');
        const submitBtn = document.querySelector('.verify-btn');
        
        if (code.length === 6) {
            submitBtn.disabled = false;
            digits.forEach(digit => {
                digit.classList.remove('is-invalid');
                digit.classList.add('is-valid');
            });
        } else {
            submitBtn.disabled = true;
            digits.forEach(digit => {
                digit.classList.remove('is-valid', 'is-invalid');
            });
        }
    }

    startTimer() {
        const timerElement = document.getElementById('timer');
        const resendBtn = document.getElementById('resend-btn');
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.expireCode();
            }
            
            // Change color when time is running out
            if (this.timeLeft <= 300) { // 5 minutes
                timerElement.style.color = '#f59e0b';
            }
            if (this.timeLeft <= 60) { // 1 minute
                timerElement.style.color = '#ef4444';
            }
        }, 1000);
    }

    startResendTimer() {
        const resendBtn = document.getElementById('resend-btn');
        const resendCountdown = resendBtn.querySelector('.resend-countdown');
        
        this.resendInterval = setInterval(() => {
            this.resendTimeLeft--;
            
            if (this.resendTimeLeft > 0) {
                resendCountdown.textContent = `(${this.resendTimeLeft}s)`;
            } else {
                clearInterval(this.resendInterval);
                resendBtn.disabled = false;
                resendCountdown.textContent = '';
            }
        }, 1000);
    }

    resetTimer() {
        // Reset main timer
        clearInterval(this.timerInterval);
        this.timeLeft = 15 * 60;
        this.startTimer();
        
        // Reset resend timer
        clearInterval(this.resendInterval);
        this.resendTimeLeft = 60;
        this.startResendTimer();
        
        // Clear code inputs
        const digits = document.querySelectorAll('.code-digit');
        digits.forEach(digit => {
            digit.value = '';
            digit.classList.remove('is-valid', 'is-invalid');
        });
        
        const hiddenInput = document.getElementById('id_code');
        hiddenInput.value = '';
        
        this.focusFirstInput();
    }

    expireCode() {
        const digits = document.querySelectorAll('.code-digit');
        const submitBtn = document.querySelector('.verify-btn');
        
        digits.forEach(digit => {
            digit.disabled = true;
            digit.classList.add('expired');
        });
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-times me-2"></i>کد منقضی شده';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-danger');
        
        if (window.App && window.App.showToast) {
            window.App.showToast('کد تایید منقضی شده. لطفاً کد جدید درخواست کنید', 'warning');
        }
    }

    setupForm() {
        const form = document.getElementById('verify-form');
        const submitBtn = document.querySelector('.verify-btn');
        
        form.addEventListener('submit', (e) => {
            const code = document.getElementById('id_code').value;
            
            if (code.length !== 6) {
                e.preventDefault();
                this.showCodeError('کد باید 6 رقم باشد');
                return;
            }
            
            this.showButtonLoading(submitBtn);
        });
    }

    showCodeError(message) {
        const digits = document.querySelectorAll('.code-digit');
        const errorDiv = document.querySelector('.error-message') || this.createErrorDiv();
        
        digits.forEach(digit => {
            digit.classList.add('is-invalid');
        });
        
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
        errorDiv.style.display = 'block';
        
        // Shake animation
        const container = document.querySelector('.code-input-container');
        container.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
    }

    createErrorDiv() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        document.querySelector('.code-input-wrapper').appendChild(errorDiv);
        return errorDiv;
    }

    showButtonLoading(button) {
        button.classList.add('loading');
        button.disabled = true;
        
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
    }

    focusFirstInput() {
        setTimeout(() => {
            const firstDigit = document.getElementById('code-digit-1');
            if (firstDigit) {
                firstDigit.focus();
            }
        }, 100);
    }

    setupFloatingElements() {
        const container = document.querySelector('.floating-elements');
        if (!container) return;

        // Create floating verification icons
        const icons = ['fas fa-envelope', 'fas fa-shield-alt', 'fas fa-check', 'fas fa-key'];
        
        for (let i = 0; i < 8; i++) {
            const element = document.createElement('div');
            element.className = 'floating-element';
            element.innerHTML = `<i class="${icons[i % icons.length]}"></i>`;
            element.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                font-size: ${Math.random() * 20 + 15}px;
                opacity: ${Math.random() * 0.3 + 0.1};
                color: rgba(99, 102, 241, 0.6);
                animation: floatVerify ${Math.random() * 10 + 15}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            
            container.appendChild(element);
        }

        // Add animation styles
        if (!document.getElementById('verify-animations')) {
            const style = document.createElement('style');
            style.id = 'verify-animations';
            style.textContent = `
                @keyframes floatVerify {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-30px) rotate(90deg); }
                    50% { transform: translateY(-60px) rotate(180deg); }
                    75% { transform: translateY(-30px) rotate(270deg); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Auto-submit when all digits are filled
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('code-digit')) {
        const digits = document.querySelectorAll('.code-digit');
        const allFilled = Array.from(digits).every(digit => digit.value.length === 1);
        
        if (allFilled) {
            setTimeout(() => {
                const submitBtn = document.querySelector('.verify-btn');
                if (submitBtn && !submitBtn.disabled) {
                    // Optional: Auto-submit after all digits are filled
                    // submitBtn.click();
                }
            }, 500);
        }
    }
});

