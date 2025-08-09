from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid
import secrets
import string
from datetime import timedelta

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True, verbose_name='ایمیل')
    is_verified = models.BooleanField(default=False, verbose_name='تایید شده')
    
    # کدهای تایید
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_expires = models.DateTimeField(blank=True, null=True)
    
    # کدهای بازیابی رمز
    reset_code = models.CharField(max_length=6, blank=True, null=True)
    reset_expires = models.DateTimeField(blank=True, null=True)
    
    # اطلاعات اضافی
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    
    def generate_verification_code(self):
        """تولید کد تایید 6 رقمی"""
        code = ''.join(secrets.choice('0123456789') for _ in range(6))
        self.verification_code = code
        self.verification_expires = timezone.now() + timedelta(minutes=5)
        self.save()
        return code
    
    def is_verification_code_valid(self, code):
        """بررسی صحت کد تایید"""
        return (self.verification_code == code and 
                self.verification_expires and 
                timezone.now() <= self.verification_expires)
    
    def clear_verification_code(self):
        """پاک کردن کد تایید"""
        self.verification_code = None
        self.verification_expires = None
        self.save()
    
    def generate_reset_code(self):
        """تولید کد بازیابی رمز"""
        code = ''.join(secrets.choice('0123456789') for _ in range(6))
        self.reset_code = code
        self.reset_expires = timezone.now() + timedelta(minutes=5)
        self.save()
        return code
    
    def is_reset_code_valid(self, code):
        """بررسی صحت کد بازیابی"""
        return (self.reset_code == code and 
                self.reset_expires and 
                timezone.now() <= self.reset_expires)
    
    def clear_reset_code(self):
        """پاک کردن کد بازیابی"""
        self.reset_code = None
        self.reset_expires = None
        self.save()
    
    def __str__(self):
        return self.username

class ESP32Device(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در حال بررسی'),
        ('approved', 'تایید شده'),
        ('rejected', 'رد شده'),
        ('suspended', 'معلق شده'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100, verbose_name='نام دستگاه')
    api_key = models.CharField(max_length=64, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True, null=True)
    
    # اطلاعات اتصال
    last_seen = models.DateTimeField(blank=True, null=True)
    is_online = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    # تاریخ‌ها
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'دستگاه'
        verbose_name_plural = 'دستگاه‌ها'
    
    def generate_api_key(self):
        """تولید API Key جدید"""
        chars = string.ascii_letters + string.digits
        self.api_key = ''.join(secrets.choice(chars) for _ in range(32))
        self.save()
        return self.api_key
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
