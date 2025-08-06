from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import Device
import re

class SignupForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'example@email.com'
        })
    )
    
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نام کاربری خود را وارد کنید'
        })
    )
    
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور'
        })
    )
    
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'تکرار رمز عبور'
        })
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

    def clean_username(self):
        username = self.cleaned_data.get('username')
        
        # Check if username starts with number
        if username and username[0].isdigit():
            raise ValidationError('نام کاربری نمی‌تواند با عدد شروع شود')
        
        # Check username pattern (only letters, numbers, underscore)
        if username and not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', username):
            raise ValidationError('نام کاربری فقط می‌تواند شامل حروف، اعداد و خط زیر باشد و باید با حرف شروع شود')
        
        # Check minimum length
        if username and len(username) < 3:
            raise ValidationError('نام کاربری حداقل باید 3 کاراکتر باشد')
            
        # Check maximum length
        if username and len(username) > 20:
            raise ValidationError('نام کاربری حداکثر می‌تواند 20 کاراکتر باشد')
        
        # Check if username exists
        if User.objects.filter(username=username).exists():
            raise ValidationError('این نام کاربری قبلاً استفاده شده است')
            
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        
        if User.objects.filter(email=email).exists():
            raise ValidationError('این ایمیل قبلاً ثبت شده است')
            
        return email

    def clean_password1(self):
        password = self.cleaned_data.get('password1')
        
        if password:
            # Check minimum length
            if len(password) < 8:
                raise ValidationError('رمز عبور باید حداقل 8 کاراکتر باشد')
            
            # Check if password contains at least one letter
            if not re.search(r'[a-zA-Z]', password):
                raise ValidationError('رمز عبور باید حداقل یک حرف داشته باشد')
            
            # Check if password contains at least one number
            if not re.search(r'\d', password):
                raise ValidationError('رمز عبور باید حداقل یک عدد داشته باشد')
                
        return password

class VerifyEmailForm(forms.Form):
    verification_code = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            'class': 'form-control text-center',
            'placeholder': '000000',
            'maxlength': '6',
            'style': 'letter-spacing: 0.5em; font-size: 1.2em;'
        })
    )
    
    def clean_verification_code(self):
        code = self.cleaned_data.get('verification_code')
        
        if code and not code.isdigit():
            raise ValidationError('کد تایید باید فقط عدد باشد')
            
        return code

class LoginForm(forms.Form):
    identifier = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نام کاربری یا ایمیل'
        })
    )
    
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور'
        })
    )

class ForgotPasswordForm(forms.Form):
    identifier = forms.CharField(
        label='ایمیل یا نام کاربری',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'ایمیل یا نام کاربری خود را وارد کنید'
        })
    )

class ResetPasswordForm(forms.Form):
    code = forms.CharField(
        max_length=6,
        min_length=6,
        label='کد بازیابی',
        widget=forms.TextInput(attrs={
            'class': 'form-control text-center',
            'placeholder': '000000',
            'maxlength': '6',
            'style': 'letter-spacing: 0.5em; font-size: 1.2em;'
        })
    )
    
    new_password1 = forms.CharField(
        label='رمز عبور جدید',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور جدید'
        })
    )
    
    new_password2 = forms.CharField(
        label='تکرار رمز عبور جدید',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'تکرار رمز عبور جدید'
        })
    )
    
    def clean_code(self):
        code = self.cleaned_data.get('code')
        
        if code and not code.isdigit():
            raise ValidationError('کد بازیابی باید فقط عدد باشد')
            
        return code
    
    def clean_new_password1(self):
        password = self.cleaned_data.get('new_password1')
        
        if password:
            # Check minimum length
            if len(password) < 8:
                raise ValidationError('رمز عبور باید حداقل 8 کاراکتر باشد')
            
            # Check if password contains at least one letter
            if not re.search(r'[a-zA-Z]', password):
                raise ValidationError('رمز عبور باید حداقل یک حرف داشته باشد')
            
            # Check if password contains at least one number
            if not re.search(r'\d', password):
                raise ValidationError('رمز عبور باید حداقل یک عدد داشته باشد')
                
        return password
    
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('new_password1')
        password2 = cleaned_data.get('new_password2')
        
        if password1 and password2 and password1 != password2:
            raise ValidationError('رمزهای عبور مطابقت ندارند')
            
        return cleaned_data

class AddDeviceForm(forms.ModelForm):
    name = forms.CharField(
        label='نام دستگاه',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نام توصیفی برای دستگاه خود وارد کنید'
        })
    )
    
    class Meta:
        model = Device
        fields = ['name']
    
    def clean_name(self):
        name = self.cleaned_data.get('name')
        
        if name:
            # Check minimum length
            if len(name.strip()) < 2:
                raise ValidationError('نام دستگاه باید حداقل 2 کاراکتر باشد')
            
            # Check maximum length
            if len(name.strip()) > 50:
                raise ValidationError('نام دستگاه حداکثر می‌تواند 50 کاراکتر باشد')
                
        return name.strip()
