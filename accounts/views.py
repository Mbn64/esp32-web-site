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


def home(request):
    """صفحه اصلی"""
    return render(request, 'home.html')


def signup_view(request):
    """ثبت نام کاربر جدید"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password1'])
            user.save()
            
            # ارسال کد تایید
            if send_verification_email(user):
                request.session['verification_user_id'] = user.id
                messages.success(request, 'کد تایید به ایمیل شما ارسال شد')
                return redirect('verify_email')
            else:
                user.delete()
                messages.error(request, 'خطا در ارسال ایمیل. لطفاً دوباره تلاش کنید')
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
    
    return render(request, 'accounts/verify_email.html', {
        'form': form,
        'user': user
    })


def login_view(request):
    """ورود کاربر"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            
            # بررسی اگر ادمین است
            if username == settings.ADMIN_USERNAME:
                user = authenticate(request, username=username, password=form.cleaned_data['password'])
                if user and user.is_superuser:
                    login(request, user)
                    return redirect('admin_dashboard')
            
            # ورود کاربر عادی
            user = form.get_user()
            if user and user.is_verified:
                login(request, user)
                messages.success(request, f'خوش آمدید {user.username}!')
                return redirect('dashboard')
            elif user and not user.is_verified:
                request.session['verification_user_id'] = user.id
                send_verification_email(user)
                messages.warning(request, 'حساب شما تایید نشده. کد تایید جدید ارسال شد')
                return redirect('verify_email')
        else:
            messages.error(request, 'نام کاربری یا رمز عبور اشتباه است')
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
