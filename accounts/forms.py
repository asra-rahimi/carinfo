from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from accounts.models import CarProfile


class RegisterForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'password1', 'password2']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].widget.attrs.update({
            'class': 'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 text-xs outline-none focus:border-cyan-400',
            'placeholder': 'نام کاربری',
        })
        self.fields['password1'].widget.attrs.update({
            'class': 'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 text-xs outline-none focus:border-cyan-400',
            'placeholder': 'گذرواژه',
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 text-xs outline-none focus:border-cyan-400',
            'placeholder': 'تکرار گذرواژه',
        })


class CarProfileForm(forms.ModelForm):
    class Meta:
        model = CarProfile
        fields = ['owner_name', 'car_name', 'car_model', 'current_kilometer']
        widgets = {
            'owner_name': forms.TextInput(attrs={
                'class': 'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 text-xs outline-none focus:border-cyan-400',
                'placeholder': 'نام مالک',
            }),
            'car_name': forms.TextInput(attrs={
                'class': 'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 text-xs outline-none focus:border-cyan-400',
                'placeholder': 'پژو ۲۰۷',
            }),
            'car_model': forms.TextInput(attrs={
                'class': 'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 text-xs outline-none focus:border-cyan-400',
                'placeholder': 'TU5',
            }),
            'current_kilometer': forms.NumberInput(attrs={
                'class': 'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 text-xs font-mono outline-none focus:border-cyan-400',
                'placeholder': '45000',
                'min': '0',
                'step': '500',
            }),
        }
