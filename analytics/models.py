# analytics/models.py - Fixed Version
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.postgres.fields import JSONField
from django.db.models import Q, Count, Avg, Sum
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()

class UserActivity(models.Model):
    """ردیابی فعالیت کاربران"""
    ACTIVITY_TYPES = [
        ('login', 'ورود'),
        ('logout', 'خروج'),
        ('device_add', 'افزودن دستگاه'),
        ('device_remove', 'حذف دستگاه'),
        ('profile_update', 'بروزرسانی پروفایل'),
        ('password_change', 'تغییر رمز عبور'),
        ('api_call', 'درخواست API'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Additional data as JSON
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'analytics_user_activity'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['activity_type', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']
        verbose_name = 'فعالیت کاربر'
        verbose_name_plural = 'فعالیت‌های کاربران'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_activity_type_display()}"

class DeviceMetrics(models.Model):
    """متریک‌های دستگاه‌های ESP32"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey('accounts.ESP32Device', on_delete=models.CASCADE, related_name='metrics')
    
    # Performance metrics
    cpu_usage = models.FloatField(default=0.0)
    memory_usage = models.FloatField(default=0.0)
    temperature = models.FloatField(null=True, blank=True)
    uptime_seconds = models.BigIntegerField(default=0)
    
    # Network metrics
    wifi_rssi = models.IntegerField(null=True, blank=True)
    network_errors = models.IntegerField(default=0)
    data_sent = models.BigIntegerField(default=0)
    data_received = models.BigIntegerField(default=0)
    
    # System metrics
    free_heap = models.IntegerField(default=0)
    flash_size = models.IntegerField(default=0)
    
    # Timestamp
    recorded_at = models.DateTimeField(default=timezone.now)
    
    # Additional metrics as JSON
    extra_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'analytics_device_metrics'
        indexes = [
            models.Index(fields=['device', 'recorded_at']),
            models.Index(fields=['recorded_at']),
        ]
        ordering = ['-recorded_at']
        verbose_name = 'متریک دستگاه'
        verbose_name_plural = 'متریک‌های دستگاه‌ها'
    
    def __str__(self):
        return f"{self.device.name} metrics - {self.recorded_at}"

class SystemMetrics(models.Model):
    """متریک‌های سیستم کلی"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User statistics
    total_users = models.IntegerField(default=0)
    active_users_today = models.IntegerField(default=0)
    active_users_week = models.IntegerField(default=0)
    active_users_month = models.IntegerField(default=0)
    
    # Device statistics
    total_devices = models.IntegerField(default=0)
    online_devices = models.IntegerField(default=0)
    pending_requests = models.IntegerField(default=0)
    
    # API statistics
    api_requests_today = models.IntegerField(default=0)
    api_errors_today = models.IntegerField(default=0)
    
    # System health
    database_size_mb = models.FloatField(default=0.0)
    cache_hit_rate = models.FloatField(default=0.0)
    average_response_time = models.FloatField(default=0.0)
    
    # Timestamp
    recorded_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'analytics_system_metrics'
        ordering = ['-recorded_at']
        verbose_name = 'متریک سیستم'
        verbose_name_plural = 'متریک‌های سیستم'
    
    def __str__(self):
        return f"System metrics - {self.recorded_at}"

class Alert(models.Model):
    """هشدارهای سیستم"""
    SEVERITY_CHOICES = [
        ('low', 'کم'),
        ('medium', 'متوسط'),
        ('high', 'زیاد'),
        ('critical', 'بحرانی'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'جدید'),
        ('acknowledged', 'تایید شده'),
        ('resolved', 'حل شده'),
        ('dismissed', 'رد شده'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    
    # Related objects (optional)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    device = models.ForeignKey('accounts.ESP32Device', on_delete=models.CASCADE, null=True, blank=True)
    
    # Additional data
    data = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Who handled the alert
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_alerts')
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    
    class Meta:
        db_table = 'analytics_alerts'
        indexes = [
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['user']),
            models.Index(fields=['device']),
        ]
        ordering = ['-created_at']
        verbose_name = 'هشدار'
        verbose_name_plural = 'هشدارها'
    
    def __str__(self):
        return f"{self.get_severity_display()} - {self.title}"
    
    def acknowledge(self, user):
        """تایید هشدار"""
        self.status = 'acknowledged'
        self.acknowledged_by = user
        self.acknowledged_at = timezone.now()
        self.save()
    
    def resolve(self, user):
        """حل هشدار"""
        self.status = 'resolved'
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save()

class APIUsage(models.Model):
    """آمار استفاده از API"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    device = models.ForeignKey('accounts.ESP32Device', on_delete=models.CASCADE, null=True, blank=True)
    
    endpoint = models.CharField(max_length=200)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    response_time_ms = models.IntegerField()
    
    # Request info
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    # Data size
    request_size = models.IntegerField(default=0)
    response_size = models.IntegerField(default=0)
    
    # Timestamp
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Error info (if any)
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'analytics_api_usage'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['device', 'timestamp']),
            models.Index(fields=['endpoint', 'timestamp']),
            models.Index(fields=['status_code', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']
        verbose_name = 'استفاده از API'
        verbose_name_plural = 'آمار استفاده از API'
    
    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.status_code}"

class ErrorLog(models.Model):
    """لاگ خطاهای سیستم"""
    LEVEL_CHOICES = [
        ('debug', 'Debug'),
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    message = models.TextField()
    
    # Context
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    device = models.ForeignKey('accounts.ESP32Device', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Technical details
    module = models.CharField(max_length=100, blank=True)
    function = models.CharField(max_length=100, blank=True)
    line_number = models.IntegerField(null=True, blank=True)
    
    # Stack trace and additional data
    stack_trace = models.TextField(blank=True)
    extra_data = models.JSONField(default=dict, blank=True)
    
    # Request info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'analytics_error_log'
        indexes = [
            models.Index(fields=['level', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']
        verbose_name = 'لاگ خطا'
        verbose_name_plural = 'لاگ‌های خطا'
    
    def __str__(self):
        return f"{self.get_level_display()} - {self.message[:50]}"
