// Enhanced Main JavaScript - Modern ES6+ Features
'use strict';

/**
 * Main Application Class
 */
class MBN13App {
    constructor() {
        this.config = window.APP_CONFIG || {};
        this.initialized = false;
        this.components = new Map();
        this.eventEmitter = new EventTarget();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleError = this.handleError.bind(this);
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.init);
        } else {
            this.init();
        }
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing MBN13 App...');
            
            // Initialize core modules
            await this.initializeCore();
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalEvents();
            
            // Initialize theme
            this.initializeTheme();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            this.emit('app:initialized');
            
            console.log('✅ MBN13 App initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.handleError(error);
        }
    }
    
    /**
     * Initialize core modules
     */
    async initializeCore() {
        // Initialize API client
        this.api = new APIClient(this.config.csrfToken);
        
        // Initialize notification system
        this.notifications = new NotificationSystem();
        
        // Initialize storage manager
        this.storage = new StorageManager();
        
        // Initialize analytics
        if (this.config.user.isAuthenticated) {
            this.analytics = new Analytics(this.config.user.username);
        }
        
        // Initialize real-time connection
        if (this.config.user.isAuthenticated) {
            this.realtime = new RealtimeConnection();
            await this.realtime.connect();
        }
    }
    
    /**
     * Initialize components
     */
    async initializeComponents() {
        const componentClasses = {
            'navigation': Navigation,
            'dashboard': Dashboard,
            'deviceManager': DeviceManager,
            'userProfile': UserProfile,
            'settings': Settings,
            'modals': ModalManager,
            'forms': FormManager,
            'charts': ChartManager
        };
        
        for (const [name, ComponentClass] of Object.entries(componentClasses)) {
            try {
                const component = new ComponentClass(this);
                await component.init();
                this.components.set(name, component);
            } catch (error) {
                console.warn(`Failed to initialize ${name} component:`, error);
            }
        }
    }
    
    /**
     * Setup global event listeners
     */
    setupGlobalEvents() {
        // Handle unhandled errors
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handleError);
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.notifications.show('اتصال برقرار شد', 'success');
            this.emit('connection:online');
        });
        
        window.addEventListener('offline', () => {
            this.notifications.show('اتصال قطع شد', 'warning');
            this.emit('connection:offline');
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.emit('app:hidden');
            } else {
                this.emit('app:visible');
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Handle service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    }
    
    /**
     * Initialize theme system
     */
    initializeTheme() {
        const savedTheme = this.storage.get('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener((e) => {
                if (this.storage.get('theme') === 'auto') {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        const { ctrlKey, metaKey, altKey, key } = event;
        const cmdKey = ctrlKey || metaKey;
        
        // Ctrl/Cmd + K: Focus search
        if (cmdKey && key === 'k') {
            event.preventDefault();
            const searchInput = document.querySelector('[data-search]');
            if (searchInput) searchInput.focus();
        }
        
        // Ctrl/Cmd + /: Show shortcuts help
        if (cmdKey && key === '/') {
            event.preventDefault();
            this.showShortcutsHelp();
        }
        
        // Escape: Close modals
        if (key === 'Escape') {
            const modal = this.components.get('modals');
            if (modal) modal.closeAll();
        }
    }
    
    /**
     * Set theme
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.storage.set('theme', theme);
        this.emit('theme:changed', theme);
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }
    
    /**
     * Show shortcuts help
     */
    showShortcutsHelp() {
        const shortcuts = [
            { key: 'Ctrl + K', action: 'جستجو' },
            { key: 'Ctrl + /', action: 'نمایش کلیدهای میانبر' },
            { key: 'Escape', action: 'بستن مودال‌ها' }
        ];
        
        const modal = this.components.get('modals');
        if (modal) {
            modal.show('shortcuts', {
                title: 'کلیدهای میانبر',
                content: this.renderShortcuts(shortcuts)
            });
        }
    }
    
    /**
     * Render shortcuts HTML
     */
    renderShortcuts(shortcuts) {
        return `
            <div class="shortcuts-list">
                ${shortcuts.map(shortcut => `
                    <div class="shortcut-item">
                        <kbd>${shortcut.key}</kbd>
                        <span>${shortcut.action}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Event emitter methods
     */
    on(event, handler) {
        this.eventEmitter.addEventListener(event, handler);
    }
    
    off(event, handler) {
        this.eventEmitter.removeEventListener(event, handler);
    }
    
    emit(event, data = null) {
        this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
    
    /**
     * Error handler
     */
    handleError(error) {
        console.error('Application Error:', error);
        
        // Track error if analytics is available
        if (this.analytics) {
            this.analytics.trackError(error);
        }
        
        // Show user-friendly error message
        if (this.notifications) {
            this.notifications.show('خطایی رخ داده است. لطفاً صفحه را به‌روزرسانی کنید.', 'error');
        }
    }
}

/**
 * API Client Class
 */
class APIClient {
    constructor(csrfToken) {
        this.csrfToken = csrfToken;
        this.baseURL = '/api';
        this.timeout = 30000;
        this.retryAttempts = 3;
    }
    
    /**
     * Make HTTP request
     */
    async request(url, options = {}) {
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken,
                ...options.headers
            },
            credentials: 'same-origin',
            ...options
        };
        
        // Add request body for POST/PUT requests
        if (config.method !== 'GET' && options.data) {
            config.body = JSON.stringify(options.data);
        }
        
        const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        try {
            const response = await this.fetchWithTimeout(fullURL, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
            
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    /**
     * Fetch with timeout
     */
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    /**
     * Convenience methods
     */
    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', data });
    }
    
    put(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PUT', data });
    }
    
    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
}

/**
 * Notification System Class
 */
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = new Map();
        this.defaultDuration = 5000;
    }
    
    /**
     * Create notification container
     */
    createContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
        return container;
    }
    
    /**
     * Show notification
     */
    show(message, type = 'info', options = {}) {
        const id = this.generateId();
        const notification = this.createNotification(id, message, type, options);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto dismiss
        const duration = options.duration || this.defaultDuration;
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }
        
        return id;
    }
    
    /**
     * Create notification element
     */
    createNotification(id, message, type, options) {
        const notification = document.createElement('div');
        notification.className = `toast-modern toast-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-labelledby', `toast-${id}-title`);
        
        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">
                    ${options.title ? `<div class="toast-title" id="toast-${id}-title">${options.title}</div>` : ''}
                    <div class="toast-text">${message}</div>
                </div>
                <button type="button" class="toast-close" aria-label="بستن">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${options.actions ? this.renderActions(options.actions) : ''}
        `;
        
        // Add close handler
        const closeBtn = notification.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(id));
        
        return notification;
    }
    
    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-triangle"></i>',
            warning: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Render action buttons
     */
    renderActions(actions) {
        return `
            <div class="toast-actions">
                ${actions.map(action => `
                    <button type="button" class="btn-sm-modern" data-action="${action.key}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Dismiss notification
     */
    dismiss(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            notification.classList.add('hide');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }
    
    /**
     * Clear all notifications
     */
    clear() {
        this.notifications.forEach((_, id) => this.dismiss(id));
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Storage Manager Class
 */
class StorageManager {
    constructor() {
        this.prefix = 'mbn13_';
        this.storage = this.getAvailableStorage();
    }
    
    /**
     * Get available storage (localStorage with fallback)
     */
    getAvailableStorage() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return localStorage;
        } catch {
            // Fallback to memory storage
            return new Map();
        }
    }
    
    /**
     * Set item
     */
    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serializedValue = JSON.stringify({
                value,
                timestamp: Date.now(),
                version: '1.0'
            });
            
            if (this.storage instanceof Map) {
                this.storage.set(fullKey, serializedValue);
            } else {
                this.storage.setItem(fullKey, serializedValue);
            }
        } catch (error) {
            console.warn('Failed to save to storage:', error);
        }
    }
    
    /**
     * Get item
     */
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            let item;
            
            if (this.storage instanceof Map) {
                item = this.storage.get(fullKey);
            } else {
                item = this.storage.getItem(fullKey);
            }
            
            if (item) {
                const parsed = JSON.parse(item);
                return parsed.value;
            }
        } catch (error) {
            console.warn('Failed to read from storage:', error);
        }
        
        return defaultValue;
    }
    
    /**
     * Remove item
     */
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            
            if (this.storage instanceof Map) {
                this.storage.delete(fullKey);
            } else {
                this.storage.removeItem(fullKey);
            }
        } catch (error) {
            console.warn('Failed to remove from storage:', error);
        }
    }
    
    /**
     * Clear all items with prefix
     */
    clear() {
        try {
            if (this.storage instanceof Map) {
                for (const key of this.storage.keys()) {
                    if (key.startsWith(this.prefix)) {
                        this.storage.delete(key);
                    }
                }
            } else {
                for (let i = this.storage.length - 1; i >= 0; i--) {
                    const key = this.storage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        this.storage.removeItem(key);
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to clear storage:', error);
        }
    }
}

/**
 * Analytics Class
 */
class Analytics {
    constructor(userId) {
        this.userId = userId;
        this.sessionId = this.generateSessionId();
        this.events = [];
        this.flushInterval = 30000; // 30 seconds
        this.maxEvents = 50;
        
        this.startFlushTimer();
        this.trackPageView();
    }
    
    /**
     * Track page view
     */
    trackPageView() {
        this.track('page_view', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer
        });
    }
    
    /**
     * Track event
     */
    track(event, properties = {}) {
        const eventData = {
            event,
            properties: {
                ...properties,
                timestamp: Date.now(),
                session_id: this.sessionId,
                user_id: this.userId,
                url: window.location.href,
                user_agent: navigator.userAgent
            }
        };
        
        this.events.push(eventData);
        
        // Flush if we have too many events
        if (this.events.length >= this.maxEvents) {
            this.flush();
        }
    }
    
    /**
     * Track error
     */
    trackError(error) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            line: error.lineno,
            column: error.colno,
            filename: error.filename
        });
    }
    
    /**
     * Flush events to server
     */
    async flush() {
        if (this.events.length === 0) return;
        
        const eventsToSend = [...this.events];
        this.events = [];
        
        try {
            await fetch('/api/analytics/events/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.APP_CONFIG.csrfToken
                },
                body: JSON.stringify({ events: eventsToSend })
            });
        } catch (error) {
            console.warn('Failed to send analytics events:', error);
            // Add events back to queue
            this.events.unshift(...eventsToSend);
        }
    }
    
    /**
     * Start flush timer
     */
    startFlushTimer() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            if (navigator.sendBeacon) {
                const data = JSON.stringify({ events: this.events });
                navigator.sendBeacon('/api/analytics/events/', data);
            }
        });
    }
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Real-time Connection Class
 */
