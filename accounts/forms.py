from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import re

User = get_user_model()

class SignUpForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'ایمیل'
        })
    )
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام کاربری'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'رمز عبور'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
                        'placeholder': 'تکرار رمز عبور'
        })
    
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if username:
            # بررسی شروع با عدد
            if username[0].isdigit():
                raise ValidationError('نام کاربری نمی‌تواند با عدد شروع شود')
            # بررسی کاراکترهای مجاز
            if not re.match(r'^[a-zA-Z0-9_]+$', username):
                raise ValidationError('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ باشد')
            # بررسی طول
            if len(username) < 4:
                raise ValidationError('نام کاربری باید حداقل 4 کاراکتر باشد')
        return username

class LoginForm(forms.Form):
    username_or_email = forms.CharField(
        label='نام کاربری یا ایمیل',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نام کاربری یا ایمیل'
        })
    )
    password = forms.CharField(
        label='رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور'
        })
    )

class EmailVerificationForm(forms.Form):
    code = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            'class': 'form-control text-center',
            'placeholder': '123456',
            'maxlength': '6',
            'pattern': '[0-9]{6}'
        })
    )

class ForgotPasswordForm(forms.Form):
    username_or_email = forms.CharField(
        label='نام کاربری یا ایمیل',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نام کاربری یا ایمیل'
        })
    )

class ResetPasswordForm(forms.Form):
    password = forms.CharField(
        label='رمز عبور جدید',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور جدید'
        })
    )
    password_confirm = forms.CharField(
        label='تکرار رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'تکرار رمز عبور'
        })
    )
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        
        if password and password_confirm:
            if password != password_confirm:
                raise ValidationError('رمز عبور و تکرار آن یکسان نیستند')
            if len(password) < 8:
                raise ValidationError('رمز عبور باید حداقل 8 کاراکتر باشد')
        
        return cleaned_data