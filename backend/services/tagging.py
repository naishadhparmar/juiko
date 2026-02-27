import random
import requests
from collections import defaultdict
from models import Transaction, TransactionTag, Instrument

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:1b"

MAX_TOTAL_EXAMPLES = 20
EXAMPLES_PER_TAG = 2


def build_examples(db):
    """
    Query all manually tagged transactions and sample uniformly across tags.
    Returns a formatted example string for the few-shot prompt, or None if
    no manual tags exist yet.

    Called once per statement upload — not per row.
    """
    rows = (
        db.session.query(TransactionTag, Transaction, Instrument)
        .join(Transaction, TransactionTag.transaction_id == Transaction.id)
        .join(Instrument, Transaction.instrument_id == Instrument.id)
        .filter(TransactionTag.source == 'manual')
        .all()
    )

    if not rows:
        return None

    # Group examples by tag for uniform sampling
    by_tag = defaultdict(list)
    for tag_obj, transaction, instrument in rows:
        by_tag[tag_obj.tag].append({
            'description': transaction.description,
            'amount': float(transaction.amount),
            'instrument': instrument.account_name,
            'tag': tag_obj.tag
        })

    num_tags = len(by_tag)
    k = max(1, min(EXAMPLES_PER_TAG, MAX_TOTAL_EXAMPLES // num_tags))

    examples = []
    for items in by_tag.values():
        examples.extend(random.sample(items, min(k, len(items))))

    random.shuffle(examples)

    return '\n'.join(
        f'- "{e["description"]}", ${e["amount"]:.2f}, {e["instrument"]} → {e["tag"]}'
        for e in examples
    )


def suggest_tag(description, amount, instrument_name, examples=None):
    """
    Call a local Ollama LLM to suggest a single tag for a transaction.

    examples: pre-built few-shot string from build_examples() — pass None
              if no manual tags exist yet.

    Returns a cleaned lowercase tag string, or None if Ollama is unavailable
    or returns an unusable response. Never raises — always safe to call.
    """
    if examples:
        prompt = (
            "You are a personal finance transaction tagger.\n\n"
            "Here are examples of tagged transactions:\n"
            f"{examples}\n\n"
            "Tag the following transaction with a single short lowercase tag.\n"
            "Use an existing tag if it fits well. If the transaction does not "
            "resemble any example closely, invent a concise descriptive tag.\n"
            "Respond with only the tag — no explanation, no punctuation.\n\n"
            f'Transaction: "{description}", ${amount:.2f}, {instrument_name}\n'
            "Tag:"
        )
    else:
        prompt = (
            "You are a personal finance transaction tagger.\n\n"
            "Tag the following transaction with a single short lowercase tag "
            "that describes the spending category.\n"
            "Respond with only the tag — no explanation, no punctuation.\n\n"
            f'Transaction: "{description}", ${amount:.2f}, {instrument_name}\n'
            "Tag:"
        )

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.01,  # deterministic output
                    "num_predict": 10
                }
            },
            timeout=30
        )
        if not response.ok:
            return None

        raw = response.json().get('response', '').strip().lower()
        # Take the first word only and strip stray punctuation
        tag = raw.split('\n')[0].split(' ')[0].strip('.,!?:;"\'-_')
        return tag if tag else None

    except Exception:
        return None
