from django.test import TestCase
from transactions.models import Account, Transaction, StatementUpload
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.utils import IntegrityError
from datetime import date
from decimal import Decimal

class AccountModelTest(TestCase):
    def test_create_checking_account(self):
        account = Account.objects.create(
            name='Everyday Checking',
            account_type='checking',
            institution='Test Bank',
            created_at=date(2024, 1, 1),
            country='US'
        )
        self.assertEqual(account.name, 'Everyday Checking')
        self.assertEqual(account.account_type, 'checking')
        self.assertEqual(account.institution, 'Test Bank')
        self.assertEqual(account.country, 'US')


class TransactionModelTest(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            name='Test Credit Card',
            account_type='credit',
            institution='TestBank',
            created_at=date(2024, 1, 1),
            country='US'
        )

    def test_create_transaction(self):
        test_file = SimpleUploadedFile("statement.xlsx", b"Dummy content")
        transaction = Transaction.objects.create(
            date=date(2024, 1, 15),
            description='Flight Ticket',
            amount=Decimal('150.75'),
            category='Travel',
            account=self.account,
            source_file=test_file
        )

        self.assertEqual(transaction.description, 'Flight Ticket')
        self.assertEqual(transaction.amount, Decimal('150.75'))
        self.assertEqual(transaction.category, 'Travel')
        self.assertEqual(transaction.account, self.account)
        self.assertIn('statement', transaction.source_file.name)

    def test_transaction_requires_account(self):
        with self.assertRaises(IntegrityError):
            Transaction.objects.create(
                date=date(2024, 1, 15),
                description='Orphan Transaction',
                amount=Decimal('99.99'),
                category='Misc',
                account=None
            )


class StatementUploadModelTest(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            name="Test Account",
            account_type="checking",
            institution="Test Bank",
            created_at=timezone.now(),
            country="US"
        )

    def test_create_statement_upload(self):
        # Create a dummy file
        test_file = SimpleUploadedFile("test_statement.xlsx", b"Dummy content")

        # Create the StatementUpload
        upload = StatementUpload.objects.create(
            file=test_file,
            account=self.account
        )

        # Assertions
        self.assertEqual(StatementUpload.objects.count(), 1)
        self.assertEqual(upload.account, self.account)
        self.assertTrue(upload.file.name.endswith("test_statement.xlsx"))
        self.assertIsNotNone(upload.uploaded_at)