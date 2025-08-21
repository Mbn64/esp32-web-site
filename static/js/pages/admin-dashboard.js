// static/js/pages/admin-dashboard.js
class AdminDashboard {
    constructor() {
        this.init();
        this.bindEvents();
        this.initializeComponents();
    }

    init() {
        // Initialize variables
        this.currentRejectDeviceId = null;
        this.refreshInterval = null;
        this.isLoading = false;
        
        // Cache DOM elements
        this.cacheElements();
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        console.log('Admin Dashboard initialized');
    }

    cacheElements() {
        // Modals
        this.rejectModal = document.getElementById('rejectModal');
        this.deviceDetailsModal = document.getElementById('deviceDetailsModal');
        this.systemSettingsModal = document.getElementById('systemSettingsModal');
        
        // Forms and inputs
        this.rejectionReasonInput = document.getElementById('rejection-reason');
        this.deviceNameSpan = document.getElementById('reject-device-name');
        this.deviceDetailsContent = document.getElementById('device-details-content');
        
        // Stats elements
        this.statsCards = document.querySelectorAll('.stat-card');
        this.onlineIndicators = document.querySelectorAll('.online-indicator');
        
        // Lists
        this.requestsList = document.querySelector('.requests-list');
        this.usersList = document.querySelector('.users-list');
        this.devicesList = document.querySelector('.devices-list');
    }

    bindEvents() {
        // Auto-refresh toggle
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Modal events
        if (this.rejectModal) {
            this.rejectModal.addEventListener('hidden.bs.modal', () => {
                this.resetRejectForm();
            });
        }

        // Settings form changes
        this.bindSettingsEvents();
    }

