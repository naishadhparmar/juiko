import os
import re
import random
import requests
import yaml
from collections import defaultdict
from models import Transaction, TransactionTag, Instrument

OLLAMA_URL = "http://localhost:11434/api/generate"
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'tagging_config.yaml')

STOP_WORDS = {
    'a', 'an', 'the', 'this', 'that', 'is', 'was', 'it', 'i', 'to', 'of',
    'for', 'tag', 'label', 'category', 'transaction', 'answer', 'response',
    'here', 'my', 'your', 'based', 'on', 'would', 'be', 'suggest'
}

_DEFAULT_SYSTEM_PROMPT = (
    "You are a personal finance transaction tagger. Your only job is to assign "
    "one short lowercase tag to a transaction.\n"
    "Rules:\n"
    "- Reply with a single word or short hyphenated phrase\n"
    "- Lowercase only, no punctuation, no explanation\n"
    "- Output only the tag — never explain, never add filler words"
)


# ── Config loading ────────────────────────────────────────────────────────────

def _load_config():
    """
    Load tagging_config.yaml. Falls back to safe defaults if the file is
    missing or malformed so the service always starts cleanly.
    """
    try:
        with open(_CONFIG_PATH) as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        return {}
    except yaml.YAMLError as e:
        print(f"[tagging] Warning: could not parse tagging_config.yaml: {e}")
        return {}


def _build_system_prompt(config):
    """
    Combine the system_prompt field with the categories block.
    Each category becomes a bullet in the system prompt so the model
    has the full taxonomy before it sees any transaction.
    """
    base = (config.get('system_prompt') or _DEFAULT_SYSTEM_PROMPT).rstrip()
    categories = config.get('categories') or {}
    if categories:
        lines = ['\nCategory definitions — use these to guide your tagging decisions:']
        for name, description in categories.items():
            lines.append(f'  - {name}: {description.strip()}')
        base += '\n' + '\n'.join(lines)
    return base


# Load once at module import time. Restart Flask to pick up config changes.
_CONFIG = _load_config()
MODEL = _CONFIG.get('model', 'llama3.2:3b')
_TEMPERATURE = float(_CONFIG.get('temperature', 0.1))
_MAX_EXAMPLES = int(_CONFIG.get('max_examples', 20))
_EXAMPLES_PER_TAG = int(_CONFIG.get('examples_per_tag', 2))
_SYSTEM_PROMPT = _build_system_prompt(_CONFIG)


# ── Few-shot context builder ──────────────────────────────────────────────────

def build_context(db):
    """
    Query all manually tagged transactions and return:
      - examples_str : formatted few-shot string for the prompt (or None)
      - known_tags   : sorted list of all unique manual tags (may be empty)

    Called once per statement upload — not per row.
    """
    rows = (
        db.session.query(TransactionTag, Transaction, Instrument)
        .join(Transaction, TransactionTag.transaction_id == Transaction.id)
        .join(Instrument, Transaction.instrument_id == Instrument.id)
        .filter(TransactionTag.source == 'manual')
        .all()
    )

    known_tags = sorted(set(tag_obj.tag for tag_obj, _, _ in rows))

    if not rows:
        return None, known_tags

    # Group by tag so we can sample uniformly across all categories
    by_tag = defaultdict(list)
    for tag_obj, transaction, instrument in rows:
        by_tag[tag_obj.tag].append({
            'description': transaction.description,
            'amount': float(transaction.amount),
            'instrument': instrument.account_name,
            'tag': tag_obj.tag
        })

    num_tags = len(by_tag)
    k = max(1, min(_EXAMPLES_PER_TAG, _MAX_EXAMPLES // num_tags))

    examples = []
    for items in by_tag.values():
        examples.extend(random.sample(items, min(k, len(items))))
    random.shuffle(examples)

    examples_str = '\n'.join(
        f'- "{e["description"]}", ${e["amount"]:.2f}, {e["instrument"]} → {e["tag"]}'
        for e in examples
    )
    return examples_str, known_tags


# ── Response cleaning ─────────────────────────────────────────────────────────

def _clean_tag(raw, known_tags_set):
    """
    Parse the model's raw output into a clean usable tag.
    Returns None if the output cannot be salvaged.
    """
    text = raw.strip().lower()
    # First line only — model sometimes adds explanation on subsequent lines
    text = text.split('\n')[0].strip()
    # Strip label prefixes the model adds despite instructions
    for prefix in ('tag:', 'label:', 'category:', 'answer:'):
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
    # Strip stray punctuation
    text = text.strip('.,!?:;"\'-_()[]{}')
    # Split into words and filter stop words
    words = [
        w.strip('.,!?:;"\'-_')
        for w in text.split()
        if w.strip('.,!?:;"\'-_') not in STOP_WORDS
    ]
    if not words:
        return None
    # Exact match against the known vocabulary wins
    for word in words:
        if word in known_tags_set:
            return word
    # Otherwise take the first word that looks like a valid tag
    for word in words:
        if re.match(r'^[a-z][a-z0-9\-_]{0,29}$', word):
            return word
    return None


# ── Main entry point ──────────────────────────────────────────────────────────

def suggest_tag(description, amount, instrument_name, examples=None, known_tags=None):
    """
    Call the local Ollama LLM to suggest a single tag for a transaction.

    examples    : pre-built few-shot string from build_context()
    known_tags  : list of all existing user tags — model will prefer these

    Returns a cleaned lowercase tag string, or None if Ollama is unavailable
    or the response is unusable. Never raises.
    """
    known_tags = known_tags or []
    known_tags_set = set(known_tags)

    parts = []
    if known_tags:
        parts.append(f"User's existing tags (prefer these if they fit): {', '.join(known_tags)}")
    if examples:
        parts.append(f"Examples from this user's transaction history:\n{examples}")
    parts.append(f'Transaction: "{description}", ${amount:.2f}, {instrument_name}\nTag:')

    prompt = '\n\n'.join(parts)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "system": _SYSTEM_PROMPT,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": _TEMPERATURE,
                    "num_predict": 15
                }
            },
            timeout=30
        )
        if not response.ok:
            return None

        raw = response.json().get('response', '')
        return _clean_tag(raw, known_tags_set)

    except Exception:
        return None
