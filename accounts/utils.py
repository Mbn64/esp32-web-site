from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

def send_verification_email(user, code):
    """ارسال ایمیل تایید ثبت نام"""
    subject = 'تایید ایمیل - MBN13'
    html_message = render_to_string('emails/verification_email.html', {
        'user': user,
        'code': code,
        'domain': settings.DOMAIN
    })
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )

def send_password_reset_email(user, code):
    """ارسال ایمیل بازیابی رمز عبور"""
    subject = 'بازیابی رمز عبور - MBN13'
    html_message = render_to_string('emails/password_reset_email.html', {
        'user': user,
        'code': code,
        'domain': settings.DOMAIN
    })
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )

def send_device_status_email(device, status, reason=''):
    """ارسال ایمیل وضعیت درخواست دستگاه"""
    subject = f'وضعیت درخواست دستگاه {device.name} - MBN13'
    
    context = {
        'user': device.user,
        'device': device,
        'status': status,
        'reason': reason,
        'domain': settings.DOMAIN
    }
    
    html_message = render_to_string('emails/device_status_email.html', context)
    plain_message = strip_tags(html_message)
    
    send_mail(
                subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [device.user.email],
        html_message=html_message,
        fail_silently=False,
    )