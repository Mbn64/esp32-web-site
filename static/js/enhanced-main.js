// Enhanced Main JavaScript - Modern ES6+ Features
'use strict';

/**
 * Main Application Class
 */
class MBN13App {
    constructor() {
        // تنظیم پیش‌فرض امن برای config
        this.config = window.APP_CONFIG || {
            user: {
                isAuthenticated: false,
                username: null,
                email: null
            },
            csrfToken: null,
            debug: false,
            language: 'fa',
            timezone: 'Asia/Tehran'
        };
        
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
     * بررسی وضعیت احراز هویت کاربر
     */
    isUserAuthenticated() {
        return this.config && 
               this.config.user && 
               this.config.user.isAuthenticated === true;
    }
    
    /**
     * دریافت نام کاربری
     */
    getUsername() {
        return this.isUserAuthenticated() ? this.config.user.username : null;
    }
    
    /**
     * دریافت ایمیل کاربر
     */
    getUserEmail() {
        return this.isUserAuthenticated() ? this.config.user.email : null;
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
     * Initialize core modules - ویرایش شده
     */
    async initializeCore() {
        // Initialize API client
        this.api = new APIClient(this.config.csrfToken || null);
        
        // Initialize notification system
        this.notifications = new NotificationSystem();
        
        // Initialize storage manager
        this.storage = new StorageManager();
        
        // Initialize analytics - فقط برای کاربران احراز هویت شده
        if (this.isUserAuthenticated()) {
            this.analytics = new Analytics(this.getUsername());
        }
        
        // Initialize real-time connection - فقط برای کاربران احراز هویت شده
        if (this.isUserAuthenticated()) {
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
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
        
        // Handle online/offline events
        window.addEventListener('online', () => {
            this.emit('network:online');
            this.notifications.show('اتصال اینترنت برقرار شد', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.emit('network:offline');
            this.notifications.show('اتصال اینترنت قطع شد', 'warning');
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.emit('app:hidden');
            } else {
                this.emit('app:visible');
            }
        });
    }
    
    /**
     * Initialize theme
     */
    initializeTheme() {
        const savedTheme = this.storage.get('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }, 500);
        }
    }
    
    /**
     * Event emitter
     */
    emit(event, data = null) {
        this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
    
    /**
     * Event listener
     */
    on(event, handler) {
        this.eventEmitter.addEventListener(event, handler);
    }
    
    /**
     * Handle errors
     */
    handleError(error) {
        console.error('Application Error:', error);
        
        // Send to analytics if available
        if (this.analytics) {
            this.analytics.trackError(error);
        }
        
        // Show user-friendly message
        this.notifications.show('متأسفانه خطایی رخ داد. لطفاً صفحه را به‌روزرسانی کنید.', 'error');
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
    
    createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
        return container;
    }
    
    show(message, type = 'info', duration = this.defaultDuration) {
        const id = Date.now().toString();
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
        
        return id;
    }
    
    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `
            notification-item max-w-sm bg-white dark:bg-gray-800 border-l-4 p-4 shadow-lg rounded-lg
            transform translate-x-full transition-transform duration-300 ease-out
            ${this.getTypeClasses(type)}
        `;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${this.getIcon(type)}
                </div>
                <div class="mr-3">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                        ${message}
                    </p>
                </div>
                <div class="mr-auto pl-3">
                    <button class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" 
                            onclick="window.app.notifications.remove('${id}')">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 10);
        
        return notification;
    }
    
    getTypeClasses(type) {
        const classes = {
            'success': 'border-green-400',
            'error': 'border-red-400',
            'warning': 'border-yellow-400',
            'info': 'border-blue-400'
        };
        return classes[type] || classes.info;
    }
    
    getIcon(type) {
        const icons = {
            'success': '<i class="fas fa-check-circle text-green-400"></i>',
            'error': '<i class="fas fa-exclamation-circle text-red-400"></i>',
            'warning': '<i class="fas fa-exclamation-triangle text-yellow-400"></i>',
            'info': '<i class="fas fa-info-circle text-blue-400"></i>'
        };
        return icons[type] || icons.info;
    }
    
    remove(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
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
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    async post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', data });
    }
    
    async put(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PUT', data });
    }
    
    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
}

/**
 * Analytics Class
 */
class Analytics {
    constructor(username) {
        this.username = username;
        this.sessionId = this.generateSessionId();
        this.events = [];
        this.flushInterval = 30000; // 30 seconds
        
        this.startFlushTimer();
        this.trackPageView();
    }
    
    /**
     * Track page view
     */
    trackPageView() {
        this.track('page_view', {
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer
        });
    }
    
    /**
     * Track event
     */
    track(event, properties = {}) {
        this.events.push({
            event,
            properties: {
                ...properties,
                timestamp: Date.now(),
                session_id: this.sessionId,
                username: this.username,
                user_agent: navigator.userAgent,
                url: window.location.href
            }
        });
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
                    'X-CSRFToken': window.APP_CONFIG?.csrfToken || ''
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
            const wsUrl = `${protocol}//${window.location.host}/ws/updates/`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.emit('connected');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.emit(data.type, data.data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.stopHeartbeat();
                this.emit('disconnected');
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };
            
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    
    /**
     * Send message
     */
    send(type, data = null) {
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
        this.initialized = true;
    }
    
    destroy() {
        this.initialized = false;
    }
}

/**
 * Navigation Component
 */
class Navigation extends BaseComponent {
    async init() {
        await super.init();
        this.setupMobileMenu();
        this.setupDropdowns();
    }
    
    setupMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('show');
                menuToggle.classList.toggle('active');
            });
        }
    }
    
    setupDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (toggle && menu) {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    menu.classList.toggle('show');
                    toggle.classList.toggle('active');
                });
                
                // Close on outside click
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target)) {
                        menu.classList.remove('show');
                        toggle.classList.remove('active');
                    }
                });
            }
        });
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
    
    animateValue(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = Math.round(current);
            
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = end;
                clearInterval(timer);
            }
        }, 16);
    }
    
    startAutoRefresh() {
        this.timer = setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }
    
    setupRealtimeUpdates() {
        if (this.app.realtime) {
            this.app.realtime.on('device_update', (data) => {
                this.updateDeviceStatus(data);
            });
        }
    }
    
    destroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        super.destroy();
    }
}

// Stub classes for other components
class DeviceManager extends BaseComponent {}
class UserProfile extends BaseComponent {}
class Settings extends BaseComponent {}
class ModalManager extends BaseComponent {}
class FormManager extends BaseComponent {}
class ChartManager extends BaseComponent {}

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
     * Format date
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('fa-IR', { ...defaultOptions, ...options }).format(new Date(date));
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes, decimals = 2) {
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
