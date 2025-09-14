# notifications/models.py - Fixed JSONField
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class NotificationTemplate(models.Model):
    """قالب‌های اعلان"""
    CHANNEL_CHOICES = [
        ('email', 'ایمیل'),
        ('sms', 'پیامک'),
        ('push', 'اعلان Push'),
        ('telegram', 'تلگرام'),
        ('in_app', 'درون برنامه'),
    ]
    
    EVENT_CHOICES = [
        ('device_approved', 'تایید دستگاه'),
        ('device_rejected', 'رد دستگاه'),
        ('device_offline', 'آفلاین شدن دستگاه'),
        ('device_online', 'آنلاین شدن دستگاه'),
        ('device_error', 'خطای دستگاه'),
        ('account_verified', 'تایید حساب'),
        ('password_changed', 'تغییر رمز عبور'),
        ('security_alert', 'هشدار امنیتی'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    
    # Template content
    subject_template = models.CharField(max_length=200, blank=True)
    body_template = models.TextField()
    
    # Settings
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=1)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications_template'
        unique_together = ['event_type', 'channel']
        ordering = ['event_type', 'channel']
        verbose_name = 'قالب اعلان'
        verbose_name_plural = 'قالب‌های اعلان'
    
    def __str__(self):
        return f"{self.name} - {self.get_channel_display()}"

class Notification(models.Model):
    """اعلانات ارسالی"""
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('sent', 'ارسال شده'),
        ('delivered', 'تحویل داده شده'),
        ('failed', 'ناموفق'),
        ('read', 'خوانده شده'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE)
    
    # Content (rendered from template)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    
    # Status and delivery
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_method = models.CharField(max_length=20)
    recipient = models.CharField(max_length=200)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Error info (if failed)
    error_message = models.TextField(blank=True)
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)  # Fixed: Use models.JSONField
    
    class Meta:
        db_table = 'notifications_notification'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
        verbose_name = 'اعلان'
        verbose_name_plural = 'اعلانات'
    
    def __str__(self):
        return f"{self.user.username} - {self.subject}"
    
    def mark_as_read(self):
        """علامت‌گذاری به عنوان خوانده شده"""
        if self.status != 'read':
            self.status = 'read'
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])

class UserNotificationSettings(models.Model):
    """تنظیمات اعلانات کاربر"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Email notifications
    email_device_approved = models.BooleanField(default=True)
    email_device_rejected = models.BooleanField(default=True)
    email_device_offline = models.BooleanField(default=True)
    email_device_error = models.BooleanField(default=True)
    email_security_alerts = models.BooleanField(default=True)
    email_system_updates = models.BooleanField(default=False)
    
    # SMS notifications
    sms_device_offline = models.BooleanField(default=False)
    sms_device_error = models.BooleanField(default=False)
    sms_security_alerts = models.BooleanField(default=True)
    
    # Push notifications
    push_device_status = models.BooleanField(default=True)
    push_security_alerts = models.BooleanField(default=True)
    
    # Telegram notifications
    telegram_chat_id = models.CharField(max_length=50, blank=True)
    telegram_enabled = models.BooleanField(default=False)
    
    # In-app notifications
    in_app_enabled = models.BooleanField(default=True)
    
    # Global settings
    do_not_disturb_start = models.TimeField(null=True, blank=True)
    do_not_disturb_end = models.TimeField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default='Asia/Tehran')
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications_user_settings'
        verbose_name = 'تنظیمات اعلانات'
        verbose_name_plural = 'تنظیمات اعلانات کاربران'
    
    def __str__(self):
        return f"Notification settings for {self.user.username}"
