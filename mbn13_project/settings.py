# settings.py
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

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost').split(',')

# ========================================
# 📦 APPLICATION DEFINITION
# ========================================

INSTALLED_APPS = [
    'jazzmin',  # Add Jazzmin BEFORE django.contrib.admin
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'accounts',
    'api',  # Add your API app
]

# ========================================
# 🚀 REDIS CONFIGURATION
# ========================================

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Session backend
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ========================================
# 🛡️ MIDDLEWARE CONFIGURATION
# ========================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mbn13_project.urls'

# ========================================
# 🖼️ TEMPLATES CONFIGURATION
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
                'django.template.context_processors.static',  # برای static files
                'django.template.context_processors.media',   # برای media files
            ],
        },
    },
]

WSGI_APPLICATION = 'mbn13_project.wsgi.application'

# ========================================
# 🗄️ DATABASE CONFIGURATION
# ========================================

if DEBUG:
    # Use SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
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
        }
    }

# ========================================
# 🔒 PASSWORD VALIDATION
# ========================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ========================================
# 🌐 INTERNATIONALIZATION
# ========================================

LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

# ========================================
# 👤 CUSTOM USER MODEL
# ========================================

AUTH_USER_MODEL = 'accounts.CustomUser'

# ========================================
# 📧 EMAIL CONFIGURATION
# ========================================

# Always use real email for verification
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('GMAIL_USER')
EMAIL_HOST_PASSWORD = config('GMAIL_APP_PASSWORD')
DEFAULT_FROM_EMAIL = config('GMAIL_USER')

# ========================================
# 🔐 SESSION SETTINGS
# ========================================

SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SECURE = not DEBUG  # HTTPS only in production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# CSRF Settings
CSRF_COOKIE_SECURE = not DEBUG  # HTTPS only in production
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# ========================================
# 📁 STATIC & MEDIA FILES CONFIGURATION
# ========================================

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
# اضافه کنید به settings.py
STATIC_ROOT = '/var/www/mbn13/staticfiles/'

# Additional locations of static files
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Static files finders
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# Media files (User uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ========================================
# 🔧 DEFAULT SETTINGS
# ========================================

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========================================
# 🔄 LOGIN/LOGOUT URLS
# ========================================

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/'

# ========================================
# 👨‍💼 ADMIN CREDENTIALS
# ========================================

ADMIN_USERNAME = config('ADMIN_USERNAME', default='admin')
ADMIN_PASSWORD = config('ADMIN_PASSWORD', default='admin123')

# ========================================
# 🌍 SITE SETTINGS
# ========================================

SITE_NAME = 'mbn13.ir'
SITE_DOMAIN = config('SITE_DOMAIN', default='mbn13.ir')

# ========================================
# ⚡ PERFORMANCE SETTINGS
# ========================================

# Cache timeout
CACHE_TTL = 60 * 15  # 15 minutes

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# ========================================
# 🔒 SECURITY SETTINGS FOR PRODUCTION
# ========================================

if not DEBUG:
    # Security settings for production
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = 'DENY'
    
    # Force HTTPS
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ========================================
# 🎨 JAZZMIN ADMIN THEME CONFIGURATION
# ========================================

JAZZMIN_SETTINGS = {
    # Title on the login screen
    "site_title": "MBN13 Admin",
    
    # Title on the brand
    "site_header": "مدیریت MBN13.ir",
    
    # Square logo to use for your site
    "site_logo": None,
    
    # Logo to use for login form
    "login_logo": None,
    
    # Relative path to a favicon for your site
    "site_icon": None,
    
    # Welcome text on the login screen
    "welcome_sign": "به پنل مدیریت ESP32 خوش آمدید",
    
    # Copyright on the footer
    "copyright": "MBN13.ir",
    
    # The model admin to search from the search bar
    "search_model": "accounts.CustomUser",
    
    # Field name on user model that contains avatar image
    "user_avatar": None,
    
    ############
    # Top Menu #
    ############
    
    # Links to put along the top menu
    "topmenu_links": [
        # Url that gets reversed (Permissions can be added)
        {"name": "خانه", "url": "admin:index", "permissions": ["auth.view_user"]},
        
        # external url that opens in a new window (Permissions can be added)
        {"name": "مشاهده سایت", "url": "/", "new_window": True},
        
        # model admin to link to (Permissions checked against model)
        {"model": "accounts.CustomUser"},
        
        # App with dropdown menu to all its models pages (Permissions checked against models)
        {"app": "accounts"},
    ],
    
    #############
    # User Menu #
    #############
    
    # Additional links to include in the user menu on the top right
    "usermenu_links": [
        {"name": "مشاهده سایت", "url": "/", "new_window": True},
        {"model": "accounts.customuser"}
    ],
    
    #############
    # Side Menu #
    #############
    
    # Whether to display the side menu
    "show_sidebar": True,
    
    # Whether to auto expand the menu
    "navigation_expanded": True,
    
    # Hide these apps when generating side menu
    "hide_apps": [],
    
    # Hide these models when generating side menu
    "hide_models": [],
    
    # List of apps (and/or models) to base side menu ordering off of
    "order_with_respect_to": ["accounts", "api"],
    
    # Custom links to append to app groups, keyed on app name
    "custom_links": {
        "accounts": [{
            "name": "گزارش کاربران", 
            "url": "make_messages", 
            "icon": "fas fa-chart-bar",
            "permissions": ["accounts.view_customuser"]
        }]
    },
    
    # Custom icons for side menu apps/models
    "icons": {
        "accounts.CustomUser": "fas fa-users",
        "accounts.ESP32Device": "fas fa-microchip",
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
    },
    
    # Icons that are used when one is not manually specified
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    
    #################
    # Related Modal #
    #################
    "related_modal_active": False,
    
    #############
    # UI Tweaks #
    #############
    "custom_css": None,
    "custom_js": None,
    
    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": False,
    
    ###############
    # Change view #
    ###############
    "changeform_format": "horizontal_tabs",
    
    # override change forms on a per modeladmin basis
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
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}

# ========================================
# 📊 LOGGING CONFIGURATION
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
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'api': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
logs_dir = BASE_DIR / 'logs'
if not logs_dir.exists():
    logs_dir.mkdir()

# ========================================
# 🔧 CUSTOM SETTINGS
# ========================================

# ESP32 Device Settings
ESP32_MAX_DEVICES_PER_USER = 10
ESP32_API_KEY_LENGTH = 32
ESP32_CONNECTION_TIMEOUT = 300  # 5 minutes

# Email Verification Settings
EMAIL_VERIFICATION_CODE_LENGTH = 6
EMAIL_VERIFICATION_CODE_EXPIRY = 900  # 15 minutes
EMAIL_RESET_CODE_EXPIRY = 900  # 15 minutes

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS = 5
RATE_LIMIT_SIGNUP_ATTEMPTS = 3
RATE_LIMIT_EMAIL_SEND = 3

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'mbn13.ir', '*.mbn13.ir']
