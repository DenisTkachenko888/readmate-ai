import socket
from typing import Any, Optional

from aiohttp import TCPConnector
from aiogram.client.session.aiohttp import AiohttpSession


class IPv4Session(AiohttpSession):
    """
    Сессия для aiogram, которая:
    - форсит IPv4 (family=AF_INET),
    - подправляет ttl_dns_cache,
    - не трогает остальную внутреннюю логику AiohttpSession.
    """

    def __init__(self, *, timeout: float = 120, **kwargs: Any) -> None:
        # timeout — секунды, как в BaseSession
        super().__init__(timeout=timeout, **kwargs)

        # AiohttpSession уже создал self._connector_init,
        # мы просто добавляем нужные параметры
        self._connector_init["family"] = socket.AF_INET
        self._connector_init["ttl_dns_cache"] = 300
