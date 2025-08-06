from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import secrets
import string

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_code_expires = models.DateTimeField(blank=True, null=True)
    reset_code = models.CharField(max_length=6, blank=True, null=True)
    reset_code_expires = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Email as main identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def generate_verification_code(self):
        """تولید کد تایید 6 رقمی"""
        self.verification_code = ''.join(secrets.choice(string.digits) for _ in range(6))
        self.verification_code_expires = timezone.now() + timezone.timedelta(minutes=15)
        self.save()
        return self.verification_code

    def generate_reset_code(self):
        """تولید کد بازیابی 6 رقمی"""
        self.reset_code = ''.join(secrets.choice(string.digits) for _ in range(6))
        self.reset_code_expires = timezone.now() + timezone.timedelta(minutes=15)
        self.save()
        return self.reset_code

    def is_verification_code_valid(self, code):
        """بررسی اعتبار کد تایید"""
        if not self.verification_code or not self.verification_code_expires:
            return False
        return (
            self.verification_code == code and
            timezone.now() <= self.verification_code_expires
        )

    def is_reset_code_valid(self, code):
        """بررسی اعتبار کد بازیابی"""
        if not self.reset_code or not self.reset_code_expires:
            return False
        return (
            self.reset_code == code and
            timezone.now() <= self.reset_code_expires
        )

    def clear_verification_code(self):
        """پاک کردن کد تایید"""
        self.verification_code = None
        self.verification_code_expires = None
        self.save()

    def clear_reset_code(self):
        """پاک کردن کد بازیابی"""
        self.reset_code = None
        self.reset_code_expires = None
        self.save()

    def __str__(self):
        return f"{self.username} ({self.email})"


class ESP32Device(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در حال بررسی'),
        ('approved', 'تایید شده'),
        ('rejected', 'رد شده'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100, verbose_name='نام دستگاه')
    api_key = models.CharField(max_length=32, unique=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='دلیل رد')
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_api_key(self):
        """تولید API Key یکتا"""
        self.api_key = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        self.save()
        return self.api_key

    def mark_online(self):
        """علامت‌گذاری دستگاه به عنوان آنلاین"""
        self.is_online = True
        self.last_seen = timezone.now()
        self.save()

    def mark_offline(self):
        """علامت‌گذاری دستگاه به عنوان آفلاین"""
        self.is_online = False
        self.save()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'دستگاه ESP32'
        verbose_name_plural = 'دستگاه‌های ESP32'

    def __str__(self):
        return f"{self.name} - {self.user.username}"