class RealtimeConnection {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = 30000;
        this.heartbeatTimer = null;
        this.eventHandlers = new Map();
    }
    
    /**
     * Connect to WebSocket
     */
    async connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/`;
            
            this.ws = new WebSocket(wsUrl);
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    
    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.emit('connected');
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        this.ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            this.stopHeartbeat();
            this.emit('disconnected');
            this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        };
    }
    
    /**
     * Handle incoming message
     */
    handleMessage(data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'device_status_update':
                this.emit('device:status', payload);
                break;
            case 'notification':
                this.emit('notification', payload);
                break;
            case 'system_alert':
                this.emit('alert', payload);
                break;
            default:
                this.emit(type, payload);
        }
    }
    
    /**
     * Send message
     */
    send(type, data = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }
    
    /**
     * Start heartbeat
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.send('heartbeat');
        }, this.heartbeatInterval);
    }
    
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    /**
     * Schedule reconnection
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        setTimeout(() => {
            console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
            this.connect();
        }, delay);
    }
    
    /**
     * Event system
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    emit(event, data = null) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Disconnect
     */
    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

/**
 * Base Component Class
 */
class BaseComponent {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        this.element = null;
    }
    
    async init() {
        if (this.initialized) return;
        
        await this.render();
        this.bindEvents();
        this.initialized = true;
    }
    
    async render() {
        // Override in subclasses
    }
    
    bindEvents() {
        // Override in subclasses
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.initialized = false;
    }
}

/**
 * Navigation Component
 */
class Navigation extends BaseComponent {
    async init() {
        await super.init();
        this.setupScrollEffect();
        this.setupMobileToggle();
    }
    
    setupScrollEffect() {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar-modern');
            if (!navbar) return;
            
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            // Auto-hide on scroll down
            if (window.scrollY > lastScrollY && window.scrollY > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollY = window.scrollY;
        });
    }
    
    setupMobileToggle() {
        const toggle = document.querySelector('.navbar-toggler');
        const menu = document.querySelector('.navbar-collapse');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('show');
                toggle.classList.toggle('active');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.remove('show');
                    toggle.classList.remove('active');
                }
            });
        }
    }
}

/**
 * Dashboard Component
 */
class Dashboard extends BaseComponent {
    constructor(app) {
        super(app);
        this.refreshInterval = 30000; // 30 seconds
        this.timer = null;
    }
    
    async init() {
        await super.init();
        
        if (this.isDashboardPage()) {
            await this.loadDashboardData();
            this.startAutoRefresh();
            this.setupRealtimeUpdates();
        }
    }
    
    isDashboardPage() {
        return window.location.pathname.includes('/dashboard/');
    }
    
    async loadDashboardData() {
        try {
            const data = await this.app.api.get('/dashboard-data/');
            this.updateDashboard(data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.app.notifications.show('خطا در بارگذاری داده‌ها', 'error');
        }
    }
    
    updateDashboard(data) {
        // Update statistics cards
        this.updateStatsCards(data.stats);
        
        // Update device list
        this.updateDeviceList(data.devices);
        
        // Update charts
        this.updateCharts(data.charts);
    }
    
    updateStatsCards(stats) {
        for (const [key, value] of Object.entries(stats)) {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                this.animateValue(element, parseInt(element.textContent), value);
            }
        }
    }
    
    updateDeviceList(devices) {
        const container = document.querySelector('[data-device-list]');
        if (!container) return;
        
        container.innerHTML = devices.map(device => this.renderDeviceCard(device)).join('');
    }
    
    renderDeviceCard(device) {
        const statusClass = device.is_online ? 'online' : 'offline';
        const statusText = device.is_online ? 'آنلاین' : 'آفلاین';
        
        return `
            <div class="device-card ${statusClass}" data-device-id="${device.id}">
                <div class="device-header">
                    <div class="device-info">
                        <h3>${device.name}</h3>
                        <p>${device.location || 'مکان نامشخص'}</p>
                    </div>
                    <div class="device-status">
                        <div class="status-dot ${statusClass}"></div>
                        <span class="badge-modern badge-${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="device-body">
                    <div class="device-metrics">
                        <div class="metric-item">
                            <span class="metric-value">${device.uptime || '0'}</span>
                            <span class="metric-label">آپ‌تایم</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${device.rssi || 'N/A'}</span>
                            <span class="metric-label">قدرت سیگنال</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    updateCharts(chartsData) {
        const chartManager = this.app.components.get('charts');
        if (chartManager) {
            chartManager.updateAll(chartsData);
        }
    }
    
    animateValue(element, start, end) {
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toLocaleString('fa-IR');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    startAutoRefresh() {
        this.timer = setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }
    
    setupRealtimeUpdates() {
        if (this.app.realtime) {
            this.app.realtime.on('device:status', (data) => {
                this.updateDeviceStatus(data);
            });
            
            this.app.realtime.on('notification', (data) => {
                this.app.notifications.show(data.message, data.type);
            });
        }
    }
    
    updateDeviceStatus(data) {
        const deviceCard = document.querySelector(`[data-device-id="${data.device_id}"]`);
        if (deviceCard) {
            const statusDot = deviceCard.querySelector('.status-dot');
            const statusBadge = deviceCard.querySelector('.badge-modern');
            
            const statusClass = data.is_online ? 'online' : 'offline';
            const statusText = data.is_online ? 'آنلاین' : 'آفلاین';
            
            // Update classes
            deviceCard.className = `device-card ${statusClass}`;
            statusDot.className = `status-dot ${statusClass}`;
            statusBadge.className = `badge-modern badge-${statusClass}`;
            statusBadge.textContent = statusText;
        }
    }
    
    destroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        super.destroy();
    }
}

