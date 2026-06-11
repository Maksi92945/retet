# 🦙 Eden + Llama — Setup Guide

Eden's chat работает с **4 разными движками** — выбери под своё железо и кошелёк.

## ⚠️ Сначала правда про Llama 4 Maverick

| Что | Значение |
|---|---|
| Параметров | 400B (MoE, 17B активных) |
| VRAM (Q4) | ~200 ГБ |
| Минимум железа | **4× NVIDIA H100 80GB** |
| На Mac | **❌ Невозможно** ни на каком |
| Размер на диске | ~800 ГБ |

Ссылка от Meta, которую ты прислал, валидна — её можно использовать чтобы скачать веса, но запустить их локально без data-center нельзя. Реальные пути ниже.

---

## 🚀 Быстрый старт

Открой Terminal в этой папке и запусти мастер:

```bash
cd ~/Desktop/eden/frontend
bash setup_llama.sh
```

Мастер спросит, какой вариант ты хочешь:

### Вариант 1 — Ollama + Llama 3.2 (рекомендую) ⭐

Работает на любом Mac, бесплатно, мгновенно.

```bash
brew install ollama
ollama pull llama3.2          # ~2 ГБ
ollama serve
```

В Eden → статус-пилл (правый верх) → **Engine: Ollama (local)** → Test connection.

### Вариант 2 — llama-stack локально

Официальная тулза Meta. Тоже Llama 3.2, но через OpenAI-совместимый API.

```bash
pip install -U llama-stack
llama model list
llama model download --source meta --model-id Llama3.2-3B-Instruct
llama stack build --template meta-reference-gpu --image-type conda --name eden
llama stack run eden --port 8321
```

В Eden →
- **Engine:** Llama Stack (local)
- **URL:** `http://localhost:8321/v1/openai/v1`
- **Model:** `Llama3.2-3B-Instruct`

### Вариант 3 — скачать Maverick (просто скачать, не запустить)

```bash
pip install -U llama-stack
llama model download --source meta --model-id Llama-4-Maverick-17B-128E-Instruct
# когда спросит URL — вставь свою ссылку от Meta
```

После — переходи к варианту 4, чтобы реально общаться с моделью.

### Вариант 4 — Meta Llama API (Maverick в облаке) 🌩

Реальный способ получить Maverick без своего железа.

1. Открой [llama.developer.meta.com](https://llama.developer.meta.com)
2. Войди через Meta-аккаунт
3. Создай API key
4. В Eden →
   - **Engine:** Meta Llama API
   - **URL:** `https://api.llama.com/v1`
   - **Model:** `Llama-4-Maverick-17B-128E-Instruct-FP8`
   - **API Key:** твой ключ

### Вариант 5 — Together / Fireworks / Groq

Любой провайдер с OpenAI-совместимым API, хостящий Maverick.

В Eden →
- **Engine:** OpenAI-compatible
- **URL:** `https://api.together.xyz/v1` (для Together)
- **Model:** `meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`
- **API Key:** твой ключ от Together

---

## 🩺 Что показывает статус-пилл

| Цвет | Значение |
|---|---|
| 🟢 зелёный | Подключено, модель готова |
| 🟡 жёлтый | Сервер отвечает, но модели нет — нужно `pull` |
| 🔴 красный | Сервер недоступен |

Клик по пиллу → панель настроек.

---

## 🛠 Если что-то не работает

| Проблема | Решение |
|---|---|
| CORS error в браузере | Запусти через сервер: `python3 -m http.server 8000` |
| `ollama: command not found` | `brew install ollama` |
| `model not found` | `ollama pull llama3.2` |
| `Invalid API key` | Проверь ключ в [llama.developer.meta.com](https://llama.developer.meta.com) |
| llama-stack не ставится | `pip install -U llama-stack --break-system-packages` |

---

## 📁 Структура проекта

```
frontend/
├── app.html            # главный UI чата
├── eden-clone.html     # лендинг
├── eden-agent.js       # мозг агента (4 backends)
├── setup_llama.sh      # мастер установки
└── LLAMA_SETUP.md      # этот файл
```
