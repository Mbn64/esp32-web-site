from django.urls import path
from . import views

urlpatterns = [
    path('device/status/', views.device_status, name='device_status'),
    path('device/commands/', views.device_commands, name='device_commands'),
    path('device/confirm/', views.device_confirm, name='device_confirm'),
    path('device/<uuid:device_id>/control/', views.device_control, name='device_control'),
    path('device/<uuid:device_id>/status/', views.device_status_view, name='device_status_view'),
]
