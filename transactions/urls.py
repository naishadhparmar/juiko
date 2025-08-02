from django.urls import path
from .views import upload_statement, create_account, list_accounts

urlpatterns = [
    path('upload/', upload_statement, name='upload_statement'),
    path('accounts/create/', create_account, name='create_account'),
    path('accounts/', list_accounts, name='list_accounts'),
]