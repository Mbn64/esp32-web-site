# settings.py - Enhanced Version
from decouple import config
from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ========================================
# 🔐 SECURITY SETTINGS
# ========================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost,mbn13.ir,www.mbn13.ir').split(',')

# ========================================
# 📦 APPLICATION DEFINITION
# ========================================
# ========================================

# در settings.py فقط اینها را نگه دارید:
INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'accounts',
    'api',
    # فعلاً analytics و notifications را کامنت کنید
    # 'analytics',
    # 'notifications',
]
# 🚀 REDIS CONFIGURATION (Enhanced)
# ========================================

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        },
        'KEY_PREFIX': 'mbn13',
        'TIMEOUT': 300,
    }
}

# Session backend
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ========================================
# 🛡️ MIDDLEWARE CONFIGURATION (Enhanced)
# ========================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # NEW: Static files serving
    'corsheaders.middleware.CorsMiddleware',  # NEW: CORS
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',  # NEW: Internationalization
    'accounts.middleware.UserActivityMiddleware',  # NEW: Custom middleware
    'accounts.middleware.SecurityMiddleware',  # NEW: Enhanced security
]

ROOT_URLCONF = 'mbn13_project.urls'

# ========================================
# 🖼️ TEMPLATES CONFIGURATION (Enhanced)
# ========================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.static',
                'django.template.context_processors.media',
                'django.template.context_processors.i18n',  # NEW
                'accounts.context_processors.site_context',  # NEW: Custom context
            ],
        },
    },
]

WSGI_APPLICATION = 'mbn13_project.wsgi.application'

# ========================================
# 🗄️ DATABASE CONFIGURATION (Enhanced)
# ========================================

if DEBUG:
    # Use SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
            'OPTIONS': {
                'timeout': 20,
            }
        }
    }
else:
    # Use PostgreSQL for production
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'OPTIONS': {
                'connect_timeout': 10,
            }
        }
    }

# Database connection pooling for production
if not DEBUG:
    DATABASES['default']['CONN_MAX_AGE'] = 60

# ========================================
# 🔒 PASSWORD VALIDATION (Enhanced)
# ========================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'accounts.validators.CustomPasswordValidator',  # NEW: Custom validation
    },
]

# ========================================
# 🌐 INTERNATIONALIZATION (Enhanced)
# ========================================

LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ('fa', 'فارسی'),
    ('en', 'English'),
]

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# ========================================
# 👤 CUSTOM USER MODEL
# ========================================

AUTH_USER_MODEL = 'accounts.CustomUser'

# ========================================
# 📧 EMAIL CONFIGURATION (Enhanced)
# ========================================

# Email backend configuration
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)

# Email settings
EMAIL_TIMEOUT = 30
EMAIL_USE_LOCALTIME = True

# ========================================
# 🔐 SESSION SETTINGS (Enhanced)
# ========================================

SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_SAVE_EVERY_REQUEST = False

# CSRF Settings
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = True

# ========================================
# 📁 STATIC & MEDIA FILES (Enhanced)
# ========================================

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Additional locations of static files
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Static files finders
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',  # NEW: Compression
]

# Static files compression
COMPRESS_ENABLED = not DEBUG
COMPRESS_CSS_FILTERS = [
    'compressor.filters.css_default.CssAbsoluteFilter',
    'compressor.filters.cssmin.rCSSMinFilter',
]
COMPRESS_JS_FILTERS = [
    'compressor.filters.jsmin.JSMinFilter',
]

# Media files (User uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# ========================================
# 🔄 LOGIN/LOGOUT URLS
# ========================================

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/'

# ========================================
# 🔒 SECURITY SETTINGS (Enhanced)
# ========================================

if not DEBUG:
    # HTTPS settings
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Security headers
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Additional security
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# ========================================
# 📊 LOGGING CONFIGURATION (NEW)
# ========================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# ========================================
# 🌐 REST FRAMEWORK (NEW)
# ========================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# ========================================
# 🔄 CORS SETTINGS (NEW)
# ========================================

