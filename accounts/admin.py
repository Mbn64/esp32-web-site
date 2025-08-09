from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import CustomUser, ESP32Device

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'verification_status', 'device_count', 'is_active', 'date_joined')
    list_filter = ('is_verified', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('اطلاعات تایید', {
            'fields': ('is_verified', 'verification_code', 'verification_expires')
        }),
        ('اطلاعات اتصال', {
            'fields': ('last_login_ip',)
        }),
        ('کدهای بازیابی', {
            'fields': ('reset_code', 'reset_expires'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('verification_expires', 'reset_expires', 'last_login_ip')
    
    def verification_status(self, obj):
        if obj.is_verified:
            return format_html('<span style="color: green;">✅ تایید شده</span>')
        else:
            return format_html('<span style="color: orange;">⏳ در انتظار تایید</span>')
    verification_status.short_description = 'وضعیت تایید'
    
    def device_count(self, obj):
        count = obj.devices.count()
        if count > 0:
            return format_html(f'<span style="color: blue;">{count} دستگاه</span>')
        return '0 دستگاه'
    device_count.short_description = 'تعداد دستگاه'

@admin.register(ESP32Device)
class ESP32DeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'user_link', 'status_badge', 'connection_status', 'created_at', 'last_seen')
    list_filter = ('status', 'is_online', 'created_at', 'approved_at')
    search_fields = ('name', 'user__username', 'user__email', 'api_key')
    ordering = ('-created_at',)
    readonly_fields = ('api_key', 'created_at', 'updated_at', 'last_seen', 'ip_address')
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('name', 'user', 'status')
        }),
        ('API و امنیت', {
            'fields': ('api_key',),
            'classes': ('collapse',)
        }),
        ('وضعیت و رد', {
            'fields': ('rejection_reason',)
        }),
        ('اطلاعات اتصال', {
            'fields': ('is_online', 'last_seen', 'ip_address'),
            'classes': ('collapse',)
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'approved_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_devices', 'reject_devices', 'suspend_devices', 'generate_new_api_keys']
    
    def user_link(self, obj):
        return format_html(
            '<a href="/admin/accounts/customuser/{}/change/">{}</a>',
            obj.user.id, obj.user.username
        )
    user_link.short_description = 'کاربر'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#ffc107',
            'approved': '#28a745',
            'rejected': '#dc3545',
            'suspended': '#6c757d'
        }
        labels = {
            'pending': 'در انتظار',
            'approved': 'تایید شده',
            'rejected': 'رد شده',
            'suspended': 'معلق'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">● {}</span>',
            colors.get(obj.status, '#000'),
            labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'وضعیت'
    
    def connection_status(self, obj):
        if obj.is_online:
            return format_html('<span style="color: green;">🟢 آنلاین</span>')
        else:
            return format_html('<span style="color: gray;">🔴 آفلاین</span>')
    connection_status.short_description = 'اتصال'
    
    def approve_devices(self, request, queryset):
        for device in queryset:
            device.status = 'approved'
            device.generate_api_key()
            device.save()
        count = queryset.count()
        self.message_user(request, f'{count} دستگاه تایید شد و API Key تولید شد.')
    approve_devices.short_description = "✅ تایید دستگاه‌های انتخاب شده"
    
    def reject_devices(self, request, queryset):
        updated = queryset.update(status='rejected', rejection_reason='رد شده توسط ادمین')
        self.message_user(request, f'{updated} دستگاه رد شد.')
    reject_devices.short_description = "❌ رد دستگاه‌های انتخاب شده"
    
    def suspend_devices(self, request, queryset):
        updated = queryset.update(status='suspended')
        self.message_user(request, f'{updated} دستگاه معلق شد.')
    suspend_devices.short_description = "⏸️ معلق کردن دستگاه‌های انتخاب شده"
    
    def generate_new_api_keys(self, request, queryset):
        for device in queryset.filter(status='approved'):
            device.generate_api_key()
        count = queryset.filter(status='approved').count()
        self.message_user(request, f'API Key جدید برای {count} دستگاه تولید شد.')
    generate_new_api_keys.short_description = "🔑 تولید API Key جدید"

# Customize Admin Site
admin.site.site_header = "مدیریت MBN13.ir"
admin.site.site_title = "MBN13 Admin"
admin.site.index_title = "پنل مدیریت سیستم ESP32"
