import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from datetime import timedelta

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices('0123456789', k=6))

def generate_api_key():
    """Generate a unique API key for devices"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

def send_verification_email(user_email, username, verification_code):
    """Send verification email to user"""
    subject = 'کد تایید حساب کاربری - mbn13.ir'
    
    html_message = render_to_string('accounts/emails/verification_email.html', {
        'username': username,
        'verification_code': verification_code
    })
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False

def send_password_reset_email(user_email, username, reset_code):
    """Send password reset email to user"""
    subject = 'کد بازیابی رمز عبور - mbn13.ir'
    
    html_message = render_to_string('accounts/emails/password_reset_email.html', {
        'username': username,
        'reset_code': reset_code
    })
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False

def send_device_approval_email(user_email, username, device_name, api_key):
    """Send device approval email with API key"""
    subject = f'تایید دستگاه {device_name} - mbn13.ir'
    
    html_message = render_to_string('accounts/emails/device_approval_email.html', {
        'username': username,
        'device_name': device_name,
        'api_key': api_key
    })
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending device approval email: {e}")
        return False

def send_device_rejection_email(user_email, username, device_name, reason):
    """Send device rejection email with reason"""
    subject = f'رد درخواست دستگاه {device_name} - mbn13.ir'
    
    html_message = render_to_string('accounts/emails/device_rejection_email.html', {
        'username': username,
        'device_name': device_name,
        'reason': reason
    })
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending device rejection email: {e}")
        return False

def is_code_expired(created_time, expiry_minutes=15):
    """Check if verification code is expired"""
    if not created_time:
        return True
    
    expiry_time = created_time + timedelta(minutes=expiry_minutes)
    return timezone.now() > expiry_time

def format_persian_date(date):
    """Format date in Persian"""
    months = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
        'مرداد', 'شهریور', 'مهر', 'آبان',
        'آذر', 'دی', 'بهمن', 'اسفند'
    ]
    
    # This is a simple implementation
    # You might want to use a proper Persian calendar library
    return date.strftime('%Y/%m/%d')
