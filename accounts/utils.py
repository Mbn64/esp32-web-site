from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_verification_email(user):
    """Send email verification code"""
    try:
        code = user.generate_verification_code()
        
        subject = f'کد تایید حساب - {settings.SITE_NAME}'
        message = f'''
سلام {user.username}،

کد تایید حساب شما: {code}

این کد تا 5 دقیقه معتبر است.

تیم {settings.SITE_NAME}
        '''
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f"Verification email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False

def send_reset_email(user):
    """Send password reset email (wrapper function)"""
    try:
        code = user.generate_reset_code()
        
        subject = f'بازیابی رمز عبور - {settings.SITE_NAME}'
        message = f'''
سلام {user.username}،

کد بازیابی رمز عبور شما: {code}

این کد تا 5 دقیقه معتبر است.

تیم {settings.SITE_NAME}
        '''
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f"Reset email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send reset email to {user.email}: {str(e)}")
        return False

def send_device_status_email(user, device, approved=True, reason=None):
    """Send device status email (approval or rejection)"""
    try:
        if approved:
            subject = f'دستگاه شما تایید شد - {settings.SITE_NAME}'
            message = f'''
سلام {user.username}،

درخواست دستگاه "{device.name}" شما با موفقیت تایید شد.

API Key دستگاه: {device.api_key}

می‌توانید از طریق داشبورد خود دستگاه را کنترل کنید.

تیم {settings.SITE_NAME}
            '''
        else:
            subject = f'درخواست دستگاه رد شد - {settings.SITE_NAME}'
            message = f'''
سلام {user.username}،

متأسفانه درخواست دستگاه "{device.name}" شما رد شد.

دلیل رد: {reason or 'مشخص نشده'}

می‌توانید درخواست جدید ثبت کنید.

تیم {settings.SITE_NAME}
            '''
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        status = "approval" if approved else "rejection"
        logger.info(f"Device {status} email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send device status email to {user.email}: {str(e)}")
        return False

