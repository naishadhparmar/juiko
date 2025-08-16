from django.db import models
from django.utils import timezone
from transactions.models import Transaction  # reuse Transaction

class Prompt(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    revised_at = models.DateTimeField(auto_now=True)
    text = models.TextField()

    def __str__(self):
        return f"Prompt {self.id} (created {self.created_at.date()})"


class Model(models.Model):
    organization = models.CharField(max_length=100)
    name = models.CharField(max_length=100)   # e.g., "gpt-4", "custom-classifier"
    path = models.CharField(max_length=255, blank=True, null=True)  
    # Could be API endpoint, model registry path, local file path, etc.

    def __str__(self):
        return f"{self.organization}/{self.name}"


class TransactionTag(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name="tags")
    model = models.ForeignKey(Model, on_delete=models.CASCADE)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, null=True, blank=True)
    tag_text = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.tag_text} (tx {self.transaction.id})"