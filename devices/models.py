from django.db import models
from django.contrib.auth import get_user_model
import secrets
import string

User = get_user_model()

class ESP32Device(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار بررسی'),
        ('approved', 'تایید شده'),
        ('rejected', 'رد شده'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100, verbose_name='نام دستگاه')
    api_key = models.CharField(max_length=64, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True, verbose_name='دلیل رد')
    
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.api_key and self.status == 'approved':
            self.api_key = self.generate_api_key()
        super().save(*args, **kwargs)
    
    def generate_api_key(self):
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(64))
    
    class Meta:
        db_table = 'esp32_devices'
        verbose_name = 'دستگاه ESP32'
        verbose_name_plural = 'دستگاه‌های ESP32'
        ordering = ['-created_at']

class DeviceLog(models.Model):
    device = models.ForeignKey(ESP32Device, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=50)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'device_logs'
        verbose_name = 'لاگ دستگاه'
        verbose_name_plural = 'لاگ‌های دستگاه'
        ordering = ['-created_at']

class DeviceRequest(models.Model):
    """برای ذخیره تاریخچه درخواست‌ها"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    device = models.ForeignKey(ESP32Device, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)  # create, delete, etc
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'device_requests'