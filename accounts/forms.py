from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import get_user_model, authenticate
from .models import ESP32Device  # Fix: was trying to import 'Device'

User = get_user_model()

class SignupForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'ایمیل خود را وارد کنید'
        })
    )
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام کاربری'
            })
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

class VerificationForm(forms.Form):
    code = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            'class': 'form-control text-center',
            'placeholder': '000000',
            'maxlength': '6'
        })
    )

class LoginForm(AuthenticationForm):
    username = forms.CharField(
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
        label='نام کاربری یا ایمیل',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نام کاربری یا ایمیل خود را وارد کنید'
        })
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
    
    def clean_identifier(self):
        value = self.cleaned_data['identifier']
        try:
            if '@' in value:
                self.user = User.objects.get(email=value)
            else:
                self.user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise forms.ValidationError('کاربری با این اطلاعات یافت نشد')
        return value

class ResetPasswordForm(forms.Form):
    code = forms.CharField(
        max_length=6,
        min_length=6,
        label='کد تایید',
        widget=forms.TextInput(attrs={
            'class': 'form-control text-center',
            'placeholder': '000000'
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
    
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('new_password1')
        password2 = cleaned_data.get('new_password2')
        
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('رمزهای عبور مطابقت ندارند')
        
        return cleaned_data

class ESP32DeviceForm(forms.ModelForm):
    class Meta:
        model = ESP32Device
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام دستگاه ESP32 خود را وارد کنید'
            })
        }
