#!/usr/bin/env python3
"""クレデンシャル安全な Gemini/Ollama の事前チェック。
デフォルトモードではメタデータの確認のみを行います。
``--generate`` が最小限の生成呼び出しの明示的なユーザーゲートです。
URL、クレデンシャル、レスポンスボディは決して表示されません。
"""

import argparse
import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR.parent / ".env", override=False)


def _timeout():
    try:
        return max(3, min(int(os.getenv("AI_PREFLIGHT_TIMEOUT_SECONDS", "15")), 60))
    except ValueError:
        return 15


def _classify(status):
    if status in (401, 403):
        return "credentials_rejected"
    if status == 404:
        return "model_not_found"
    if status == 429:
        return "rate_limited"
    if status >= 500:
        return "service_error"
    return "http_error"


def _network_failure(error):
    if isinstance(error, requests.exceptions.Timeout):
        return "timeout"
    if isinstance(error, requests.exceptions.ConnectionError):
        return "unreachable"
    return "request_failed"


def check_gemini(generate=False):
    api_key = str(os.getenv("GEMINI_API_KEY") or "").strip()
    model = str(os.getenv("GEMINI_MODEL") or "gemini-2.5-flash").strip()
    result = {
        "selected": True,
        "configured": bool(api_key),
        "metadataReachable": False,
        "generationAttempted": bool(generate),
        "generationSucceeded": False,
        "status": "not_configured",
    }
    if not api_key:
        return result
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    base = "https://generativelanguage.googleapis.com/v1beta"
    try:
        response = requests.get(
            f"{base}/models/{model}", headers=headers, timeout=_timeout()
        )
    except requests.exceptions.RequestException as error:
        result["status"] = _network_failure(error)
        return result
    if response.status_code != 200:
        result["status"] = _classify(response.status_code)
        return result
    result["metadataReachable"] = True
    result["status"] = "metadata_ok"
    if not generate:
        return result
    try:
        response = requests.post(
            f"{base}/models/{model}:generateContent",
            headers=headers,
            json={
                "contents": [{"parts": [{"text": "Reply with the single word OK."}]}],
                "generationConfig": {"temperature": 0, "maxOutputTokens": 8},
            },
            timeout=_timeout(),
        )
    except requests.exceptions.RequestException as error:
        result["status"] = _network_failure(error)
        return result
    if response.status_code != 200:
        result["status"] = _classify(response.status_code)
        return result
    try:
        valid_shape = bool(response.json().get("candidates"))
    except (ValueError, AttributeError):
        valid_shape = False
    result["generationSucceeded"] = valid_shape
    result["status"] = "generation_ok" if valid_shape else "invalid_response_shape"
    return result


def check_ollama(generate=False):
    base_url = str(
        os.getenv("OLLAMA_BASE_URL") or "http://host.docker.internal:11434"
    ).rstrip("/")
    model = str(os.getenv("OLLAMA_VISION_MODEL") or "llama3.2-vision").strip()
    api_key = str(os.getenv("OLLAMA_API_KEY") or "").strip()
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    result = {
        "selected": True,
        "reachable": False,
        "modelPresent": False,
        "generationAttempted": bool(generate),
        "generationSucceeded": False,
        "status": "unreachable",
    }
    try:
        response = requests.get(
            f"{base_url}/api/tags", headers=headers, timeout=_timeout()
        )
    except requests.exceptions.RequestException as error:
        result["status"] = _network_failure(error)
        return result
    if response.status_code != 200:
        result["status"] = _classify(response.status_code)
        return result
    result["reachable"] = True
    try:
        models = response.json().get("models") or []
        names = {
            str(item.get("name") or item.get("model") or "")
            for item in models
            if isinstance(item, dict)
        }
    except (ValueError, AttributeError):
        result["status"] = "invalid_response_shape"
        return result
    result["modelPresent"] = model in names or any(
        name.split(":", 1)[0] == model.split(":", 1)[0] for name in names
    )
    if not result["modelPresent"]:
        result["status"] = "model_not_found"
        return result
    result["status"] = "metadata_ok"
    if not generate:
        return result
    try:
        response = requests.post(
            f"{base_url}/api/generate",
            headers=headers,
            json={
                "model": model,
                "prompt": "Reply with the single word OK.",
                "stream": False,
                "options": {"temperature": 0, "num_predict": 8},
            },
            timeout=max(_timeout(), 60),
        )
    except requests.exceptions.RequestException as error:
        result["status"] = _network_failure(error)
        return result
    if response.status_code != 200:
        result["status"] = _classify(response.status_code)
        return result
    try:
        valid_shape = isinstance(response.json().get("response"), str)
    except (ValueError, AttributeError):
        valid_shape = False
    result["generationSucceeded"] = valid_shape
    result["status"] = "generation_ok" if valid_shape else "invalid_response_shape"
    return result


def _passed(result, generate):
    if generate:
        return bool(result.get("generationSucceeded"))
    return result.get("status") == "metadata_ok"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--generate",
        action="store_true",
        help="explicitly authorize one minimal generation call per selected provider",
    )
    parser.add_argument("--skip-gemini", action="store_true")
    parser.add_argument("--skip-ollama", action="store_true")
    arguments = parser.parse_args()
    summary = {"mode": "generation" if arguments.generate else "metadata", "providers": {}}
    if not arguments.skip_gemini:
        summary["providers"]["gemini"] = check_gemini(arguments.generate)
    if not arguments.skip_ollama:
        summary["providers"]["ollama"] = check_ollama(arguments.generate)
    summary["ok"] = bool(summary["providers"]) and all(
        _passed(result, arguments.generate) for result in summary["providers"].values()
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
