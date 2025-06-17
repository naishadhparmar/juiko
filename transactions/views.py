from django.shortcuts import render
from .forms import StatementUploadForm
from .models import Transaction
from django.contrib import messages

def upload_statement(request):
    if request.method == 'POST':
        form = StatementUploadForm(request.POST, request.FILES)
        if form.is_valid():
            statement = form.save()
            messages.success(request, f"File uploaded: {statement.file.name}")
    else:
        form = StatementUploadForm()

    return render(request, 'transactions/upload.html', {'form': form})