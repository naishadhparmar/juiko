from django.shortcuts import render, redirect
from .forms import StatementUploadForm, AccountForm
from .models import Transaction
from django.contrib import messages
from transactions.models import StatementUpload, Account

def upload_statement(request):
    if request.method == 'POST':
        form = StatementUploadForm(request.POST, request.FILES)
        if form.is_valid():
            statement = form.save()
            messages.success(request, f"File uploaded: {statement.file.name}")
            return redirect('upload_statement')  # Redirect to avoid re-upload on refresh
    else:
        form = StatementUploadForm()
    
    uploads = StatementUpload.objects.order_by('-uploaded_at')

    return render(request, 'transactions/upload_statement.html', {
        'form': form,
        'uploads': uploads
    })

def create_account(request):
    if request.method == 'POST':
        form = AccountForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('list_accounts')
    else:
        form = AccountForm()

    return render(request, 'transactions/create_account.html', {'form': form})

def list_accounts(request):
    accounts = Account.objects.all()
    return render(request, 'transactions/list_accounts.html', {'accounts': accounts})