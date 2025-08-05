from django import forms
from .models import ESP32Device

class DeviceForm(forms.ModelForm):
    class Meta:
        model = ESP32Device
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام دستگاه (مثال: لامپ اتاق خواب)'
            })
        }
    
    def clean_name(self):
        name = self.cleaned_data.get('name')
        if len(name) < 3:
            raise forms.ValidationError('نام دستگاه باید حداقل 3 کاراکتر باشد')
        return name

class DeviceActionForm(forms.Form):
    ACTIONS = [
        ('approve', 'تایید'),
        ('reject', 'رد'),
    ]
    
    action = forms.ChoiceField(choices=ACTIONS, widget=forms.RadioSelect)
    reason = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': 'دلیل رد درخواست (در صورت رد)'
        })
    )