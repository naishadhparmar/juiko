from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from transactions.models import Transaction
from .models import Model, Prompt
from .services.tagger import tag_transaction


@csrf_exempt
def tag_transaction_view(request):
    if request.method == "POST":
        body = json.loads(request.body)

        transaction_id = body.get("transaction_id")
        model_id = body.get("model_id")
        prompt_id = body.get("prompt_id")

        try:
            transaction = Transaction.objects.get(id=transaction_id)
            model = Model.objects.get(id=model_id)
            prompt = Prompt.objects.get(id=prompt_id) if prompt_id else None

            tag = tag_transaction(transaction, model, prompt)

            return JsonResponse({
                "transaction_id": transaction.id,
                "tag": tag.tag_text,
                "model": str(model),
                "prompt": prompt.text if prompt else None,
            })
        except Transaction.DoesNotExist:
            return JsonResponse({"error": "Transaction not found"}, status=404)
        except Model.DoesNotExist:
            return JsonResponse({"error": "Model not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "POST request required"}, status=400)