from django.db import models
import pycountry

class StatementUpload(models.Model):
    uploaded_at = models.DateTimeField(auto_now_add=True)  # when the file was uploaded
    file = models.FileField(upload_to='statements/')  # saved under /media/statements/
    processed = models.BooleanField(default=False)    # whether it's been parsed yet

    def __str__(self):
        return f"{self.file.name} (processed={self.processed})"
    
class Account(models.Model):
    ACCOUNT_TYPES = [
        ('checking', 'Checking Account'),
        ('savings', 'Savings Account'),
        ('hysa', 'High-Yield Savings Account'),
        ('credit', 'Credit Card'),
        ('investment', 'Investment Account'),
        ('cash', 'Cash')
    ]

    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    institution = models.CharField(max_length=100, blank=False)
    created_at = models.DateField()
    country = models.CharField(max_length=2, choices=[(c.alpha_2, c.name) for c in pycountry.countries], default='US')
    
    def __str__(self):
        return f"{self.name} ({self.get_account_type_display()})"

class Transaction(models.Model):
    """
    Model representing a financial transaction.
    """
    date = models.DateField()
    description = models.TextField(blank=False)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    source_file = models.FileField(upload_to='statements/')
    category = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} - {self.transaction_type} - {self.amount}"