    bindSettingsEvents() {
        const settingsInputs = document.querySelectorAll('#systemSettingsModal input, #systemSettingsModal select');
        settingsInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.markSettingsAsChanged();
            });
        });
    }

    initializeComponents() {
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize charts if available
        this.initCharts();
        
        // Load real-time data
        this.loadDashboardData();
    }

    initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipElements.forEach(element => {
            new bootstrap.Tooltip(element);
        });
    }

    initCharts() {
        // Initialize any charts here
        if (typeof Chart !== 'undefined') {
            this.initStatsCharts();
        }
    }

    initStatsCharts() {
        // Device status chart
        const deviceStatusChart = document.getElementById('deviceStatusChart');
        if (deviceStatusChart) {
            this.createDeviceStatusChart(deviceStatusChart);
        }

        // User activity chart
        const userActivityChart = document.getElementById('userActivityChart');
        if (userActivityChart) {
            this.createUserActivityChart(userActivityChart);
        }
    }

    // Auto-refresh functionality
    startAutoRefresh() {
        if (this.refreshInterval) return;
        
        this.refreshInterval = setInterval(() => {
            this.refreshDashboardData();
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async refreshDashboardData() {
        try {
            const response = await this.makeRequest('/admin/api/dashboard-data/');
            if (response.success) {
                this.updateDashboardElements(response.data);
            }
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
    }

    updateDashboardElements(data) {
        // Update stats
        this.updateStats(data.stats);
        
        // Update online indicators
        this.updateOnlineStatus(data.online_devices);
        
        // Update pending requests badge
        this.updatePendingBadge(data.pending_count);
    }

    updateStats(stats) {
        const elements = {
            'total-users': stats.total_users,
            'total-devices': stats.total_devices,
            'pending-requests': stats.pending_requests,
            'online-devices': stats.online_devices
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, parseInt(element.textContent), value);
            }
        });
    }

    animateNumber(element, from, to) {
        const duration = 1000;
        const start = Date.now();
        const timer = setInterval(() => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const current = Math.round(from + (to - from) * progress);
            element.textContent = current;
            
            if (progress === 1) {
                clearInterval(timer);
            }
        }, 16);
    }

    updateOnlineStatus(onlineDevices) {
        this.onlineIndicators.forEach(indicator => {
            const countElement = indicator.querySelector('.indicator-text');
            if (countElement) {
                countElement.textContent = `${onlineDevices.length} آنلاین`;
            }
        });
    }

    updatePendingBadge(count) {
        const badges = document.querySelectorAll('.stat-badge');
        badges.forEach(badge => {
            if (badge.closest('.pending-stat')) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'block' : 'none';
            }
        });
    }

    // Device management methods
    async approveDevice(deviceId) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoadingState(`approve-btn-${deviceId}`);
            
            const response = await this.makeRequest(`/admin/approve/${deviceId}/`, {
                method: 'POST'
            });

            if (response.success) {
                this.showSuccess('درخواست با موفقیت تایید شد');
                await this.refreshRequestsList();
                this.updateStats(response.stats);
            } else {
                this.showError(response.message || 'خطا در تایید درخواست');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Approve device error:', error);
        } finally {
            this.isLoading = false;
            this.hideLoadingState(`approve-btn-${deviceId}`);
        }
    }

    showRejectModal(deviceId, deviceName) {
        this.currentRejectDeviceId = deviceId;
        
        if (this.deviceNameSpan) {
            this.deviceNameSpan.textContent = deviceName;
        }
        
        this.resetRejectForm();
        
        const modal = new bootstrap.Modal(this.rejectModal);
        modal.show();
    }

    async confirmReject() {
        const reason = this.rejectionReasonInput?.value.trim();
        
        if (!reason) {
            this.showError('لطفاً دلیل رد درخواست را وارد کنید');
            this.rejectionReasonInput?.focus();
            return;
        }

        if (reason.length < 10) {
            this.showError('دلیل رد درخواست باید حداقل 10 کاراکتر باشد');
            return;
        }

        try {
            this.isLoading = true;
            this.showLoadingInModal();
            
            const response = await this.makeRequest(`/admin/reject/${this.currentRejectDeviceId}/`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });

            if (response.success) {
                bootstrap.Modal.getInstance(this.rejectModal).hide();
                this.showSuccess('درخواست با موفقیت رد شد');
                await this.refreshRequestsList();
                this.updateStats(response.stats);
            } else {
                this.showError(response.message || 'خطا در رد درخواست');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Reject device error:', error);
        } finally {
            this.isLoading = false;
            this.hideLoadingInModal();
        }
    }

    resetRejectForm() {
        if (this.rejectionReasonInput) {
            this.rejectionReasonInput.value = '';
        }
        this.currentRejectDeviceId = null;
    }

    useTemplate(template) {
        if (this.rejectionReasonInput) {
            this.rejectionReasonInput.value = template;
            this.rejectionReasonInput.focus();
        }
    }

    async toggleDeviceStatus(deviceId) {
        try {
            const response = await this.makeRequest(`/admin/toggle-device/${deviceId}/`, {
                method: 'POST'
            });

            if (response.success) {
                this.showSuccess(`وضعیت دستگاه ${response.status === 'suspended' ? 'معلق' : 'فعال'} شد`);
                await this.refreshRequestsList();
            } else {
                this.showError(response.message || 'خطا در تغییر وضعیت');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Toggle device error:', error);
        }
    }

    async deleteDevice(deviceId, deviceName) {
        const confirmed = await this.showConfirmDialog(
            'حذف دستگاه',
            `آیا مطمئن هستید که می‌خواهید دستگاه "${deviceName}" را حذف کنید؟`,
            'حذف',
            'danger'
        );

        if (!confirmed) return;

        try {
            const response = await this.makeRequest(`/admin/delete-device/${deviceId}/`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showSuccess('دستگاه با موفقیت حذف شد');
                await this.refreshRequestsList();
                this.updateStats(response.stats);
            } else {
                this.showError(response.message || 'خطا در حذف دستگاه');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Delete device error:', error);
        }
    }

    async showDeviceDetails(deviceId) {
        try {
            this.showLoadingInModal('device-details-content');
            const modal = new bootstrap.Modal(this.deviceDetailsModal);
            modal.show();

            const response = await this.makeRequest(`/admin/device/${deviceId}/details/`);
            
            if (response.success) {
                this.deviceDetailsContent.innerHTML = response.html;
                this.initTooltips(); // Re-initialize tooltips for new content
            } else {
                this.deviceDetailsContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        خطا در بارگذاری اطلاعات: ${response.message}
                    </div>
                `;
            }
        } catch (error) {
            this.deviceDetailsContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    خطا در ارتباط با سرور
                </div>
            `;
            console.error('Show device details error:', error);
        }
    }

    // User management methods
    async showUserDetails(userId) {
        try {
            this.showLoadingInModal('user-details-content');
            
            const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
            modal.show();

            const response = await this.makeRequest(`/admin/user/${userId}/details/`);
            
            if (response.success) {
                document.getElementById('user-details-content').innerHTML = response.html;
                this.initTooltips();
            } else {
                document.getElementById('user-details-content').innerHTML = `
                    <div class="alert alert-danger">
                        خطا در بارگذاری اطلاعات کاربر
                    </div>
                `;
            }
        } catch (error) {
            console.error('Show user details error:', error);
        }
    }

    async banUser(userId, username) {
        const confirmed = await this.showConfirmDialog(
            'مسدود کردن کاربر',
            `آیا مطمئن هستید که می‌خواهید کاربر "${username}" را مسدود کنید؟`,
            'مسدود کردن',
            'danger'
        );

        if (!confirmed) return;

        try {
            const response = await this.makeRequest(`/admin/ban-user/${userId}/`, {
                method: 'POST'
            });

            if (response.success) {
                this.showSuccess('کاربر با موفقیت مسدود شد');
                await this.refreshUsersList();
            } else {
                this.showError(response.message || 'خطا در مسدود کردن کاربر');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Ban user error:', error);
        }
    }

    async unbanUser(userId, username) {
        try {
            const response = await this.makeRequest(`/admin/unban-user/${userId}/`, {
                method: 'POST'
            });

            if (response.success) {
                this.showSuccess('کاربر با موفقیت آزاد شد');
                await this.refreshUsersList();
            } else {
                this.showError(response.message || 'خطا در آزاد کردن کاربر');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Unban user error:', error);
        }
    }

    // System settings methods
    showSystemSettings() {
        const modal = new bootstrap.Modal(this.systemSettingsModal);
        modal.show();
    }

    async saveSystemSettings() {
        try {
            const formData = this.collectSettingsData();
            
            const response = await this.makeRequest('/admin/save-settings/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response.success) {
                this.showSuccess('تنظیمات با موفقیت ذخیره شد');
                bootstrap.Modal.getInstance(this.systemSettingsModal).hide();
                this.markSettingsAsSaved();
            } else {
                this.showError(response.message || 'خطا در ذخیره تنظیمات');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Save settings error:', error);
        }
    }

    collectSettingsData() {
        const settings = {};
        const inputs = this.systemSettingsModal.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            const key = input.id || input.name;
            if (key) {
                if (input.type === 'checkbox') {
                    settings[key] = input.checked;
                } else {
                    settings[key] = input.value;
                }
            }
        });
        
        return settings;
    }

    markSettingsAsChanged() {
        const saveButton = document.querySelector('#systemSettingsModal .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save me-2"></i>ذخیره تغییرات *';
            saveButton.classList.add('btn-warning');
            saveButton.classList.remove('btn-primary');
        }
    }

    markSettingsAsSaved() {
        const saveButton = document.querySelector('#systemSettingsModal .btn-warning');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-check me-2"></i>ذخیره شد';
            saveButton.classList.add('btn-success');
            saveButton.classList.remove('btn-warning');
            
            setTimeout(() => {
                saveButton.innerHTML = '<i class="fas fa-save me-2"></i>ذخیره تنظیمات';
                saveButton.classList.add('btn-primary');
                saveButton.classList.remove('btn-success');
            }, 2000);
        }
    }

    // Export functionality
    async exportUsers() {
        try {
            this.showInfo('در حال آماده‌سازی فایل خروجی...');
            
            const response = await this.makeRequest('/admin/export/users/', {
                method: 'GET'
            });

            if (response.success) {
                this.downloadFile(response.download_url, 'users-export.xlsx');
                this.showSuccess('فایل خروجی کاربران آماده شد');
            } else {
                this.showError('خطا در تولید فایل خروجی');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Export users error:', error);
        }
    }

    async exportDevices() {
        try {
            this.showInfo('در حال آماده‌سازی فایل خروجی...');
            
            const response = await this.makeRequest('/admin/export/devices/', {
                method: 'GET'
            });

            if (response.success) {
                this.downloadFile(response.download_url, 'devices-export.xlsx');
                this.showSuccess('فایل خروجی دستگاه‌ها آماده شد');
            } else {
                this.showError('خطا در تولید فایل خروجی');
            }
        } catch (error) {
            this.showError('خطا در ارتباط با سرور');
            console.error('Export devices error:', error);
        }
    }

    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Reports functionality
    async showReports() {
        try {
            window.location.href = '/admin/reports/';
        } catch (error) {
            this.showError('خطا در باز کردن صفحه گزارش‌ها');
        }
    }

    async showSystemMetrics() {
        try {
            window.location.href = '/admin/metrics/';
        } catch (error) {
            this.showError('خطا در باز کردن صفحه متریک‌ها');
        }
    }

    // Utility methods
    async loadDashboardData() {
        try {
            const response = await this.makeRequest('/admin/api/dashboard-data/');
            if (response.success) {
                this.updateDashboardElements(response.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async refreshRequestsList() {
        try {
            const response = await this.makeRequest('/admin/api/pending-requests/');
            if (response.success && this.requestsList) {
                this.requestsList.innerHTML = response.html;
                this.initTooltips();
            }
        } catch (error) {
            console.error('Failed to refresh requests:', error);
        }
    }

    async refreshUsersList() {
        try {
            const response = await this.makeRequest('/admin/api/users-list/');
            if (response.success && this.usersList) {
                this.usersList.innerHTML = response.html;
                this.initTooltips();
            }
        } catch (error) {
            console.error('Failed to refresh users:', error);
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + R - Refresh dashboard
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.refreshDashboardData();
            return;
        }

        // Esc - Close modals
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach(modal => {
                bootstrap.Modal.getInstance(modal)?.hide();
            });
        }
    }

    showLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = true;
            const originalText = element.innerHTML;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>در حال پردازش...';
        }
    }

    hideLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = false;
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.innerHTML = originalText;
                element.removeAttribute('data-original-text');
            }
        }
    }

    showLoadingInModal(contentId = null) {
        const content = contentId ? document.getElementById(contentId) : null;
        if (content) {
            content.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">در حال بارگذاری...</span>
                    </div>
                    <p class="mt-3 text-muted">در حال بارگذاری...</p>
                </div>
            `;
        }
    }

    hideLoadingInModal() {
        // Loading will be replaced by actual content
    }

    async makeRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken(),
            },
            credentials: 'same-origin'
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                     document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                     this.getCookie('csrftoken');
        return token;
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    showWarning(message) {
        this.showToast(message, 'warning');
    }

    showToast(message, type = 'info') {
        // Use global toast function if available
        if (window.App && window.App.showToast) {
            window.App.showToast(message, type);
            return;
        }

        // Fallback to simple alert
        alert(message);
    }

    async showConfirmDialog(title, message, confirmText = 'تأیید', type = 'primary') {
        // Use global confirm dialog if available
        if (window.App && window.App.showConfirmDialog) {
            return await window.App.showConfirmDialog(title, message, confirmText, type);
        }

        // Fallback to simple confirm
        return confirm(`${title}\n\n${message}`);
    }

    createDeviceStatusChart(canvas) {
        // Example device status chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['تایید شده', 'در انتظار', 'رد شده', 'معلق'],
                datasets: [{
                    data: [12, 3, 2, 1],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b', 
                        '#ef4444',
                        '#6b7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createUserActivityChart(canvas) {
        // Example user activity chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه', 'یکشنبه'],
                datasets: [{
                    label: 'کاربران فعال',
                    data: [12, 19, 3, 5, 2, 3, 9],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Cleanup method
    destroy() {
        this.stopAutoRefresh();
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        
        console.log('Admin Dashboard destroyed');
    }
}

// Global functions for backward compatibility
window.approveDevice = function(deviceId) {
    if (window.adminDashboard) {
        window.adminDashboard.approveDevice(deviceId);
    }
};

window.showRejectModal = function(deviceId, deviceName) {
    if (window.adminDashboard) {
        window.adminDashboard.showRejectModal(deviceId, deviceName);
    }
};

window.confirmReject = function() {
    if (window.adminDashboard) {
        window.adminDashboard.confirmReject();
    }
};

window.useTemplate = function(template) {
    if (window.adminDashboard) {
        window.adminDashboard.useTemplate(template);
    }
};

window.showDeviceDetails = function(deviceId) {
    if (window.adminDashboard) {
        window.adminDashboard.showDeviceDetails(deviceId);
    }
};

window.showUserDetails = function(userId) {
    if (window.adminDashboard) {
        window.adminDashboard.showUserDetails(userId);
    }
};

window.toggleDeviceStatus = function(deviceId) {
    if (window.adminDashboard) {
        window.adminDashboard.toggleDeviceStatus(deviceId);
    }
};

window.deleteDevice = function(deviceId, deviceName) {
    if (window.adminDashboard) {
        window.adminDashboard.deleteDevice(deviceId, deviceName);
    }
};

window.banUser = function(userId, username) {
    if (window.adminDashboard) {
        window.adminDashboard.banUser(userId, username);
    }
};

window.unbanUser = function(userId, username) {
    if (window.adminDashboard) {
        window.adminDashboard.unbanUser(userId, username);
    }
};

window.exportUsers = function() {
    if (window.adminDashboard) {
        window.adminDashboard.exportUsers();
    }
};

window.exportDevices = function() {
    if (window.adminDashboard) {
        window.adminDashboard.exportDevices();
    }
};

window.exportData = function() {
    if (window.adminDashboard) {
        window.adminDashboard.exportDevices();
    }
};

window.showSystemSettings = function() {
    if (window.adminDashboard) {
        window.adminDashboard.showSystemSettings();
    }
};

window.saveSystemSettings = function() {
    if (window.adminDashboard) {
        window.adminDashboard.saveSystemSettings();
    }
};

window.showReports = function() {
    if (window.adminDashboard) {
        window.adminDashboard.showReports();
    }
};

window.showSystemMetrics = function() {
    if (window.adminDashboard) {
        window.adminDashboard.showSystemMetrics();
    }
};

window.controlDevice = function(deviceId) {
    window.location.href = `/admin/device/${deviceId}/control/`;
};

window.showAllPendingRequests = function() {
    window.location.href = '/admin/devices/?status=pending';
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}

