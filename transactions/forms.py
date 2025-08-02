from django import forms
from .models import StatementUpload, Account

class StatementUploadForm(forms.ModelForm):
    class Meta:
        model = StatementUpload
        fields = ['file']

class AccountForm(forms.ModelForm):
    class Meta:
        model = Account
        fields = ['name', 'account_type', 'institution', 'country', 'created_at']

        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'account_type': forms.Select(attrs={'class': 'form-control'}),
            'institution': forms.TextInput(attrs={'class': 'form-control'}),
            'country': forms.Select(attrs={'class': 'form-control'}),
            'created_at': forms.DateInput(attrs={
                'type': 'date',
                'class': 'form-control'
            }),
        }