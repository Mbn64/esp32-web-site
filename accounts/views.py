from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.conf import settings
import json

from .models import CustomUser, ESP32Device
from .forms import (
    SignupForm, VerificationForm, LoginForm, 
    ForgotPasswordForm, ResetPasswordForm, ESP32DeviceForm
)
from .utils import send_verification_email, send_reset_email, send_device_status_email
from django.db.models import Q, Count
from django.core.paginator import Paginator
from django.contrib.auth import get_user_model

from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.core.paginator import Paginator
from datetime import datetime

def home(request):
    """صفحه اصلی"""
    return render(request, 'home.html')


def signup_view(request):
    """ثبت نام کاربر جدید - همیشه نیاز به تایید ایمیل"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            try:
                user = form.save(commit=False)
                user.set_password(form.cleaned_data['password1'])
                user.is_verified = False  # همیشه باید تایید شود
                user.save()
                
                # ارسال کد تایید
                if send_verification_email(user):
                    request.session['verification_user_id'] = user.id
                    messages.success(request, 'کد تایید به ایمیل شما ارسال شد')
                    return redirect('verify_email')
                else:
                    user.delete()
                    messages.error(request, 'خطا در ارسال ایمیل. لطفاً دوباره تلاش کنید')
            except Exception as e:
                messages.error(request, f'خطا در ثبت نام: {str(e)}')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{error}')
    else:
        form = SignupForm()
    
    return render(request, 'accounts/signup.html', {'form': form})


def verify_email_view(request):
    """تایید ایمیل با کد 6 رقمی"""
    user_id = request.session.get('verification_user_id')
    if not user_id:
        messages.error(request, 'جلسه منقضی شده. دوباره ثبت نام کنید')
        return redirect('signup')
    
    user = get_object_or_404(CustomUser, id=user_id)
    
    if request.method == 'POST':
        form = VerificationForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            
            if user.is_verification_code_valid(code):
                user.is_verified = True
                user.clear_verification_code()
                login(request, user)
                del request.session['verification_user_id']
                
                messages.success(request, f'خوش آمدید {user.username}! حساب شما با موفقیت فعال شد')
                return redirect('dashboard')
            else:
                messages.error(request, 'کد تایید نامعتبر یا منقضی شده است')
    else:
        form = VerificationForm()
    
    # اضافه کردن دکمه ارسال مجدد
    context = {
        'form': form,
        'user': user,
        'can_resend': True
    }
    
    return render(request, 'accounts/verify_email.html', context)


def resend_verification_view(request):
    """ارسال مجدد کد تایید"""
    user_id = request.session.get('verification_user_id')
    if not user_id:
        messages.error(request, 'جلسه منقضی شده')
        return redirect('signup')
    
    user = get_object_or_404(CustomUser, id=user_id)
    
    if send_verification_email(user):
        messages.success(request, 'کد تایید جدید ارسال شد')
    else:
        messages.error(request, 'خطا در ارسال ایمیل')
    
    return redirect('verify_email')


def login_view(request):
    """ورود کاربر"""
    if request.user.is_authenticated:
        if request.user.is_superuser:
            return redirect('admin_dashboard')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            
            # Try to authenticate user
            user = authenticate(request, username=username, password=password)
            
            if user:
                # اگر سوپریوزر است، بدون تایید ایمیل وارد شود
                if user.is_superuser:
                    login(request, user)
                    messages.success(request, f'خوش آمدید ادمین!')
                    return redirect('admin_dashboard')
                # اگر کاربر عادی است و تایید شده
                elif user.is_verified:
                    login(request, user)
                    messages.success(request, f'خوش آمدید {user.username}!')
                    return redirect('dashboard')
                # اگر کاربر عادی است اما تایید نشده
                else:
                    request.session['verification_user_id'] = user.id
                    messages.warning(request, 'حساب شما تایید نشده. کد تایید جدید ارسال می‌شود')
                    if send_verification_email(user):
                        messages.info(request, 'کد تایید به ایمیل شما ارسال شد')
                    return redirect('verify_email')
            else:
                messages.error(request, 'نام کاربری یا رمز عبور اشتباه است')
        else:
            messages.error(request, 'لطفاً اطلاعات را به درستی وارد کنید')
    else:
        form = LoginForm()
    
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    """خروج کاربر"""
    logout(request)
    messages.success(request, 'با موفقیت خارج شدید')
    return redirect('home')


def forgot_password_view(request):
    """فراموشی رمز عبور"""
    if request.method == 'POST':
        form = ForgotPasswordForm(request.POST)
        if form.is_valid():
            user = form.user
            
            if send_reset_email(user):
                request.session['reset_user_id'] = user.id
                messages.success(request, 'کد بازیابی به ایمیل شما ارسال شد')
                return redirect('reset_password')
            else:
                messages.error(request, 'خطا در ارسال ایمیل. لطفاً دوباره تلاش کنید')
    else:
        form = ForgotPasswordForm()
    
    return render(request, 'accounts/forgot_password.html', {'form': form})


def reset_password_view(request):
    """بازنشانی رمز عبور"""
    user_id = request.session.get('reset_user_id')
    if not user_id:
        messages.error(request, 'جلسه منقضی شده. دوباره درخواست بازیابی کنید')
        return redirect('forgot_password')
    
    user = get_object_or_404(CustomUser, id=user_id)
    
    if request.method == 'POST':
        form = ResetPasswordForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            
            if user.is_reset_code_valid(code):
                user.set_password(form.cleaned_data['new_password1'])
                user.clear_reset_code()
                user.save()
                
                # ورود خودکار
                login(request, user)
                del request.session['reset_user_id']
                
                messages.success(request, 'رمز عبور شما با موفقیت تغییر کرد')
                return redirect('dashboard')
            else:
                messages.error(request, 'کد بازیابی نامعتبر یا منقضی شده است')
    else:
        form = ResetPasswordForm()
    
    return render(request, 'accounts/reset_password.html', {
        'form': form,
        'user': user
    })


@login_required
def dashboard_view(request):
    """داشبورد کاربر"""
    devices = ESP32Device.objects.filter(user=request.user).order_by('-created_at')
    
    context = {
        'devices': devices,
        'pending_count': devices.filter(status='pending').count(),
        'approved_count': devices.filter(status='approved').count(),
        'rejected_count': devices.filter(status='rejected').count(),
    }
    
    return render(request, 'accounts/dashboard.html', context)


@login_required
def add_device_view(request):
    """افزودن درخواست دستگاه جدید"""
    if request.method == 'POST':
        form = ESP32DeviceForm(request.POST)
        if form.is_valid():
            device = form.save(commit=False)
            device.user = request.user
            device.save()
            
            messages.success(request, f'درخواست دستگاه "{device.name}" ثبت شد و در انتظار تایید است')
            return redirect('dashboard')
    else:
        form = ESP32DeviceForm()
    
    return render(request, 'accounts/add_device.html', {'form': form})


@login_required
def delete_device_view(request, device_id):
    """حذف دستگاه"""
    device = get_object_or_404(ESP32Device, id=device_id, user=request.user)
    
    if request.method == 'POST':
        device_name = device.name
        device.delete()
        
        messages.success(request, f'دستگاه "{device_name}" حذف شد')
        return redirect('dashboard')
    
    return render(request, 'accounts/delete_device.html', {'device': device})


@login_required
def control_device_view(request, device_id):
    """کنترل دستگاه ESP32"""
    device = get_object_or_404(
        ESP32Device, 
        id=device_id, 
        user=request.user, 
        status='approved'
    )
    
    return render(request, 'accounts/control_device.html', {'device': device})


# AJAX Views
@require_http_methods(["GET"])
def check_username_availability(request):
    """بررسی در دسترس بودن نام کاربری (AJAX)"""
    username = request.GET.get('username', '').strip()
    
    if not username:
        return JsonResponse({'available': False, 'message': 'نام کاربری وارد نشده'})
    
    # بررسی شروع با عدد
    if username[0].isdigit():
        return JsonResponse({
            'available': False, 
            'message': 'نام کاربری نمی‌تواند با عدد شروع شود'
        })
    
    # بررسی طول
    if len(username) < 3:
        return JsonResponse({
            'available': False, 
            'message': 'نام کاربری باید حداقل 3 کاراکتر باشد'
        })
    
    # بررسی یکتا بودن
    if CustomUser.objects.filter(username=username).exists():
        return JsonResponse({
            'available': False, 
            'message': 'این نام کاربری قبلاً گرفته شده'
        })
    
    return JsonResponse({
        'available': True, 
        'message': 'این نام کاربری در دسترس است ✅'
    })


# Admin Views
def is_admin(user):
    """بررسی ادمین بودن کاربر"""
    return user.is_authenticated and user.is_superuser


@user_passes_test(is_admin)
def admin_dashboard_view(request):
    """داشبورد ادمین"""
    # آمار کلی
    total_users = CustomUser.objects.count()
    total_devices = ESP32Device.objects.count()
    pending_devices = ESP32Device.objects.filter(status='pending')
    approved_devices = ESP32Device.objects.filter(status='approved')
    rejected_devices = ESP32Device.objects.filter(status='rejected')
    
    # درخواست‌های اخیر
    recent_requests = ESP32Device.objects.filter(
        status='pending'
    ).order_by('-created_at')[:10]
    
    context = {
        'total_users': total_users,
        'total_devices': total_devices,
        'pending_count': pending_devices.count(),
        'approved_count': approved_devices.count(),
        'rejected_count': rejected_devices.count(),
        'recent_requests': recent_requests,
    }
    
    return render(request, 'admin/dashboard.html', context)


@user_passes_test(is_admin)
def admin_approve_device(request, device_id):
    """تایید درخواست دستگاه"""
    device = get_object_or_404(ESP32Device, id=device_id)
    
    if request.method == 'POST':
        device.status = 'approved'
        device.approved_at = timezone.now()
        device.generate_api_key()
        device.save()
        
        # ارسال ایمیل تایید
        send_device_status_email(device.user, device, approved=True)
        
        messages.success(request, f'درخواست "{device.name}" تایید شد')
        return redirect('admin_dashboard')
    
    return render(request, 'admin/approve_device.html', {'device': device})


@user_passes_test(is_admin)
def admin_reject_device(request, device_id):
    """رد درخواست دستگاه"""
    device = get_object_or_404(ESP32Device, id=device_id)
    
    if request.method == 'POST':
        reason = request.POST.get('reason', '').strip()
        if reason:
            device.status = 'rejected'
            device.rejection_reason = reason
            device.save()
            
            # ارسال ایمیل رد
            send_device_status_email(device.user, device, approved=False, reason=reason)
            
            messages.success(request, f'درخواست "{device.name}" رد شد')
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'لطفاً دلیل رد را وارد کنید')
    
    return render(request, 'admin/reject_device.html', {'device': device})


@user_passes_test(is_admin)
def admin_dashboard_view(request):
    """داشبورد ادمین کامل"""
    # آمار کلی
    total_users = CustomUser.objects.count()
    verified_users = CustomUser.objects.filter(is_verified=True).count()
    banned_users = CustomUser.objects.filter(is_active=False).count()

    total_devices = ESP32Device.objects.count()
    pending_devices = ESP32Device.objects.filter(status='pending')
    approved_devices = ESP32Device.objects.filter(status='approved')
    rejected_devices = ESP32Device.objects.filter(status='rejected')
    online_devices = ESP32Device.objects.filter(status='approved', is_online=True)

    # درخواست‌های اخیر
    recent_requests = ESP32Device.objects.filter(
        status='pending'
    ).select_related('user').order_by('-created_at')[:10]

    # کاربران اخیر
    recent_users = CustomUser.objects.filter(
        is_superuser=False
    ).order_by('-date_joined')[:10]

    # دستگاه‌های آنلاین
    online_devices_list = ESP32Device.objects.filter(
        status='approved',
        is_online=True
    ).select_related('user').order_by('-last_seen')[:10]

    context = {
        'total_users': total_users,
        'verified_users': verified_users,
        'banned_users': banned_users,
        'total_devices': total_devices,
        'pending_count': pending_devices.count(),
        'approved_count': approved_devices.count(),
        'rejected_count': rejected_devices.count(),
        'online_count': online_devices.count(),
        'recent_requests': recent_requests,
        'recent_users': recent_users,
        'online_devices': online_devices_list,
    }

    return render(request, 'admin/dashboard.html', context)


@user_passes_test(is_admin)
def admin_users_view(request):
    """مدیریت کاربران"""
    search_query = request.GET.get('search', '')
    status_filter = request.GET.get('status', 'all')

    users = CustomUser.objects.filter(is_superuser=False).annotate(
        device_count=Count('devices')
    ).order_by('-date_joined')

    # فیلتر جستجو
    if search_query:
        users = users.filter(
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query)
        )

    # فیلتر وضعیت
    if status_filter == 'verified':
        users = users.filter(is_verified=True, is_active=True)
    elif status_filter == 'unverified':
        users = users.filter(is_verified=False)
    elif status_filter == 'banned':
        users = users.filter(is_active=False)

    # صفحه‌بندی
    paginator = Paginator(users, 20)
    page_number = request.GET.get('page')
    users_page = paginator.get_page(page_number)

    context = {
        'users': users_page,
        'search_query': search_query,
        'status_filter': status_filter,
        'total_users': users.count(),
    }

    return render(request, 'admin/users.html', context)


@user_passes_test(is_admin)
def admin_devices_view(request):
    """مدیریت دستگاه‌ها"""
    search_query = request.GET.get('search', '')
    status_filter = request.GET.get('status', 'all')

    devices = ESP32Device.objects.select_related('user').order_by('-created_at')

    # فیلتر جستجو
    if search_query:
        devices = devices.filter(
            Q(name__icontains=search_query) |
            Q(user__username__icontains=search_query)
        )

    # فیلتر وضعیت
    if status_filter != 'all':
        devices = devices.filter(status=status_filter)

    # صفحه‌بندی
    paginator = Paginator(devices, 20)
    page_number = request.GET.get('page')
    devices_page = paginator.get_page(page_number)

    context = {
        'devices': devices_page,
        'search_query': search_query,
        'status_filter': status_filter,
        'total_devices': devices.count(),
    }

    return render(request, 'admin/devices.html', context)


@user_passes_test(is_admin)
def admin_user_detail(request, user_id):
    """جزئیات کاربر"""
    user = get_object_or_404(CustomUser, id=user_id, is_superuser=False)
    devices = user.devices.all().order_by('-created_at')

    context = {
        'user': user,
        'devices': devices,
    }

    return render(request, 'admin/user_detail.html', context)


@user_passes_test(is_admin)
def admin_ban_user(request, user_id):
    """مسدود کردن کاربر"""
    if request.method == 'POST':
        user = get_object_or_404(CustomUser, id=user_id, is_superuser=False)
        user.is_active = False
        user.save()

        # غیرفعال کردن همه دستگاه‌های کاربر
        user.devices.update(status='suspended')

        messages.success(request, f'کاربر {user.username} مسدود شد')
        return redirect('admin_users')

    return redirect('admin_users')


@user_passes_test(is_admin)
def admin_unban_user(request, user_id):
    """رفع مسدودیت کاربر"""
    if request.method == 'POST':
        user = get_object_or_404(CustomUser, id=user_id, is_superuser=False)
        user.is_active = True
        user.save()

        # فعال کردن دستگاه‌های تایید شده
        user.devices.filter(status='suspended').update(status='approved')

        messages.success(request, f'مسدودیت کاربر {user.username} رفع شد')
        return redirect('admin_users')

    return redirect('admin_users')


@user_passes_test(is_admin)
def admin_delete_device(request, device_id):
    """حذف دستگاه توسط ادمین"""
    if request.method == 'POST':
        device = get_object_or_404(ESP32Device, id=device_id)
        device_name = device.name
        user_name = device.user.username
        device.delete()

        messages.success(request, f'دستگاه "{device_name}" کاربر {user_name} حذف شد')
        return redirect('admin_devices')

    return redirect('admin_devices')


@user_passes_test(is_admin)
def admin_control_device(request, device_id):
    """کنترل دستگاه توسط ادمین"""
    device = get_object_or_404(ESP32Device, id=device_id, status='approved')

    context = {
        'device': device,
        'admin_control': True,
    }

    return render(request, 'admin/control_device.html', context)


@user_passes_test(is_admin)
def admin_toggle_device_status(request, device_id):
    """تغییر وضعیت دستگاه"""
    if request.method == 'POST':
        device = get_object_or_404(ESP32Device, id=device_id)

        if device.status == 'approved':
            device.status = 'suspended'
            action = 'معلق'
        elif device.status == 'suspended':
            device.status = 'approved'
            action = 'فعال'

        device.save()
        messages.success(request, f'دستگاه "{device.name}" {action} شد')

        return redirect('admin_devices')

    return redirect('admin_devices')

# Add these missing view functions at the end of your views.py

@user_passes_test(is_admin)
def resend_verification_view(request):
    """ارسال مجدد کد تایید"""
    user_id = request.session.get('verification_user_id')
    if not user_id:
        messages.error(request, 'جلسه منقضی شده')
        return redirect('signup')

    user = get_object_or_404(CustomUser, id=user_id)

    if send_verification_email(user):
        messages.success(request, 'کد تایید جدید ارسال شد')
    else:
        messages.error(request, 'خطا در ارسال ایمیل')

    return redirect('verify_email')
