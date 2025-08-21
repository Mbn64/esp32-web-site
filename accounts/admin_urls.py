# accounts/admin_urls.py
from django.urls import path
from . import admin_api

admin_api_patterns = [
    # Dashboard APIs
    path('api/dashboard-data/', admin_api.dashboard_data_api, name='admin_dashboard_data_api'),
    path('api/pending-requests/', admin_api.pending_requests_api, name='admin_pending_requests_api'),
    path('api/users-list/', admin_api.users_list_api, name='admin_users_list_api'),
    path('api/system-health/', admin_api.system_health_api, name='admin_system_health_api'),
    
    # Device Management APIs
    path('api/approve/<uuid:device_id>/', admin_api.approve_device_api, name='admin_approve_device_api'),
    path('api/reject/<uuid:device_id>/', admin_api.reject_device_api, name='admin_reject_device_api'),
    path('api/device/<uuid:device_id>/details/', admin_api.device_details_api, name='admin_device_details_api'),
    path('api/device/<uuid:device_id>/toggle/', admin_api.toggle_device_status_api, name='admin_toggle_device_api'),
    path('api/device/<uuid:device_id>/delete/', admin_api.delete_device_api, name='admin_delete_device_api'),
    
    # User Management APIs
    path('api/user/<int:user_id>/details/', admin_api.user_details_api, name='admin_user_details_api'),
    path('api/user/<int:user_id>/ban/', admin_api.ban_user_api, name='admin_ban_user_api'),
    path('api/user/<int:user_id>/unban/', admin_api.unban_user_api, name='admin_unban_user_api'),
    
    # System Management APIs
    path('api/save-settings/', admin_api.save_settings_api, name='admin_save_settings_api'),
    
    # Export APIs
    path('api/export/users/', admin_api.export_users_api, name='admin_export_users_api'),
    path('api/export/devices/', admin_api.export_devices_api, name='admin_export_devices_api'),
]

