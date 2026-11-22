from django import forms

from maintenance.models import MaintenanceReminder

INPUT_CLASS = ('w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border '
               'border-cyan-500/25 text-xs outline-none focus:border-cyan-400')


class ReminderForm(forms.ModelForm):
    class Meta:
        model = MaintenanceReminder
        fields = [
            'part', 'title', 'description', 'reminder_kilometer',
            'current_kilometer', 'reminder_date', 'is_completed',
        ]
        widgets = {
            'part': forms.Select(attrs={'class': INPUT_CLASS}),
            'title': forms.TextInput(attrs={
                'class': INPUT_CLASS,
                'placeholder': 'مثلاً تعویض روغن موتور',
            }),
            'description': forms.Textarea(attrs={
                'class': INPUT_CLASS,
                'rows': 2,
                'placeholder': 'توضیح اختیاری',
            }),
            'reminder_kilometer': forms.NumberInput(attrs={
                'class': INPUT_CLASS + ' font-mono',
                'min': '0',
                'step': '500',
            }),
            'current_kilometer': forms.NumberInput(attrs={
                'class': INPUT_CLASS + ' font-mono',
                'min': '0',
                'step': '500',
            }),
            'reminder_date': forms.DateInput(attrs={
                'class': INPUT_CLASS + ' font-mono',
                'type': 'date',
            }),
        }
