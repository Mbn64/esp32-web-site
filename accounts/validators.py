# accounts/validators.py
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
import re

class CustomPasswordValidator:
    """
    اعتبارسنج سفارشی برای رمز عبور
    """
    
    def __init__(self, min_length=8):
        self.min_length = min_length
    
    def validate(self, password, user=None):
        """
        اعتبارسنجی رمز عبور
        """
        # بررسی حداقل طول
        if len(password) < self.min_length:
            raise ValidationError(
                _('رمز عبور باید حداقل %(min_length)d کاراکتر باشد.'),
                code='password_too_short',
                params={'min_length': self.min_length},
            )
        
        # بررسی وجود حروف انگلیسی
        if not re.search(r'[a-zA-Z]', password):
            raise ValidationError(
                _('رمز عبور باید حداقل شامل یک حرف انگلیسی باشد.'),
                code='password_no_letter',
            )
        
        # بررسی وجود عدد
        if not re.search(r'\d', password):
            raise ValidationError(
                _('رمز عبور باید حداقل شامل یک عدد باشد.'),
                code='password_no_number',
            )
        
        # بررسی عدم استفاده از اطلاعات کاربر
        if user:
            # بررسی نام کاربری
            if user.username.lower() in password.lower():
                raise ValidationError(
                    _('رمز عبور نمی‌تواند شامل نام کاربری باشد.'),
                    code='password_too_similar',
                )
            
            # بررسی ایمیل
            if hasattr(user, 'email') and user.email:
                email_part = user.email.split('@')[0].lower()
                if email_part in password.lower():
                    raise ValidationError(
                        _('رمز عبور نمی‌تواند شامل بخشی از ایمیل باشد.'),
                        code='password_too_similar',
                    )
    
    def get_help_text(self):
        """
        متن راهنما برای رمز عبور
        """
        return _(
            'رمز عبور باید حداقل %(min_length)d کاراکتر و شامل حروف انگلیسی و اعداد باشد.'
        ) % {'min_length': self.min_length}
