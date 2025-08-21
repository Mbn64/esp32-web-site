# accounts/urls.py - اضافه کردن admin API URLs
from django.urls import path, include
from . import views
from .admin_urls import admin_api_patterns

urlpatterns = [
    # صفحه اصلی
    path('', views.home, name='home'),

    # احراز هویت کاربران
    path('signup/', views.signup_view, name='signup'),
    path('verify-email/', views.verify_email_view, name='verify_email'),
    path('resend-verification/', views.resend_verification_view, name='resend_verification'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('reset-password/', views.reset_password_view, name='reset_password'),

    # داشبورد کاربر
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('add-device/', views.add_device_view, name='add_device'),
    path('delete-device/<uuid:device_id>/', views.delete_device_view, name='delete_device'),
    path('control/<uuid:device_id>/', views.control_device_view, name='control_device'),

    # AJAX
    path('ajax/check-username/', views.check_username_availability, name='check_username'),

    # ادمین - داشبورد اصلی
    path('admin/', views.admin_dashboard_view, name='admin_dashboard'),
    path('admin/approve/<uuid:device_id>/', views.admin_approve_device, name='admin_approve_device'),
    path('admin/reject/<uuid:device_id>/', views.admin_reject_device, name='admin_reject_device'),

    # ادمین - مدیریت کاربران
    path('admin/users/', views.admin_users_view, name='admin_users'),
    path('admin/user/<int:user_id>/', views.admin_user_detail, name='admin_user_detail'),
    path('admin/user/<int:user_id>/ban/', views.admin_ban_user, name='admin_ban_user'),
    path('admin/user/<int:user_id>/unban/', views.admin_unban_user, name='admin_unban_user'),

    # ادمین - مدیریت دستگاه‌ها
    path('admin/devices/', views.admin_devices_view, name='admin_devices'),
    path('admin/devices/<uuid:device_id>/delete/', views.admin_delete_device, name='admin_delete_device'),
    path('admin/devices/<uuid:device_id>/toggle/', views.admin_toggle_device_status, name='admin_toggle_device_status'),
    path('admin/devices/<uuid:device_id>/control/', views.admin_control_device, name='admin_control_device'),

    # ادمین API Endpoints
    path('admin/', include(admin_api_patterns)),
]

