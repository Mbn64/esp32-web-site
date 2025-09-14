# accounts/middleware.py - Enhanced Security and Activity Middleware
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache
import time
import logging
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)

class UserActivityMiddleware(MiddlewareMixin):
    """میدل‌ور ردیابی فعالیت کاربران"""
    
    def process_request(self, request):
        # Update user last activity
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Update last activity every 5 minutes to avoid too many DB writes
            cache_key = f"user_activity_{request.user.id}"
            last_update = cache.get(cache_key)
            
            if not last_update or (timezone.now() - last_update).seconds > 300:  # 5 minutes
                request.user.last_activity = timezone.now()
                request.user.save(update_fields=['last_activity'])
                cache.set(cache_key, timezone.now(), 600)  # Cache for 10 minutes
        
        return None

class SecurityMiddleware(MiddlewareMixin):
    """میدل‌ور امنیتی پیشرفته"""
    
    def process_request(self, request):
        # Check for suspicious activity
        self._check_rate_limiting(request)
        self._log_security_events(request)
        
        return None
    
    def _check_rate_limiting(self, request):
        """بررسی محدودیت نرخ درخواست‌ها"""
        ip = self._get_client_ip(request)
        
        # Different limits for different endpoints
        if request.path.startswith('/api/'):
            limit = 100  # 100 requests per hour for API
            window = 3600
        else:
            limit = 300  # 300 requests per hour for web
            window = 3600
        
        cache_key = f"rate_limit_{ip}"
        current_requests = cache.get(cache_key, 0)
        
        if current_requests >= limit:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return JsonResponse({
                'error': 'Too many requests. Please try again later.'
            }, status=429)
        
        # Increment counter
        cache.set(cache_key, current_requests + 1, window)
    
    def _log_security_events(self, request):
        """ثبت رویدادهای امنیتی"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Check for suspicious login patterns
            self._check_suspicious_login(request)
            
            # Log API access
            if request.path.startswith('/api/'):
                self._log_api_access(request)
    
    def _check_suspicious_login(self, request):
        """بررسی الگوهای مشکوک ورود"""
        from .models import LoginHistory, SecurityEvent
        
        user = request.user
        current_ip = self._get_client_ip(request)
        
        # Check if user logged in from different country in last hour
        recent_logins = LoginHistory.objects.filter(
            user=user,
            timestamp__gte=timezone.now() - timedelta(hours=1),
            success=True
        ).exclude(ip_address=current_ip)
        
        if recent_logins.exists():
            # Create security event
            SecurityEvent.objects.create(
                user=user,
                event_type='suspicious_login',
                risk_level='medium',
                description=f'Login from different location: {current_ip}',
                ip_address=current_ip,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                context_data={
                    'previous_ips': list(recent_logins.values_list('ip_address', flat=True))
                }
            )
    
    def _log_api_access(self, request):
        """ثبت دسترسی به API"""
        from analytics.models import APIUsage
        
        start_time = time.time()
        
        # Store start time for response processing
        request._api_start_time = start_time
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کلاینت"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def process_response(self, request, response):
        # Log API response
        if (hasattr(request, '_api_start_time') and 
            request.path.startswith('/api/')):
            self._log_api_response(request, response)
        
        return response
    
    def _log_api_response(self, request, response):
        """ثبت پاسخ API"""
        from analytics.models import APIUsage
        
        try:
            response_time = int((time.time() - request._api_start_time) * 1000)
            
            APIUsage.objects.create(
                user=request.user if request.user.is_authenticated else None,
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                request_size=len(request.body) if hasattr(request, 'body') else 0,
                response_size=len(response.content) if hasattr(response, 'content') else 0
            )
        except Exception as e:
            logger.error(f"Error logging API usage: {e}")

class DeviceTrackingMiddleware(MiddlewareMixin):
    """میدل‌ور ردیابی دستگاه‌ها"""
    
    def process_request(self, request):
        # Check if this is an ESP32 device request
        if self._is_device_request(request):
            self._track_device_activity(request)
        
        return None
    
    def _is_device_request(self, request):
        """بررسی درخواست از دستگاه ESP32"""
        api_key = (request.headers.get('X-API-Key') or 
                  request.headers.get('Authorization', '').replace('Bearer ', ''))
        return bool(api_key and request.path.startswith('/api/'))
    
    def _track_device_activity(self, request):
        """ردیابی فعالیت دستگاه"""
        from .models import ESP32Device
        
        api_key = (request.headers.get('X-API-Key') or 
                  request.headers.get('Authorization', '').replace('Bearer ', ''))
        
        try:
            device = ESP32Device.objects.get(api_key=api_key, status='approved')
            
            # Update last seen
            device.last_seen = timezone.now()
            device.is_online = True
            device.ip_address = self._get_client_ip(request)
            device.save(update_fields=['last_seen', 'is_online', 'ip_address'])
            
            # Increment API call counter
            device.increment_api_call()
            
        except ESP32Device.DoesNotExist:
            pass
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کلاینت"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class PerformanceMiddleware(MiddlewareMixin):
    """میدل‌ور بهبود عملکرد"""
    
    def process_request(self, request):
        request._start_time = time.time()
        return None
    
    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            
            # Add performance headers
            response['X-Response-Time'] = f"{duration:.3f}s"
            
            # Log slow requests
            if duration > 2.0:  # Log requests slower than 2 seconds
                logger.warning(
                    f"Slow request: {request.method} {request.path} "
                    f"took {duration:.3f}s from IP {self._get_client_ip(request)}"
                )
            
            # Cache performance metrics
            if request.path.startswith('/dashboard/'):
                cache_key = f"performance_dashboard_{request.user.id if request.user.is_authenticated else 'anonymous'}"
                metrics = cache.get(cache_key, [])
                metrics.append({
                    'path': request.path,
                    'duration': duration,
                    'timestamp': timezone.now().isoformat()
                })
                
                # Keep only last 100 requests
                if len(metrics) > 100:
                    metrics = metrics[-100:]
                
                cache.set(cache_key, metrics, 3600)  # Cache for 1 hour
        
        return response
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کلاینت"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class MaintenanceMiddleware(MiddlewareMixin):
    """میدل‌ور حالت تعمیر و نگهداری"""
    
    def process_request(self, request):
        # Check if maintenance mode is enabled
        maintenance_mode = cache.get('maintenance_mode', False)
        
        if maintenance_mode:
            # Allow access for superusers
            if (hasattr(request, 'user') and 
                request.user.is_authenticated and 
                request.user.is_superuser):
                return None
            
            # Allow access to admin and API for device status
            if (request.path.startswith('/admin/') or 
                request.path.startswith('/api/device-status/')):
                return None
            
            # Return maintenance page for others
            from django.shortcuts import render
            return render(request, 'maintenance.html', status=503)
        
        return None

class CSPMiddleware(MiddlewareMixin):
    """میدل‌ور Content Security Policy"""
    
    def process_response(self, request, response):
        # Add security headers
        if not settings.DEBUG:
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
                "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
                "style-src 'self' 'unsafe-inline' "
                "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com "
                "https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com "
                "https://cdnjs.cloudflare.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.github.com; "
                "frame-ancestors 'none';"
            )
            
            response['X-Frame-Options'] = 'DENY'
            response['X-Content-Type-Options'] = 'nosniff'
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response['Permissions-Policy'] = (
                "accelerometer=(), camera=(), geolocation=(), "
                "gyroscope=(), magnetometer=(), microphone=(), "
                "payment=(), usb=()"
            )
        
        return response

class GeoLocationMiddleware(MiddlewareMixin):
    """میدل‌ور تشخیص موقعیت جغرافیایی"""
    
    def process_request(self, request):
        # Add geolocation info to request
        ip = self._get_client_ip(request)
        
        # Try to get cached location info
        cache_key = f"geo_location_{ip}"
        location_info = cache.get(cache_key)
        
        if not location_info:
            location_info = self._get_location_info(ip)
            if location_info:
                cache.set(cache_key, location_info, 86400)  # Cache for 24 hours
        
        request.geo_info = location_info or {}
        return None
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کلاینت"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_location_info(self, ip):
        """دریافت اطلاعات موقعیت جغرافیایی"""
        try:
            # Skip for local IPs
            if ip in ['127.0.0.1', 'localhost'] or ip.startswith('192.168.'):
                return {'country': 'Iran', 'city': 'Tehran'}
            
            # Here you would integrate with a geolocation service
            # For now, return Iran as default
            return {'country': 'Iran', 'city': 'Tehran'}
            
        except Exception as e:
            logger.error(f"Error getting location info for IP {ip}: {e}")
            return None

class APIVersionMiddleware(MiddlewareMixin):
    """میدل‌ور مدیریت نسخه API"""
    
    def process_request(self, request):
        if request.path.startswith('/api/'):
            # Get API version from header or URL
            api_version = (
                request.headers.get('X-API-Version') or
                request.GET.get('version', 'v1')
            )
            
            request.api_version = api_version
            
            # Check if version is supported
            supported_versions = ['v1', 'v2']
            if api_version not in supported_versions:
                return JsonResponse({
                    'error': f'Unsupported API version: {api_version}',
                    'supported_versions': supported_versions
                }, status=400)
        
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'api_version'):
            response['X-API-Version'] = request.api_version
        
        return response

class DatabaseOptimizationMiddleware(MiddlewareMixin):
    """میدل‌ور بهینه‌سازی پایگاه داده"""
    
    def process_request(self, request):
        # Enable query optimization for authenticated users
        if hasattr(request, 'user') and request.user.is_authenticated:
            request._db_queries_start = len(cache.get('db_queries', []))
        return None
    
    def process_response(self, request, response):
        if hasattr(request, '_db_queries_start'):
            from django.db import connection
            
            # Log excessive database queries
            query_count = len(connection.queries)
            if query_count > 20:  # More than 20 queries
                logger.warning(
                    f"High DB query count: {query_count} queries for "
                    f"{request.method} {request.path} by user {request.user.username}"
                )
        
        return response

class CacheMiddleware(MiddlewareMixin):
    """میدل‌ور کش هوشمند"""
    
    def process_request(self, request):
        # Skip caching for authenticated users on certain pages
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            request.path.startswith('/dashboard/')):
            
            # Check if we have cached dashboard data
            cache_key = f"dashboard_data_{request.user.id}"
            cached_data = cache.get(cache_key)
            
            if cached_data and request.method == 'GET':
                # Add cache headers
                request._use_cache = True
        
        return None
    
    def process_response(self, request, response):
        # Add cache control headers
        if hasattr(request, '_use_cache'):
            response['Cache-Control'] = 'private, max-age=300'  # 5 minutes
        
        # Cache static-like responses
        if (response.status_code == 200 and 
            request.method == 'GET' and
            not request.path.startswith('/admin/')):
            
            if 'static' in request.path or 'media' in request.path:
                response['Cache-Control'] = 'public, max-age=31536000'  # 1 year
        
        return response

class RequestLoggingMiddleware(MiddlewareMixin):
    """میدل‌ور ثبت درخواست‌ها"""
    
    def process_request(self, request):
        # Log important requests
        if (request.method in ['POST', 'PUT', 'DELETE'] or
            request.path.startswith('/api/') or
            request.path.startswith('/admin/')):
            
            logger.info(
                f"Request: {request.method} {request.path} "
                f"from {self._get_client_ip(request)} "
                f"User: {getattr(request.user, 'username', 'Anonymous')}"
            )
        
        return None
    
    def process_response(self, request, response):
        # Log errors and important responses
        if response.status_code >= 400:
            logger.warning(
                f"Response: {response.status_code} for "
                f"{request.method} {request.path} "
                f"from {self._get_client_ip(request)}"
            )
        
        return response
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کلاینت"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
