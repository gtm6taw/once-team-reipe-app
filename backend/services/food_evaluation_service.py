import base64
import json
import os

import requests

# ── 環境変数 ──────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434").rstrip("/")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llama3.2-vision")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "")
MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "90"))
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "180"))


# ── ヘルパー関数 ──────────────────────────────────────
def default_evaluation(recipe_name, comment="AI応答を正しく解析できませんでした。"):
    return {
        "expected_recipe": recipe_name or "料理名不明",
        "is_food": False,
        "detected_dish": "判定できませんでした",
        "match_level": "unknown",
        "score": 0,
        "comment": comment,
        "advice": "もう一度撮影するか、Ollamaのモデル設定を確認してください。",
    }


def strip_data_url(image_base64):
    if not isinstance(image_base64, str) or not image_base64.strip():
        raise ValueError("image_base64 が空です。")

    image_base64 = image_base64.strip()
    if "," in image_base64 and image_base64.lower().startswith("data:"):
        image_base64 = image_base64.split(",", 1)[1]

    if len(image_base64) > MAX_IMAGE_BASE64_LENGTH:
        raise ValueError("画像サイズが大きすぎます。撮影画像を小さくするか、別の画像で試してください。")

    try:
        base64.b64decode(image_base64, validate=True)
    except Exception as exc:
        raise ValueError("画像データがbase64形式として読み取れません。") from exc

    return image_base64


def build_prompt(recipe_name):
    return f"""
料理写真を評価してください。期待料理名: {recipe_name}
JSONだけを返してください。Markdown、説明文、コードブロックは禁止です。
形式:
{{
  "expected_recipe": "{recipe_name}",
  "is_food": true,
  "detected_dish": "検出された料理名または説明",
  "match_level": "high",
  "score": 8,
  "comment": "日本語の短いコメント",
  "advice": "日本語の改善アドバイス"
}}
ルール:
- match_level は high, medium, low, unknown のどれか
- score は0から10
- comment と advice は日本語で各30文字以内
""".strip()


def extract_json_text(text):
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start : end + 1])
        raise


def clamp_score(value):
    try:
        score = float(value)
    except (TypeError, ValueError):
        return 0
    return max(0, min(10, int(round(score))))


def normalize_evaluation(raw, recipe_name):
    normalized = default_evaluation(recipe_name)
    if not isinstance(raw, dict):
        return normalized

    match_level = str(raw.get("match_level", "unknown")).lower().strip()
    if match_level not in {"high", "medium", "low", "unknown"}:
        match_level = "unknown"

    is_food = raw.get("is_food", False)
    if isinstance(is_food, str):
        is_food = is_food.lower().strip() in {"true", "yes", "1", "料理", "food"}
    else:
        is_food = bool(is_food)

    normalized.update(
        {
            "expected_recipe": str(raw.get("expected_recipe") or recipe_name or "料理名不明"),
            "is_food": is_food,
            "detected_dish": str(raw.get("detected_dish") or "判定できませんでした"),
            "match_level": match_level,
            "score": clamp_score(raw.get("score")),
            "comment": str(raw.get("comment") or normalized["comment"]),
            "advice": str(raw.get("advice") or normalized["advice"]),
        }
    )
    return normalized


def call_ollama(recipe_name, image_base64):
    headers = {"Content-Type": "application/json"}
    if OLLAMA_API_KEY:
        headers["Authorization"] = f"Bearer {OLLAMA_API_KEY}"

    payload = {
        "model": OLLAMA_VISION_MODEL,
        "prompt": build_prompt(recipe_name),
        "images": [image_base64],
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0,
            "num_predict": OLLAMA_NUM_PREDICT,
        },
    }

    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        headers=headers,
        json=payload,
        timeout=OLLAMA_TIMEOUT_SECONDS,
    )
    if response.status_code == 404:
        raise RuntimeError(
            f"画像認識モデルが見つかりません。`ollama pull {OLLAMA_VISION_MODEL}` でモデルを準備してください。"
        )
    if response.status_code >= 400:
        raise RuntimeError(f"Ollama APIでエラーが発生しました: {response.status_code} {response.text[:200]}")

    data = response.json()
    return data.get("response", "")