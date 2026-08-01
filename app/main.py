import asyncio
import os
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
import time
import logging
from aiogram.exceptions import TelegramNetworkError
from app.config import get_settings
from app.logging_setup import setup_logging
from app.handlers import start, help, reading, library, browse
from app.net.ipv4_session import IPv4Session

async def main():
    s = get_settings()
    setup_logging(s.log_level)

    # на всякий случай обнулим прокси в текущем процессе
    os.environ.pop("HTTP_PROXY", None)
    os.environ.pop("HTTPS_PROXY", None)

    timeout = 120  # <— ЧИСЛО, не ClientTimeout
    session = IPv4Session(timeout=timeout)

    bot = Bot(
        token=s.bot_token,
        session=session,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    dp = Dispatcher()
    dp.include_router(start.router)
    dp.include_router(help.router)
    dp.include_router(browse.router)
    dp.include_router(library.router)
    dp.include_router(reading.router)

    await dp.start_polling(bot)

if __name__ == "__main__":
    while True:
        try:
            asyncio.run(main())
        except (KeyboardInterrupt, SystemExit):
            print("🛑 Бот остановлен по запросу пользователя.")
            break
        except TelegramNetworkError as e:
            logging.error("Проблема с сетью при обращении к Telegram: %s", e)
            print(
                "❌ Нет соединения с Telegram (api.telegram.org:443).\n"
                "Проверь интернет / VPN / блокировки.\n"
                "Повторный запуск через 15 секунд..."
            )
            time.sleep(15)
        except OSError as e:
            logging.error("Низкоуровневая ошибка ОС: %r", e)
            print(
                "❌ Низкоуровневая сетевая ошибка Windows (например, WinError 121).\n"
                "Это уже не Python, а сеть/драйвер/провайдер.\n"
                "Повторный запуск через 30 секунд..."
            )
            time.sleep(30)
        except Exception as e:
            logging.exception("Неизвестная ошибка, бот упал: %r", e)
            print("❌ Неожиданная ошибка, см. лог выше. Перезапуск через 30 секунд.")
            time.sleep(30)
