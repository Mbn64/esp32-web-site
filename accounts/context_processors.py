# accounts/context_processors.py
from django.conf import settings

def site_context(request):
    """
    Context processor برای اضافه کردن اطلاعات سایت به تمام template ها
    """
    try:
        # Basic site information
        context = {
            'SITE_NAME': 'MBN13.ir',
            'SITE_TITLE': 'ESP32 Management System',
            'SITE_DESCRIPTION': 'سیستم مدیریت دستگاه‌های ESP32',
            'SITE_KEYWORDS': 'ESP32, IoT, Arduino, مدیریت دستگاه',
            'SITE_URL': 'https://mbn13.ir',
            'CURRENT_YEAR': 2025,
        }
        
        # Add debug information if in debug mode
        if settings.DEBUG:
            context['DEBUG'] = True
        
        # Add user-related context if authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            context.update({
                'USER_DEVICE_COUNT': getattr(request.user, 'devices', []),
                'USER_IS_VERIFIED': getattr(request.user, 'is_verified', False),
            })
        
        # Social media links
        context.update({
            'SOCIAL_LINKS': {
                'telegram': 'https://t.me/mbn13_support',
                'github': 'https://github.com/mbn13',
                'email': 'support@mbn13.ir',
            }
        })
        
        return context
        
    except Exception as e:
        # Fallback in case of any errors
        return {
            'SITE_NAME': 'MBN13.ir',
            'SITE_TITLE': 'ESP32 Management',
            'DEBUG': getattr(settings, 'DEBUG', False),
        }
