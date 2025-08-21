// static/js/pages/dashboard.js
class DashboardPage {
    constructor() {
        this.init();
        window.dashboardInstance = this;
    }

    init() {
        this.setupFilters();
        this.setupStatusUpdates();
        this.setupAnimations();
        this.updateConnectionStatus();
        this.startStatusPolling();
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const deviceCards = document.querySelectorAll('.device-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const status = button.dataset.status;
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter devices
                this.filterDevices(status, deviceCards);
            });
        });
    }

    filterDevices(status, cards) {
        cards.forEach(card => {
            const cardStatus = card.dataset.status;
            
            if (status === 'all' || cardStatus === status) {
                card.style.display = 'block';
                card.classList.add('filter-show');
            } else {
                card.style.display = 'none';
                card.classList.remove('filter-show');
            }
        });

        // Update empty state
        this.updateEmptyState(status, cards);
    }

    updateEmptyState(activeFilter, cards) {
        const visibleCards = Array.from(cards).filter(card => 
            card.style.display !== 'none'
        );

        const devicesGrid = document.querySelector('.devices-grid');
        let emptyState = document.querySelector('.filter-empty-state');

        if (visibleCards.length === 0 && activeFilter !== 'all') {
            if (!emptyState) {
                emptyState = this.createFilterEmptyState(activeFilter);
                devicesGrid.parentNode.appendChild(emptyState);
            }
            devicesGrid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            devicesGrid.style.display = 'grid';
        }
    }

    createFilterEmptyState(filter) {
        const emptyState = document.createElement('div');
        emptyState.className = 'filter-empty-state empty-state';
        
        const filterNames = {
            'approved': 'تایید شده',
            'pending': 'در انتظار',
            'rejected': 'رد شده',
            'suspended': 'معلق'
        };

        emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-filter"></i>
            </div>
            <h3 class="empty-title">دستگاه ${filterNames[filter]}ای یافت نشد</h3>
            <p class="empty-description">
                در حال حاضر دستگاهی با وضعیت "${filterNames[filter]}" ندارید
            </p>
            <button class="btn btn-outline-primary" onclick="document.querySelector('[data-status=all]').click()">
                <i class="fas fa-list me-2"></i>
                مشاهده همه دستگاه‌ها
            </button>
        `;

        return emptyState;
    }

    setupStatusUpdates() {
        // Real-time status updates for approved devices
        const approvedDevices = document.querySelectorAll('.device-card[data-status="approved"]');
        
        approvedDevices.forEach(card => {
            const deviceId = this.extractDeviceId(card);
            if (deviceId) {
                this.setupDeviceStatusIndicator(card, deviceId);
            }
        });
    }

    extractDeviceId(card) {
        const deviceIdElement = card.querySelector('.device-id');
        if (deviceIdElement) {
            const fullId = deviceIdElement.textContent.replace('ID: ', '').replace('...', '');
            return fullId;
        }
        return null;
    }

    setupDeviceStatusIndicator(card, deviceId) {
        const statusElement = card.querySelector('.connection-status');
        if (!statusElement) return;

        // Add pulse animation for online devices
        if (statusElement.classList.contains('online')) {
            statusElement.classList.add('pulse-online');
        }
    }

    updateConnectionStatus() {
        const connectionStatuses = document.querySelectorAll('.connection-status');
        
        connectionStatuses.forEach(status => {
            const isOnline = status.classList.contains('online');
            
            if (isOnline) {
                status.classList.add('pulse-online');
            } else {
                status.classList.remove('pulse-online');
            }
        });
    }

    startStatusPolling() {
        // Poll device status every 30 seconds
        if (document.querySelectorAll('.device-card[data-status="approved"]').length > 0) {
            setInterval(() => {
                this.pollDeviceStatus();
            }, 30000);
        }
    }

    async pollDeviceStatus() {
        try {
            const response = await fetch('/api/device-status/', {
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateDeviceStatuses(data.devices);
            }
        } catch (error) {
            console.error('Error polling device status:', error);
        }
    }

    updateDeviceStatuses(devices) {
        devices.forEach(device => {
            const card = document.querySelector(`[data-device-id="${device.id}"]`);
            if (card) {
                const statusElement = card.querySelector('.connection-status');
                const isOnline = device.is_online;
                
                statusElement.classList.toggle('online', isOnline);
                statusElement.classList.toggle('offline', !isOnline);
                statusElement.classList.toggle('pulse-online', isOnline);
                
                const icon = statusElement.querySelector('i');
                const text = statusElement.childNodes[1];
                
                if (isOnline) {
                    text.textContent = ' آنلاین';
                } else {
                    const lastSeen = device.last_seen ? 
                        ` آفلاین (${this.formatTimeDiff(device.last_seen)} پیش)` : 
                        ' آفلاین';
                    text.textContent = lastSeen;
                }
            }
        });
    }

    formatTimeDiff(timestamp) {
        const now = new Date();
        const lastSeen = new Date(timestamp);
        const diffMs = now - lastSeen;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} روز`;
        if (diffHours > 0) return `${diffHours} ساعت`;
        if (diffMins > 0) return `${diffMins} دقیقه`;
        return 'چند لحظه';
    }

    setupAnimations() {
        // Animate stat cards on load
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 100}ms`;
            card.classList.add('animate-in');
        });

        // Animate device cards
        const deviceCards = document.querySelectorAll('.device-card');
        deviceCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 50}ms`;
            card.classList.add('slide-up');
        });

        // Intersection Observer for scroll animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
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

        const animateElements = document.querySelectorAll('.device-card, .stat-card');
        animateElements.forEach(el => observer.observe(el));
    }

    async showDeviceDetails(deviceId) {
        const modal = new bootstrap.Modal(document.getElementById('deviceDetailsModal'));
        const content = document.getElementById('deviceDetailsContent');
        
        content.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        `;
        
        modal.show();

        try {
            const response = await fetch(`/api/device-details/${deviceId}/`, {
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (response.ok) {
                const data = await response.json();
                content.innerHTML = this.renderDeviceDetails(data);
            } else {
                throw new Error('Failed to load device details');
            }
        } catch (error) {
            content.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    خطا در بارگذاری اطلاعات دستگاه
                </div>
            `;
        }
    }

    renderDeviceDetails(device) {
        return `
            <div class="device-details-content">
                <div class="row">
                    <div class="col-md-6">
                        <div class="detail-group">
                            <h6 class="detail-group-title">
                                <i class="fas fa-info-circle me-2"></i>
                                اطلاعات کلی
                            </h6>
                            <div class="detail-item">
                                <span class="detail-label">نام دستگاه:</span>
                                <span class="detail-value">${device.name}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">شناسه:</span>
                                <span class="detail-value font-monospace">${device.id}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">وضعیت:</span>
                                <span class="detail-value">
                                    <span class="status-badge ${this.getStatusClass(device.status)}">
                                        ${this.getStatusText(device.status)}
                                    </span>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">تاریخ ایجاد:</span>
                                <span class="detail-value">${device.created_at}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="detail-group">
                            <h6 class="detail-group-title">
                                <i class="fas fa-network-wired me-2"></i>
                                اتصال و عملکرد
                            </h6>
                            <div class="detail-item">
                                <span class="detail-label">وضعیت اتصال:</span>
                                <span class="detail-value">
                                    <span class="connection-status ${device.is_online ? 'online' : 'offline'}">
                                        <i class="fas fa-circle me-1"></i>
                                        ${device.is_online ? 'آنلاین' : 'آفلاین'}
                                    </span>
                                </span>
                            </div>
                            ${device.last_seen ? `
                                <div class="detail-item">
                                    <span class="detail-label">آخرین اتصال:</span>
                                    <span class="detail-value">${device.last_seen}</span>
                                </div>
                            ` : ''}
                            ${device.approved_at ? `
                                <div class="detail-item">
                                    <span class="detail-label">تاریخ تایید:</span>
                                    <span class="detail-value">${device.approved_at}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${device.status === 'approved' ? `
                    <div class="detail-group mt-4">
                        <h6 class="detail-group-title">
                            <i class="fas fa-key me-2"></i>
                            API اطلاعات
                        </h6>
                        <div class="api-info">
                            <div class="api-key-section">
                                <label class="form-label">API Key:</label>
                                <div class="input-group">
                                    <input type="text" 
                                           class="form-control font-monospace" 
                                           value="${device.api_key}" 
                                           readonly>
                                    <button class="btn btn-outline-secondary" 
                                            onclick="copyToClipboard('${device.api_key}')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="api-endpoints mt-3">
                                <label class="form-label">API Endpoints:</label>
                                <div class="endpoint-list">
                                    <div class="endpoint-item">
                                        <code>POST /api/device/${device.id}/data/</code>
                                        <span class="endpoint-desc">ارسال داده</span>
                                    </div>
                                    <div class="endpoint-item">
                                        <code>GET /api/device/${device.id}/status/</code>
                                        <span class="endpoint-desc">دریافت وضعیت</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${device.rejection_reason ? `
                    <div class="detail-group mt-4">
                        <h6 class="detail-group-title text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            دلیل رد درخواست
                        </h6>
                        <div class="alert alert-danger">
                            ${device.rejection_reason}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getStatusClass(status) {
        const classes = {
            'approved': 'success',
            'pending': 'warning',
            'rejected': 'danger',
            'suspended': 'secondary'
        };
        return classes[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'approved': 'تایید شده',
            'pending': 'در انتظار',
            'rejected': 'رد شده',
            'suspended': 'معلق'
        };
        return texts[status] || status;
    }

    async downloadConfig(deviceId) {
        try {
            const response = await fetch(`/api/device-config/${deviceId}/`, {
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `esp32_config_${deviceId.slice(0, 8)}.h`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                if (window.App && window.App.showToast) {
                    window.App.showToast('فایل کانفیگ دانلود شد', 'success');
                }
            } else {
                throw new Error('Failed to download config');
            }
        } catch (error) {
            console.error('Error downloading config:', error);
            if (window.App && window.App.showToast) {
                window.App.showToast('خطا در دانلود فایل کانفیگ', 'error');
            }
        }
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

// Global functions
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (window.App && window.App.showToast) {
            window.App.showToast('کپی شد', 'success');
        }
    }).catch(() => {
        if (window.App && window.App.showToast) {
            window.App.showToast('خطا در کپی کردن', 'error');
        }
    });
};

