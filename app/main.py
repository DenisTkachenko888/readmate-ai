import asyncio
import os
import time
import logging
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramNetworkError

from app.config import get_settings
from app.logging_setup import setup_logging
from app.handlers import start, help, reading, library, browse
from app.net.ipv4_session import IPv4Session

# Инициализируем диспетчер и роутеры глобально (один раз)
dp = Dispatcher()
dp.include_router(start.router)
dp.include_router(help.router)
dp.include_router(browse.router)
dp.include_router(library.router)
dp.include_router(reading.router)

async def main():
    s = get_settings()
    setup_logging(s.log_level)
    
    # ВНИМАНИЕ: Если ты используешь локальный прокси (например, v2ray/clash)
    # для обхода блокировок, закомментируй следующие две строки!
    os.environ.pop("HTTP_PROXY", None)
    os.environ.pop("HTTPS_PROXY", None)
    
    timeout = 120 
    session = IPv4Session(timeout=timeout)
    bot = Bot(
        token=s.bot_token,
        session=session,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    while True:
        try:
            asyncio.run(main())
        except (KeyboardInterrupt, SystemExit):
            print("Бот остановлен вручную.")
            break
        except TelegramNetworkError as e:
            logging.error("Сетевая ошибка Telegram: %s", e)
            print(
                "❌ Нет соединения с Telegram (api.telegram.org:443).\n"
                "Проверь интернет / VPN / блокировки.\n"
                "Повторный запуск через 15 секунд..."
            )
            time.sleep(15)
        except OSError as e:
            logging.error("Системная ошибка: %r", e)
            print(
                "⚠️ Системная ошибка (возможно, WinError 121).\n"
                "Перезапуск Python, чтобы очистить сокеты.\n"
                "Повторный запуск через 30 секунд..."
            )
            time.sleep(30)
        except Exception as e:
            logging.exception("Неизвестная ошибка: %r", e)
            print("❌ Неожиданная ошибка, см. лог выше. Перезапуск через 30 секунд.")
            time.sleep(30)