/**
 * Form Manager Component
 */
class FormManager extends BaseComponent {
    async init() {
        await super.init();
        this.setupForms();
        this.setupValidation();
    }
    
    setupForms() {
        document.querySelectorAll('form[data-ajax]').forEach(form => {
            form.addEventListener('submit', this.handleAjaxSubmit.bind(this));
        });
        
        document.querySelectorAll('form[data-validate]').forEach(form => {
            this.setupFormValidation(form);
        });
    }
    
    async handleAjaxSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('[type="submit"]');
        
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'در حال ارسال...';
        }
        
        try {
            const response = await this.app.api.post(form.action, Object.fromEntries(formData));
            
            if (response.success) {
                this.app.notifications.show(response.message || 'عملیات با موفقیت انجام شد', 'success');
                
                // Redirect if specified
                if (response.redirect) {
                    window.location.href = response.redirect;
                }
            } else {
                this.showFormErrors(form, response.errors);
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.app.notifications.show('خطا در ارسال فرم', 'error');
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText || 'ارسال';
            }
        }
    }
    
    setupFormValidation(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const errors = [];
        
        // Required validation
        if (field.hasAttribute('required') && !value) {
            errors.push('این فیلد الزامی است');
        }
        
        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push('آدرس ایمیل معتبر نیست');
            }
        }
        
        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^09\d{9}$/;
            if (!phoneRegex.test(value)) {
                errors.push('شماره موبایل معتبر نیست');
            }
        }
        
        // Password validation
        if (field.type === 'password' && value) {
            if (value.length < 8) {
                errors.push('رمز عبور باید حداقل ۸ کاراکتر باشد');
            }
        }
        
        // Show errors
        if (errors.length > 0) {
            this.showFieldError(field, errors[0]);
            return false;
        } else {
            this.clearFieldError(field);
            return true;
        }
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.form-error-modern');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error-modern';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.form-error-modern');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    showFormErrors(form, errors) {
        for (const [fieldName, messages] of Object.entries(errors)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field && messages.length > 0) {
                this.showFieldError(field, messages[0]);
            }
        }
    }
}

/**
 * Utility Functions
 */
const utils = {
    /**
     * Debounce function
     */
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
    },
    
    /**
     * Throttle function
     */
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
        };
    },
    
    /**
     * Format bytes to human readable
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 بایت';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    /**
     * Format duration
     */
    formatDuration(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        const parts = [];
        if (days > 0) parts.push(`${days} روز`);
        if (hours > 0) parts.push(`${hours} ساعت`);
        if (minutes > 0) parts.push(`${minutes} دقیقه`);
        
        return parts.join(' و ') || 'کمتر از یک دقیقه';
    },
    
    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    }
};

// Initialize the application
window.app = new MBN13App();

// Export for use in other scripts
window.MBN13 = {
    app: window.app,
    utils,
    APIClient,
    NotificationSystem,
    StorageManager,
    Analytics,
    RealtimeConnection
};
