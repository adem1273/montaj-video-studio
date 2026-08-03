# Montaj — AI Video Studio

AI-powered video creation studio with cloud sync, deterministic rendering, and resilient batch export.

## Features
- Cloud sync via Supabase (last-write-wins conflict resolution)
- Deterministic frame-by-frame video rendering (FFmpeg.wasm)
- Resilient batch export queue with IndexedDB persistence
- AI script generation, TTS narration, music mixing
- YouTube metadata and thumbnail generation

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase (auth, database, storage)
- Dexie (IndexedDB offline cache)
- FFmpeg.wasm (video encoding)