CORS_ALLOWED_ORIGINS = [
    "https://mbn13.ir",
    "https://www.mbn13.ir",
    "http://localhost:3000",  # For frontend development
]

if DEBUG:
    CORS_ALLOWED_ORIGINS.extend([
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ])

CORS_ALLOW_CREDENTIALS = True

# ========================================
# 📱 DEVICE SETTINGS (NEW)
# ========================================

# ESP32 specific settings
ESP32_SETTINGS = {
    'MAX_DEVICES_PER_USER': config('MAX_DEVICES_PER_USER', default=10, cast=int),
    'DEVICE_TIMEOUT_MINUTES': config('DEVICE_TIMEOUT_MINUTES', default=5, cast=int),
    'API_RATE_LIMIT': config('API_RATE_LIMIT', default=100, cast=int),  # requests per hour
    'HEARTBEAT_INTERVAL': config('HEARTBEAT_INTERVAL', default=60, cast=int),  # seconds
}

# ========================================
# 📊 ANALYTICS SETTINGS (NEW)
# ========================================

ANALYTICS_SETTINGS = {
    'TRACK_USER_ACTIVITY': True,
    'TRACK_DEVICE_METRICS': True,
    'RETENTION_DAYS': config('ANALYTICS_RETENTION_DAYS', default=90, cast=int),
    'ENABLE_REAL_TIME': config('ENABLE_REAL_TIME_ANALYTICS', default=True, cast=bool),
}

# ========================================
# 🔔 NOTIFICATION SETTINGS (NEW)
# ========================================

NOTIFICATION_SETTINGS = {
    'EMAIL_NOTIFICATIONS': True,
    'SMS_NOTIFICATIONS': config('SMS_NOTIFICATIONS', default=False, cast=bool),
    'PUSH_NOTIFICATIONS': config('PUSH_NOTIFICATIONS', default=False, cast=bool),
    'TELEGRAM_BOT_TOKEN': config('TELEGRAM_BOT_TOKEN', default=''),
}

# ========================================
# ⚡ PERFORMANCE SETTINGS (Enhanced)
# ========================================

# Cache timeout
CACHE_TTL = 60 * 15  # 15 minutes

# Default auto field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Database optimization
if not DEBUG:
    # Connection pool settings
    DATABASES['default']['OPTIONS'].update({
        'MAX_CONNS': 20,
        'OPTIONS': {
            'MAX_CONNS': 20,
        }
    })

# ========================================
# 🎨 JAZZMIN SETTINGS (Enhanced)
# ========================================

JAZZMIN_SETTINGS = {
    "site_title": "mbn13.ir Admin",
    "site_header": "mbn13.ir",
    "site_brand": "ESP32 Management",
    "site_logo": "img/logo.png",
    "login_logo": "img/logo.png",
    "login_logo_dark": None,
    "site_logo_classes": "img-circle",
    "site_icon": None,
    "welcome_sign": "به پنل مدیریت mbn13.ir خوش آمدید",
    "copyright": "mbn13.ir",
    "search_model": ["accounts.CustomUser", "accounts.ESP32Device"],
    
    # Menu
    "topmenu_links": [
        {"name": "خانه", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "سایت", "url": "/", "new_window": True},
        {"model": "accounts.CustomUser"},
    ],
    
    "usermenu_links": [
        {"name": "پشتیبانی", "url": "https://t.me/mbn13_support", "new_window": True},
        {"model": "accounts.customuser"}
    ],
    
    # Side menu
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": ["accounts", "api", "analytics"],
    
    # Icons
    "icons": {
        "accounts.CustomUser": "fas fa-users",
        "accounts.ESP32Device": "fas fa-microchip",
        "analytics": "fas fa-chart-bar",
        "notifications": "fas fa-bell",
    },
    
    # UI Tweaks
    "custom_css": "admin/css/custom.css",
    "custom_js": "admin/js/custom.js",
    "show_ui_builder": DEBUG,
    
    # Change view
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "accounts.customuser": "collapsible",
        "accounts.esp32device": "vertical_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": False,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": False,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "success": "btn-success",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger"
    },
}
