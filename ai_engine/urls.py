from django.urls import path
from .views import tag_transaction_view

urlpatterns = [
    path('tag/', tag_transaction_view, name='tag_transaction'),
]