from django.test import TestCase
from transactions.models import Transaction, Account
from ai_engine.models import Model, Prompt, TransactionTag
from ai_engine.services.tagger import tag_transaction
from django.utils import timezone


class TaggingTests(TestCase):

    def setUp(self):
        self.account = Account.objects.create(
            name="Test Checking",
            account_type="checking",
            institution="Test Bank",
            created_at=timezone.now(),
            country="US"
        )
        self.transaction = Transaction.objects.create(
            account=self.account,
            description="Dinner at Pizza Hut",
            amount=20.00,
            date=timezone.now()
        )
        self.model = Model.objects.create(
            organization="local",
            name="rule_based",
            path="internal"
        )
        self.prompt = Prompt.objects.create(text="Classify into categories")

    def test_tag_transaction(self):
        tag = tag_transaction(self.transaction, self.model, self.prompt)
        self.assertEqual(tag.tag_text, "food")
        self.assertEqual(tag.transaction.id, self.transaction.id)
        self.assertEqual(tag.model.id, self.model.id)