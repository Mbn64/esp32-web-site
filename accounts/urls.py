from django.urls import path
from . import views

urlpatterns = [
    # صفحه اصلی
    path('', views.home, name='home'),
    
    # احراز هویت کاربران
    path('signup/', views.signup_view, name='signup'),
    path('verify-email/', views.verify_email_view, name='verify_email'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('reset-password/', views.reset_password_view, name='reset_password'),
    
    # داشبورد کاربر
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('add-device/', views.add_device_view, name='add_device'),
    path('delete-device/<int:device_id>/', views.delete_device_view, name='delete_device'),
    path('control/<int:device_id>/', views.control_device_view, name='control_device'),
    
    # AJAX
    path('ajax/check-username/', views.check_username_availability, name='check_username'),
    
    # ادمین
    path('admin-dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    path('admin/approve/<int:device_id>/', views.admin_approve_device, name='admin_approve_device'),
    path('admin/reject/<int:device_id>/', views.admin_reject_device, name='admin_reject_device'),
]
