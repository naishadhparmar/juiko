from ai_engine.models import Prompt, Model, TransactionTag
from transactions.models import Transaction
from django.utils import timezone

# TEMP: simple rule-based logic (to be replaced with AI later)
CATEGORIES = {
    "food": ["restaurant", "cafe", "burger", "pizza", "grocery", "supermarket"],
    "travel": ["uber", "lyft", "taxi", "flight", "airlines", "train", "hotel"],
    "housing": ["rent", "mortgage", "electricity", "water", "gas"],
    "entertainment": ["netflix", "spotify", "cinema", "theatre"],
}


def simple_rule_based_tagger(description: str) -> str:
    desc_lower = description.lower()
    for category, keywords in CATEGORIES.items():
        if any(kw in desc_lower for kw in keywords):
            return category
    return "other"


def tag_transaction(transaction: Transaction, model: Model, prompt: Prompt = None) -> TransactionTag:
    """
    Assigns a tag to a transaction using the given model + prompt.
    Currently rule-based, but later this can call an LLM or ML model.
    """
    description = transaction.description or ""  # assuming Transaction has 'description'
    tag_text = simple_rule_based_tagger(description)

    tag = TransactionTag.objects.create(
        transaction=transaction,
        model=model,
        prompt=prompt,
        tag_text=tag_text,
        created_at=timezone.now()
    )
    return tag