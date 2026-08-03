# ReadMateAI — Project Context & Architecture

## 🎯 Идея и Концепция
ReadMateAI — это Telegram Bot + Telegram Mini App для комфортного чтения книг с встроенным AI-наставником, который помогает анализировать текст, объяснять сложные термины и вести диалог без риска спойлеров.

## 🛠️ Стек технологий
- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons, Telegram Mini Apps SDK, Shadcn UI / Custom Drawers.
- **Backend:** Python 3.12, FastAPI (REST API для Mini App), aiogram 3 (Telegram Bot).
- **AI Stack:** 
  - Мультипровайдерная система (Паттерн Strategy).
  - **Google Gemini 2.0 Flash** (Основной провайдер для dev/prod: 2M токенов контекста, $0 затрат).
  - **YandexGPT** (Провайдер для презентаций, хакатонов и экосистемы Яндекса).
  - **TextRank** (Локальный fallback при отсутствии сети/ключей).

## 🏛️ Текущий статус проекта (MVP)
- [x] **Frontend:** Реализован ридер с адаптивной версткой, пагинацией, поддержкой темной/сепия тем, автоматическим ландшафтным режимом и встроенным AI Drawer.
- [x] **Git & History:** История репозитория зачищена, привязана к основному профилю.
- [ ] **Backend LLM Adapter:** Внедрение гибкого `AIFeaturesRouter` (Gemini + YandexGPT).
- [ ] **База данных:** Миграция с `json_store.py` на SQLite/PostgreSQL (SQLAlchemy Async).
- [ ] **Бизнес-логика AI:** Оживление AI-панели (контекстные ответы, объяснение выделенного текста, генерация карточек).

## 🔌 Архитектура AI-Провайдеров (LLM Abstraction)
Для сохранения универсальности используется интерфейс `BaseAIProvider`:
1. `GeminiProvider` — работает через `google-genai` (подходит для подачи всей книги в контекст).
2. `YandexGPTProvider` — работает через Yandex Cloud API (для YACE и локальных питчей).

Переключение осуществляется через переменную окружения `.env`:
`AI_PROVIDER=gemini` или `AI_PROVIDER=yandex`

## 🗺️ Бэклог задач бэкенда (Roadmap)
1. **Провайдеры ИИ:** Написать базовый интерфейс и прослойку переключения Gemini / Yandex.
2. **База Данных:** Переписать хранение пользователей, закладок и истории диалогов с JSON на БД.
3. **Обработка текста:** Интеграция выделения текста (Explain / Quote / Note) с бэкендом.
4. **TTS (Text-to-Speech):** Подключение озвучки глав через edge-tts или Yandex SpeechKit.