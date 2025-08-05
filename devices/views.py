from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db.models import Q, Count
from django.utils import timezone
from django.core.paginator import Paginator
from .models import ESP32Device, DeviceLog, DeviceRequest
from .forms import DeviceForm, DeviceActionForm
from accounts.utils import send_device_status_email

def is_admin(user):
    return user.is_superuser

@login_required
def dashboard(request):
    """داشبورد کاربر عادی"""
    devices = request.user.devices.all()
    pending_count = devices.filter(status='pending').count()
    approved_count = devices.filter(status='approved').count()
    online_count = devices.filter(status='approved', is_online=True).count()
    
    context = {
        'devices': devices,
        'pending_count': pending_count,
        'approved_count': approved_count,
        'online_count': online_count,
    }
    return render(request, 'devices/dashboard.html', context)

@login_required
def add_device(request):
    """افزودن دستگاه جدید"""
    if request.method == 'POST':
        form = DeviceForm(request.POST)
        if form.is_valid():
            device = form.save(commit=False)
            device.user = request.user
            device.save()
            
            # ثبت درخواست
            DeviceRequest.objects.create(
                user=request.user,
                device=device,
                action='create'
            )
            
            messages.success(request, 'درخواست شما ثبت شد و در انتظار بررسی است')
            return redirect('devices:dashboard')
    else:
        form = DeviceForm()
    
    return render(request, 'devices/add_device.html', {'form': form})

@login_required
def device_control(request, device_id):
    """صفحه کنترل دستگاه"""
    device = get_object_or_404(ESP32Device, id=device_id, user=request.user)
    
    if device.status != 'approved':
        messages.error(request, 'این دستگاه هنوز تایید نشده است')
        return redirect('devices:dashboard')
    
    # ثبت لاگ بازدید
    DeviceLog.objects.create(
        device=device,
        action='view_control',
        details={'user_id': request.user.id}
    )
    
    return render(request, 'devices/device_control.html', {'device': device})

@login_required
def delete_device(request, device_id):
    """حذف دستگاه"""
    device = get_object_or_404(ESP32Device, id=device_id, user=request.user)
    
    if request.method == 'POST':
        # ثبت درخواست حذف
        DeviceRequest.objects.create(
            user=request.user,
            device=device,
            action='delete'
        )
        
        device_name = device.name
        device.delete()
        
        messages.success(request, f'دستگاه {device_name} با موفقیت حذف شد')
        return redirect('devices:dashboard')
    
    return render(request, 'devices/confirm_delete.html', {'device': device})

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    """داشبورد ادمین"""
    # آمار کلی
    total_users = User.objects.filter(is_superuser=False).count()
    total_devices = ESP32Device.objects.count()
    pending_devices = ESP32Device.objects.filter(status='pending').count()
    online_devices = ESP32Device.objects.filter(status='approved', is_online=True).count()
    
    # درخواست‌های در انتظار
    pending_requests = ESP32Device.objects.filter(status='pending').select_related('user')[:5]
    
    # آخرین فعالیت‌ها
    recent_logs = DeviceLog.objects.select_related('device', 'device__user')[:10]
    
    context = {
        'total_users': total_users,
        'total_devices': total_devices,
        'pending_devices': pending_devices,
        'online_devices': online_devices,
        'pending_requests': pending_requests,
        'recent_logs': recent_logs,
    }
    return render(request, 'devices/admin_dashboard.html', context)

@login_required
@user_passes_test(is_admin)
def admin_requests(request):
    """مدیریت درخواست‌ها"""
    status_filter = request.GET.get('status', 'all')
    sort_by = request.GET.get('sort', '-created_at')
    
    devices = ESP32Device.objects.select_related('user')
    
    if status_filter != 'all':
        devices = devices.filter(status=status_filter)
    
    devices = devices.order_by(sort_by)
    
    # صفحه‌بندی
    paginator = Paginator(devices, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'status_filter': status_filter,
        'sort_by': sort_by,
    }
    return render(request, 'devices/admin_requests.html', context)

