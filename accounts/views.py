from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .forms import *
from .models import EmailVerification, PasswordReset, User
from .utils import send_verification_email, send_password_reset_email

def check_username(request):
    """بررسی AJAX برای در دسترس بودن نام کاربری"""
    username = request.GET.get('username', '')
    if username:
        # بررسی قوانین نام کاربری
        if username[0].isdigit():
            return JsonResponse({
                'available': False,
                'message': 'نام کاربری نمی‌تواند با عدد شروع شود'
            })
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return JsonResponse({
                'available': False,
                'message': 'فقط حروف انگلیسی، اعداد و _ مجاز است'
            })
        if len(username) < 4:
            return JsonResponse({
                'available': False,
                'message': 'حداقل 4 کاراکتر'
            })
        
        exists = User.objects.filter(username=username).exists()
        return JsonResponse({
            'available': not exists,
            'message': 'این نام کاربری قبلاً ثبت شده' if exists else 'نام کاربری در دسترس است'
        })
    return JsonResponse({'available': False, 'message': 'نام کاربری را وارد کنید'})

def signup_view(request):
    if request.user.is_authenticated:
        return redirect('devices:dashboard')
    
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False  # تا زمان تایید ایمیل
            user.save()
            
            # ارسال ایمیل تایید
            verification = EmailVerification.objects.create(user=user)
            send_verification_email(user, verification.code)
            
            request.session['pending_user_id'] = user.id
            messages.success(request, 'کد تایید به ایمیل شما ارسال شد')
            return redirect('accounts:verify_email')
    else:
        form = SignUpForm()
    
    return render(request, 'accounts/signup.html', {'form': form})

def verify_email_view(request):
    user_id = request.session.get('pending_user_id')
    if not user_id:
        return redirect('accounts:signup')
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return redirect('accounts:signup')
    
    if request.method == 'POST':
        form = EmailVerificationForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            verification = EmailVerification.objects.filter(
                user=user,
                code=code,
                is_used=False
            ).first()
            
            if verification and verification.is_valid():
                verification.is_used = True
                verification.save()
                
                user.is_active = True
                user.is_email_verified = True
                user.save()
                
                login(request, user)
                messages.success(request, 'ثبت نام با موفقیت انجام شد')
                return redirect('devices:dashboard')
            else:
                messages.error(request, 'کد تایید نامعتبر یا منقضی شده است')
    else:
        form = EmailVerificationForm()
    
    return render(request, 'accounts/verify_email.html', {
        'form': form,
        'email': user.email
    })

def login_view(request):
    if request.user.is_authenticated:
        if request.user.is_superuser:
            return redirect('devices:admin_dashboard')
        return redirect('devices:dashboard')
    
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username_or_email = form.cleaned_data['username_or_email']
            password = form.cleaned_data['password']
            
            # پیدا کردن کاربر با username یا email
            user = User.objects.filter(
                Q(username=username_or_email) | Q(email=username_or_email)
            ).first()
            
            if user and user.check_password(password):
                if not user.is_active:
                    messages.error(request, 'حساب کاربری شما فعال نیست')
                else:
                    login(request, user)
                    if user.is_superuser:
                        return redirect('devices:admin_dashboard')
                    return redirect('devices:dashboard')
            else:
                messages.error(request, 'نام کاربری یا رمز عبور اشتباه است')
    else:
        form = LoginForm()
    
    return render(request, 'accounts/login.html', {'form': form})

def logout_view(request):
    logout(request)
    messages.success(request, 'با موفقیت خارج شدید')
    return redirect('home')

def forgot_password_view(request):
    if request.method == 'POST':
        form = ForgotPasswordForm(request.POST)
        if form.is_valid():
            username_or_email = form.cleaned_data['username_or_email']
            
            user = User.objects.filter(
                Q(username=username_or_email) | Q(email=username_or_email)
            ).first()
            
            if user:
                # ایجاد کد بازیابی
                reset = PasswordReset.objects.create(user=user)
                send_password_reset_email(user, reset.code)
                
                request.session['reset_user_id'] = user.id
                messages.success(request, 'کد بازیابی به ایمیل شما ارسال شد')
                return redirect('accounts:reset_password')
            else:
                messages.error(request, 'کاربری با این مشخصات یافت نشد')
    else:
        form = ForgotPasswordForm()
    
    return render(request, 'accounts/forgot_password.html', {'form': form})

def reset_password_view(request):
    user_id = request.session.get('reset_user_id')
    if not user_id:
        return redirect('accounts:forgot_password')
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return redirect('accounts:forgot_password')
    
    if request.method == 'POST':
        # ابتدا کد را بررسی می‌کنیم
        code = request.POST.get('code')
        if code:
            reset = PasswordReset.objects.filter(
                user=user,
                code=code,
                is_used=False
            ).first()
            
            if reset and reset.is_valid():
                request.session['reset_verified'] = True
                return render(request, 'accounts/reset_password.html', {
                    'form': ResetPasswordForm(),
                    'code_verified': True
                })
            else:
                messages.error(request, 'کد نامعتبر یا منقضی شده است')
                return redirect('accounts:forgot_password')
        
        # اگر کد تایید شده، رمز جدید را ست می‌کنیم
        elif request.session.get('reset_verified'):
            form = ResetPasswordForm(request.POST)
            if form.is_valid():
                user.set_password(form.cleaned_data['password'])
                user.save()
                
                # غیرفعال کردن کد
                PasswordReset.objects.filter(user=user, is_used=False).update(is_used=True)
                
                # پاک کردن session
                request.session.pop('reset_user_id', None)
                request.session.pop('reset_verified', None)
                
                login(request, user)
                messages.success(request, 'رمز عبور با موفقیت تغییر کرد')
                return redirect('devices:dashboard')
    
    return render(request, 'accounts/reset_password.html', {
        'email': user.email,
        'code_verified': request.session.get('reset_verified', False)
    })

def resend_code(request):
    """ارسال مجدد کد تایید"""
    if request.method == 'POST':
        user_id = request.session.get('pending_user_id') or request.session.get('reset_user_id')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                
                if 'pending_user_id' in request.session:
                    verification = EmailVerification.objects.create(user=user)
                    send_verification_email(user, verification.code)
                else:
                    reset = PasswordReset.objects.create(user=user)
                    send_password_reset_email(user, reset.code)
                
                return JsonResponse({'success': True, 'message': 'کد جدید ارسال شد'})
            except User.DoesNotExist:
                pass
    
    return JsonResponse({'success': False, 'message': 'خطا در ارسال کد'})