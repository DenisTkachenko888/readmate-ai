import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from fastapi import Header, HTTPException, status
from app.config import get_settings


def validate_init_data(init_data: str, bot_token: str, max_age: int = 86400) -> dict:
    """
    Валидирует строку initData от Telegram Mini App.
    Спецификация: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    try:
        data = dict(parse_qsl(init_data, keep_blank_values=True))
    except Exception as e:
        raise ValueError("Некорректный формат строки запроса") from e

    received_hash = data.pop("hash", None)
    if not received_hash:
        raise ValueError("Отсутствует 'hash' в initData")

    # Формируем строку для проверки (ключи по алфавиту)
    check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    
    # Генерация секретного ключа и подписи
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise ValueError("Неверная HMAC подпись (данные подделаны)")

    # Защита от Replay-атак (срок жизни подписи, по умолчанию 24 часа)
    auth_date = int(data.get("auth_date", "0"))
    if time.time() - auth_date > max_age:
        raise ValueError("Срок действия initData истек")

    user_raw = data.get("user")
    if not user_raw:
        raise ValueError("Отсутствует объект 'user' в initData")

    return json.loads(user_raw)


async def get_current_user(x_telegram_init_data: str | None = Header(None)) -> int:
    """
    FastAPI Dependency: перехватывает заголовок X-Telegram-Init-Data,
    валидирует его и возвращает надежный user_id.
    """
    if not x_telegram_init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Отсутствует заголовок 'X-Telegram-Init-Data'",
        )

    s = get_settings()
    try:
        user_data = validate_init_data(x_telegram_init_data, s.bot_token)
        return int(user_data["id"])
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Ошибка аутентификации: {str(err)}",
        )