@login_required
@user_passes_test(is_admin)
def admin_device_action(request, device_id):
    """تایید یا رد درخواست"""
    device = get_object_or_404(ESP32Device, id=device_id)
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'approve':
            device.status = 'approved'
            device.approved_at = timezone.now()
            device.save()
            
            # ارسال ایمیل به کاربر
            send_device_status_email(device, 'approved')
            
            messages.success(request, f'دستگاه {device.name} تایید شد')
            
        elif action == 'reject':
            reason = request.POST.get('reason', '')
            device.status = 'rejected'
            device.rejection_reason = reason
            device.save()
            
            # ارسال ایمیل به کاربر
            send_device_status_email(device, 'rejected', reason)
            
            messages.warning(request, f'دستگاه {device.name} رد شد')
        
        return redirect('devices:admin_requests')
    
    # محاسبه آمار کاربر
    user_stats = {
        'total_devices': device.user.devices.count(),
        'approved_devices': device.user.devices.filter(status='approved').count(),
        'rejected_devices': device.user.devices.filter(status='rejected').count(),
        'join_date': device.user.created_at,
        'last_request': device.user.devices.latest('created_at').created_at if device.user.devices.exists() else None,
    }
    
    context = {
        'device': device,
        'user_stats': user_stats,
    }
    return render(request, 'devices/admin_device_action.html', context)

@login_required
@user_passes_test(is_admin)
def admin_users(request):
    """مدیریت کاربران"""
    search_query = request.GET.get('search', '')
    
    users = User.objects.filter(is_superuser=False).annotate(
        device_count=Count('devices'),
        active_device_count=Count('devices', filter=Q(devices__status='approved'))
    )
    
    if search_query:
        users = users.filter(
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query)
        )
    
    # صفحه‌بندی
    paginator = Paginator(users, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_query': search_query,
    }
    return render(request, 'devices/admin_users.html', context)

@login_required
@user_passes_test(is_admin)
def admin_user_detail(request, user_id):
    """جزئیات کاربر"""
    user = get_object_or_404(User, id=user_id, is_superuser=False)
    devices = user.devices.all()
    
    if request.method == 'POST':
        device_id = request.POST.get('device_id')
        action = request.POST.get('action')
        
        if device_id and action == 'disable':
            device = get_object_or_404(ESP32Device, id=device_id, user=user)
            device.status = 'rejected'
            device.rejection_reason = 'غیرفعال شده توسط ادمین'
            device.save()
            
            messages.warning(request, f'دستگاه {device.name} غیرفعال شد')
            return redirect('devices:admin_user_detail', user_id=user_id)
    
    context = {
        'user_detail': user,
        'devices': devices,
    }
    return render(request, 'devices/admin_user_detail.html', context)

# API endpoints برای WebSocket
@login_required
@require_http_methods(['POST'])
def device_command(request, device_id):
    """ارسال دستور به دستگاه"""
    device = get_object_or_404(ESP32Device, id=device_id, user=request.user, status='approved')
    
    command = request.POST.get('command')
    if command in ['ON', 'OFF', 'TOGGLE']:
        # اینجا باید به WebSocket ارسال شود
        # فعلاً فقط لاگ می‌کنیم
        DeviceLog.objects.create(
            device=device,
            action='command',
            details={'command': command, 'user_id': request.user.id}
        )
        
        return JsonResponse({'success': True, 'message': 'دستور ارسال شد'})
    
    return JsonResponse({'success': False, 'message': 'دستور نامعتبر'})

@require_http_methods(['GET'])
def device_status(request, api_key):
    """دریافت وضعیت دستگاه برای ESP32"""
    device = get_object_or_404(ESP32Device, api_key=api_key, status='approved')
    
    return JsonResponse({
        'device_id': device.id,
        'name': device.name,
        'is_online': device.is_online,
        'commands': []  # دستورات در انتظار
    })