# Le Flux: The Native Mistral Agent Builder

*Because Mistral deserves its own native agent builder to leverage its full suite and capabilities.*

**Le Flux** brings the elegance and simplicity of Mistral's "La Plateforme" into an interactive, visual Node-based orchestration canvas. It empowers developers to build, orchestrate, and deploy complex AI workflows and multi-agent systems using native Mistral models—all running on a powerful, locally-hostable headless backend engine.

---

## 🏆 Built for the Mistral Worldwide Hackathon 2026 (Online Edition)

This project was built during the 2026 Mistral Worldwide Hackathon to provide the Mistral ecosystem with a first-class, open-source workflow orchestration tool.

<div class="grid grid-cols-3 gap-4" style="background: #111; padding: 20px; border-radius: 8px;">
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="AWS" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1771606214940-hf0j2b.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Hugging Face" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772100295334-ymyqr.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Nvidia" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1770997823560-tyra4o.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Giant" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772100764799-ftqki.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Weights & Biases" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1771885919278-uo2nqe.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Mistral" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772112453966-ugh0w4.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Raise" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772100794950-cvdze.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Elevenlabs" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772100434588-gfqx2s.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Tilde Research" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772100815399-udt1e.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="White Circle" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772100852452-72y82.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
  <div class="flex items-center justify-center p-4">
    <div class="relative w-full" style="height: 36px;">
        <img alt="Jump" loading="lazy" src="https://zjemqisolzojtlvrfjiu.supabase.co/storage/v1/object/public/sponsor-logos/1772100911730-gjyphe.png" style="height: 100%; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8;">
    </div>
  </div>
</div>

---

## 🚀 The Vision & The Problem

Top AI companies offer powerful ecosystem tools, but developers building with Mistral lacked a specialized, native visual builder that integrated seamlessly with Mistral's specific models (like Pixtral) while maintaining a clean, professional "La Plateforme" aesthetic. 

**The Problem:** Building multi-agent workflows involves hardcoding API chains, managing asynchronous event triggers, and dealing with opaque execution states, making iterations slow.
**The Solution:** Le Flux. A robust open-source React Flow + Node.js platform offering visual drag-and-drop construction, isolated execution engines, live websocket logging, and deep Mistral integration.

---

## 🏗️ Architecture & Core Features

Le Flux isn't just a frontend—it is powered by a custom-built backend execution engine explicitly designed for event-driven agent workflows.

### 1. Multi-Flow Headless Engine
- **Independent Execution Contexts:** The backend Express/Node.js server runs multiple flows simultaneously. Each flow execution creates a sandboxed context and logs its run with a unique `flowId`.
- **Background Event Polling:** The server natively handles background polling and listening. When a trigger event occurs, it automatically traverses the DAG (Directed Acyclic Graph) of the relevant flow.

### 2. Native System Triggers
- **Webhooks:** Expose endpoints `POST /api/webhook/:id` directly from the UI to trigger intelligent routing flows.
- **Telegram Native Integration:** Built-in Telegram Long-Polling. Users can drop a "Telegram Trigger" node and Le Flux's backend will automatically start polling for messages sent to their registered bot contextually isolating commands to specific workflows.

### 3. Deep Mistral Integration
- **Mistral LLM Node:** Dynamic integration with `mistral-large-latest` for logical reasoning, extraction, and natural language tasks, fully configurable via the UI (System Prompts, custom variables).
- **Pixtral API Node:** Vision capabilities integrated natively to pass and evaluate image URLs seamlessly through the flow.

### 4. Live Developer Experience (DX)
- **Websocket Real-Time Logging:** Execution traces, latency metrics, token consumption, and node outputs are streamed directly back to the visual canvas via Socket.io.
- **Data Mapping Engine:** A powerful "Data Mapper" node using Mustache templating allows developers to dynamically inject JSON payloads from upstream nodes into downstream prompts `(e.g., {{ node_xyz.data.message.text }})`.

---

## 🔮 Future Roadmap: Expanding the Ecosystem

The modular architecture of Le Flux was built with expansion in mind. In future phases, we aim to integrate more tools from the ecosystem, aligning with hackathon sponsor capabilities:
- **Weights & Biases Integration:** The isolated execution logs from our Headless Engine are perfectly structured to be modularized and piped into W&B Prompts and Traces for MLOps observability. 
- **Voice Agent Nodes with ElevenLabs:** Adding specialized Text-to-Speech (TTS) nodes into the visual canvas, allowing Mistral models to trigger real-time voice generation and respond to conversational inputs.

---

## 🛠️ Local Setup & Deployment

### Prerequisites
- Node.js v20+
- A Mistral API Key (`MISTRAL_API_KEY`)
- *(Optional)* A Telegram Bot Token (`TELEGRAM_BOT_TOKEN`)

### Installation

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/cedioza/Le-Flux.git
cd Le-Flux
npm install
```

2. Create a `.env` file in the root directory:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

3. Start the Platform (this will concurrently start the backend engine and the Vite frontend):
```bash
npm run dev
```

4. Open `http://localhost:5173` in your browser. The backend engine runs locally on port `3000`.

---
*Built with ❤️ during the Mistral Hackathon.*
