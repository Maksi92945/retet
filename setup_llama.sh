#!/usr/bin/env bash
# ============================================================
#  Eden AI — Llama setup script
#  Usage:  bash setup_llama.sh
# ============================================================
set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

banner() {
  echo -e "${CYAN}"
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║              Eden AI — Llama Setup Wizard                ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

banner

# ---- Pick path ----
cat <<EOF
Choose how you want to run Llama for Eden:

  ${GREEN}1${NC}) Ollama + Llama 3.2 3B          (works on any Mac, free, fast)         ⭐ recommended
  ${GREEN}2${NC}) llama-stack local + Llama 3.2  (official Meta tooling, runs locally)
  ${GREEN}3${NC}) llama-stack + Llama 4 Maverick (requires 200GB+ VRAM — won't run on Mac)
  ${GREEN}4${NC}) Meta Llama API (hosted)        (Maverick in the cloud, needs API key)

EOF
read -p "Pick [1-4]: " CHOICE

case "$CHOICE" in

  1)
    echo -e "${CYAN}▶ Installing Ollama + Llama 3.2 3B${NC}"
    if ! command -v ollama >/dev/null 2>&1; then
      if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Installing via Homebrew…"
        brew install ollama || (echo -e "${YELLOW}Homebrew failed, falling back to installer${NC}" && curl -fsSL https://ollama.com/install.sh | sh)
      else
        curl -fsSL https://ollama.com/install.sh | sh
      fi
    fi
    echo -e "${GREEN}✓ Ollama installed${NC}"
    echo "Starting server in background…"
    nohup ollama serve >/tmp/ollama.log 2>&1 &
    sleep 3
    echo "Pulling llama3.2 (~2GB)…"
    ollama pull llama3.2
    echo -e "${GREEN}✓ Done. In Eden settings choose:${NC}"
    echo "    Engine : Ollama"
    echo "    URL    : http://localhost:11434"
    echo "    Model  : llama3.2"
    ;;

  2)
    echo -e "${CYAN}▶ Installing llama-stack + Llama 3.2 3B${NC}"
    pip install -U llama-stack
    echo "Available models:"
    llama model list
    echo
    read -p "Model id to download [Llama3.2-3B-Instruct]: " MID
    MID=${MID:-Llama3.2-3B-Instruct}
    llama model download --source meta --model-id "$MID"

    # Build a local distro that serves via OpenAI-compatible API
    llama stack build --template meta-reference-gpu --image-type conda --name eden-stack || \
      llama stack build --template meta-reference-quantized-gpu --image-type conda --name eden-stack
    echo -e "${GREEN}✓ Starting Llama Stack on :8321${NC}"
    echo "Run: llama stack run eden-stack --port 8321"
    echo
    echo -e "${GREEN}In Eden settings choose:${NC}"
    echo "    Engine : Llama Stack"
    echo "    URL    : http://localhost:8321/v1/openai/v1"
    echo "    Model  : $MID"
    ;;

  3)
    echo -e "${RED}⚠ Llama 4 Maverick = 400B params, MoE.${NC}"
    echo -e "${YELLOW}It needs 200GB+ VRAM (4× H100 minimum).${NC}"
    echo "Your Mac (or any single consumer GPU) physically cannot run it."
    echo
    read -p "Download anyway (file is ~800GB on disk)? [y/N]: " YN
    [[ "$YN" =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }

    pip install -U llama-stack
    echo "When prompted, paste the Meta-signed URL you got from llama.com/llama-downloads"
    llama model download --source meta --model-id Llama-4-Maverick-17B-128E-Instruct
    echo
    echo -e "${YELLOW}File downloaded but cannot be served on this hardware.${NC}"
    echo -e "${YELLOW}Use option 4 (Meta Llama API) to actually talk to Maverick.${NC}"
    ;;

  4)
    echo -e "${CYAN}▶ Meta Llama API (hosted, runs Maverick in the cloud)${NC}"
    echo
    echo "1. Go to: https://llama.developer.meta.com"
    echo "2. Sign in with your Meta account"
    echo "3. Create an API key"
    echo "4. In Eden settings choose:"
    echo "       Engine  : OpenAI-compatible"
    echo "       URL     : https://api.llama.com/v1"
    echo "       Model   : Llama-4-Maverick-17B-128E-Instruct-FP8"
    echo "       API Key : <paste your key>"
    ;;

  *)
    echo "Invalid choice." ; exit 1 ;;
esac

echo
echo -e "${GREEN}════════ Done. Open frontend/app.html and click the status pill ════════${NC}"
