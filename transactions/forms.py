from django import forms
from .models import StatementUpload

class StatementUploadForm(forms.ModelForm):
    class Meta:
        model = StatementUpload
        fields = ['file']