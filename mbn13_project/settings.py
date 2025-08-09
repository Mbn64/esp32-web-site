from decouple import config
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1').split(',')

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
            ],
        },
    },
]

# Database Configuration
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
            'HOST': config('DB_HOST'),
            'PORT': config('DB_PORT'),
        }
    }

# 👤 Custom User Model
AUTH_USER_MODEL = 'accounts.CustomUser'

# 📧 Email Configuration - Always use real email for verification
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('GMAIL_USER')
EMAIL_HOST_PASSWORD = config('GMAIL_APP_PASSWORD')
DEFAULT_FROM_EMAIL = config('GMAIL_USER')

# Session Settings
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Login/Logout URLs
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/'

# Admin Credentials
ADMIN_USERNAME = config('ADMIN_USERNAME', default='admin')
ADMIN_PASSWORD = config('ADMIN_PASSWORD', default='admin123')

# Site Settings
SITE_NAME = 'mbn13.ir'

# ========================================
# 🎨 JAZZMIN ADMIN THEME CONFIGURATION
# ========================================

JAZZMIN_SETTINGS = {
    # title of the window
    "site_title": "MBN13 Admin",

    # Title on the login screen
    "site_header": "مدیریت MBN13",

    # Title on the brand
    "site_brand": "MBN13.ir",

    # Logo to use for your site, must be present in static files
    "site_logo": None,

    # Logo to use for login form
    "login_logo": None,

    # Logo to use for login form in dark themes
    "login_logo_dark": None,

    # CSS classes that are applied to the logo above
    "site_logo_classes": "img-circle",

    # Relative path to a favicon for your site
    "site_icon": None,

    # Welcome text on the login screen
    "welcome_sign": "خوش آمدید به پنل مدیریت MBN13.ir",

    # Copyright on the footer
    "copyright": "MBN13.ir - سیستم مدیریت ESP32",

    # Field name on user model that contains avatar
    "user_avatar": None,

    ############
    # Top Menu #
    ############

    # Links to put along the top menu
    "topmenu_links": [
        {"name": "خانه", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "پنل مدیریت پیشرفته", "url": "/management/", "new_window": True},
        {"name": "مشاهده سایت", "url": "/", "new_window": True},
        {"name": "راهنما", "url": "https://docs.djangoproject.com", "new_window": True},
    ],

    #############
    # User Menu #
    #############

    # Additional links to include in the user menu on the top right
    "usermenu_links": [
        {"name": "پنل مدیریت ESP32", "url": "/management/", "new_window": False},
        {"name": "تنظیمات حساب", "url": "/admin/password_change/", "new_window": False},
        {"model": "auth.user"}
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

    # List of apps to base side menu ordering off of
    "order_with_respect_to": ["auth", "accounts", "api"],

    # Custom links to append to app groups
    "custom_links": {
        "accounts": [{
            "name": "پنل مدیریت ESP32", 
            "url": "/management/", 
            "icon": "fas fa-cogs",
            "permissions": ["accounts.view_customuser"]
        }, {
            "name": "آمار سیستم", 
            "url": "/management/", 
            "icon": "fas fa-chart-bar",
            "permissions": ["accounts.view_esp32device"]
        }],
        "auth": [{
            "name": "مدیریت دسترسی‌ها", 
            "url": "/admin/auth/", 
            "icon": "fas fa-shield-alt",
            "permissions": ["auth.view_user"]
        }]
    },

    # Custom icons for side menu apps/models
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "accounts": "fas fa-microchip",
        "accounts.CustomUser": "fas fa-user-circle",
        "accounts.ESP32Device": "fas fa-microchip",
        "api": "fas fa-code",
    },

    # Icons that are used when one is not manually specified
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",

    #################
    # Related Modal #
    #################
    # Use modals instead of popups
    "related_modal_active": False,

    #############
    # UI Tweaks #
    #############
    # Relative paths to custom CSS/JS scripts
    "custom_css": None,
    "custom_js": None,
    
    # Whether to link font from fonts.googleapis.com
    "use_google_fonts_cdn": True,
    
    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": True,

    ###############
    # Change view #
    ###############
    # Render out the change view as tabs or single form
    "changeform_format": "horizontal_tabs",
    
    # Override change forms on a per modeladmin basis
    "changeform_format_overrides": {
        "auth.user": "collapsible", 
        "auth.group": "vertical_tabs",
        "accounts.customuser": "horizontal_tabs",
        "accounts.esp32device": "horizontal_tabs"
    },

    # Add a language dropdown into the admin
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-primary navbar-dark",
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
    },
    "actions_sticky_top": False
}
