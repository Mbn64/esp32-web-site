# accounts/models.py - Fixed JSONField imports
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid
import secrets
import string
from datetime import timedelta

class CustomUser(AbstractUser):
    """کاربر سفارشی"""
    
    # Basic info
    email = models.EmailField(unique=True, verbose_name='ایمیل')
    phone_number = models.CharField(
        max_length=11, 
        blank=True, 
        validators=[RegexValidator(r'^09\d{9}$', 'شماره موبایل معتبر وارد کنید')]
    )
    
    # Verification
    is_verified = models.BooleanField(default=False, verbose_name='تایید شده')
    
    # Profile info
    first_name_fa = models.CharField(max_length=30, blank=True, verbose_name='نام فارسی')
    last_name_fa = models.CharField(max_length=30, blank=True, verbose_name='نام خانوادگی فارسی')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, verbose_name='درباره من')
    
    # Location
    city = models.CharField(max_length=50, blank=True, verbose_name='شهر')
    country = models.CharField(max_length=50, default='Iran', verbose_name='کشور')
    
    # Verification codes
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_expires = models.DateTimeField(blank=True, null=True)
    
    # Password reset
    reset_code = models.CharField(max_length=6, blank=True, null=True)
    reset_expires = models.DateTimeField(blank=True, null=True)
    
    # Security
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True)
    backup_codes = models.JSONField(default=list, blank=True)  # Fixed: Use models.JSONField
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    # Activity tracking
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Additional info
    created_at = models.DateTimeField(auto_now_add=True)
    
    # JSON field for flexible data
    metadata = models.JSONField(default=dict, blank=True)  # Fixed: Use models.JSONField
    
    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['username', 'email']),
        ]
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
    
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
    """مدل دستگاه ESP32"""
    
    STATUS_CHOICES = [
        ('pending', 'در حال بررسی'),
        ('approved', 'تایید شده'),
        ('rejected', 'رد شده'),
        ('suspended', 'معلق شده'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100, verbose_name='نام دستگاه')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    # Device info
    mac_address = models.CharField(max_length=17, unique=True, verbose_name='MAC Address')
    chip_id = models.CharField(max_length=50, blank=True, verbose_name='Chip ID')
    firmware_version = models.CharField(max_length=20, blank=True)
    
    # Location
    location = models.CharField(max_length=200, blank=True, verbose_name='مکان')
    
    # Status and connection
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_online = models.BooleanField(default=False, verbose_name='آنلاین')
    last_seen = models.DateTimeField(null=True, blank=True, verbose_name='آخرین اتصال')
    
    # Network info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    wifi_ssid = models.CharField(max_length=32, blank=True)
    wifi_rssi = models.IntegerField(null=True, blank=True, verbose_name='قدرت سیگنال')
    
    # API and security
    api_key = models.CharField(max_length=64, unique=True, blank=True)
    api_secret = models.CharField(max_length=128, blank=True)
    last_api_call = models.DateTimeField(null=True, blank=True)
    api_call_count = models.IntegerField(default=0)
    
    # Settings and configuration
    config = models.JSONField(default=dict, blank=True, verbose_name='تنظیمات')  # Fixed
    features = models.JSONField(default=list, blank=True, verbose_name='ویژگی‌ها')  # Fixed
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Admin info
    approved_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_devices'
    )
    rejection_reason = models.TextField(blank=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)  # Fixed
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'is_online']),
            models.Index(fields=['last_seen']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'دستگاه ESP32'
        verbose_name_plural = 'دستگاه‌های ESP32'
    
    def save(self, *args, **kwargs):
        if not self.api_key:
            self.generate_api_key()
        if not self.api_secret:
            self.generate_api_secret()
        super().save(*args, **kwargs)
    
    def generate_api_key(self):
        """تولید کلید API منحصر به فرد"""
        while True:
            key = secrets.token_urlsafe(32)
            if not ESP32Device.objects.filter(api_key=key).exists():
                self.api_key = key
                break
    
    def generate_api_secret(self):
        """تولید رمز API"""
        self.api_secret = secrets.token_urlsafe(64)
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"

class DeviceCommand(models.Model):
    """دستورات ارسالی به دستگاه"""
    
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('sent', 'ارسال شده'),
        ('executed', 'اجرا شده'),
        ('failed', 'ناموفق'),
        ('timeout', 'انقضای زمان'),
    ]
    
    COMMAND_TYPES = [
        ('reboot', 'راه‌اندازی مجدد'),
        ('update_config', 'بروزرسانی تنظیمات'),
        ('led_control', 'کنترل LED'),
        ('sensor_read', 'خواندن سنسور'),
        ('custom', 'دستور سفارشی'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(ESP32Device, on_delete=models.CASCADE, related_name='commands')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='device_commands')
    
    # Command details
    command_type = models.CharField(max_length=20, choices=COMMAND_TYPES)
    command_data = models.JSONField(default=dict, blank=True)  # Fixed
    description = models.TextField(blank=True)
    
    # Status and timing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.IntegerField(default=1)
    
    # Response
    response_data = models.JSONField(default=dict, blank=True)  # Fixed
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'accounts_device_command'
        indexes = [
            models.Index(fields=['device', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
        ordering = ['-created_at']
        verbose_name = 'دستور دستگاه'
        verbose_name_plural = 'دستورات دستگاه'
    
    def __str__(self):
        return f"{self.get_command_type_display()} - {self.device.name}"

class UserProfile(models.Model):
    """پروفایل تکمیلی کاربر"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    
    # Professional info
    company = models.CharField(max_length=100, blank=True, verbose_name='شرکت')
    job_title = models.CharField(max_length=100, blank=True, verbose_name='عنوان شغلی')
    
    # Social links
    github_username = models.CharField(max_length=50, blank=True)
    linkedin_url = models.URLField(blank=True)
    
    # Preferences
    newsletter_subscription = models.BooleanField(default=True, verbose_name='عضویت در خبرنامه')
    marketing_emails = models.BooleanField(default=False, verbose_name='ایمیل‌های تبلیغاتی')
    
    # Privacy
    show_email = models.BooleanField(default=False, verbose_name='نمایش ایمیل')
    public_profile = models.BooleanField(default=True, verbose_name='پروفایل عمومی')
    
    # Statistics
    profile_views = models.IntegerField(default=0)
    
    # Additional data
    extra_data = models.JSONField(default=dict, blank=True)  # Fixed
    
    class Meta:
        db_table = 'accounts_user_profile'
        verbose_name = 'پروفایل کاربر'
        verbose_name_plural = 'پروفایل‌های کاربران'
    
    def __str__(self):
        return f"Profile of {self.user.username}"

class SecurityEvent(models.Model):
    """رویدادهای امنیتی"""
    EVENT_TYPES = [
        ('password_change', 'تغییر رمز عبور'),
        ('email_change', 'تغییر ایمیل'),
        ('suspicious_login', 'ورود مشکوک'),
        ('account_locked', 'قفل حساب'),
        ('api_key_generated', 'تولید کلید API'),
    ]
    
    RISK_LEVELS = [
        ('low', 'کم'),
        ('medium', 'متوسط'),
        ('high', 'زیاد'),
        ('critical', 'بحرانی'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='security_events')
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    risk_level = models.CharField(max_length=10, choices=RISK_LEVELS, default='low')
    
    # Event details
    description = models.TextField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    # Additional context
    context_data = models.JSONField(default=dict, blank=True)  # Fixed
    
    # Status
    resolved = models.BooleanField(default=False)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'accounts_security_event'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
        ]
        ordering = ['-timestamp']
        verbose_name = 'رویداد امنیتی'
        verbose_name_plural = 'رویدادهای امنیتی'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_event_type_display()}"

# این کد را به انتهای فایل accounts/models.py اضافه کنید

class LoginHistory(models.Model):
    """تاریخچه ورود کاربران"""
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField(verbose_name='آدرس IP')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')
    
    # Location info
    country = models.CharField(max_length=100, blank=True, verbose_name='کشور')
    city = models.CharField(max_length=100, blank=True, verbose_name='شهر')
    
    # Login details
    success = models.BooleanField(default=True, verbose_name='موفق')
    failure_reason = models.CharField(max_length=100, blank=True, verbose_name='دلیل عدم موفقیت')
    
    # Session info
    session_key = models.CharField(max_length=40, blank=True, verbose_name='کلید جلسه')
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='زمان')
    logout_time = models.DateTimeField(null=True, blank=True, verbose_name='زمان خروج')
    
    # Additional context
    context_data = models.JSONField(default=dict, blank=True, verbose_name='اطلاعات اضافی')
    
    class Meta:
        db_table = 'accounts_login_history'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
            models.Index(fields=['success', 'timestamp']),
        ]
        ordering = ['-timestamp']
        verbose_name = 'تاریخچه ورود'
        verbose_name_plural = 'تاریخچه ورودها'
    
    def __str__(self):
        status = "موفق" if self.success else "ناموفق"
        return f"{self.user.username} - {status} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
