# Project Knowledge & Architectural Decisions

## Overview
This project is a Telegram AI-powered assistant and news orchestrator designed for Ukrainian migrants in Germany. It provides localized news, administrative guidance, and interactive support.

## Core Architecture
- **Frontend**: React + TypeScript + Vite.
- **Backend / Storage**: Supabase (PostgreSQL, Realtime, Storage).
- **AI Engine**: Google Vertex AI (Gemini 2.5 Pro for text/logic, Imagen for banners).
- **Deployment**: Local execution (Secretaries), GitHub Actions (Automation).

## Key Components

### 1. Multi-Layer News Orchestrator
- **Layers**: Country (DE) → Bundesland (State) → City.
- **Goal**: Deliver highly relevant news to Ukrainians based on their specific location in Germany.
- **Agent Pipeline**:
  - Collection (RSS feeds).
  - Rule-based filtering (Keywords/Blocklists).
  - LLM Classification & Summarization (Gemini).
  - Translation (German → Ukrainian).
  - Geo-routing.
  - Deduplication.

### 2. Personal Secretary Bot
- **Hybrid Mode**: Combined "Live Mode" (long-polling/server-side) and scheduled "Cloud Mode".
- **Interaction**: Natural language understanding, image processing (vision), and administrative assistance.

### 3. News Banner System
- **Purpose**: Generates weekly AI-visualized banners for news categories.
- **Engine**: Google Vertex AI Imagen.
- **Automation**: Weekly GitHub Action.

## Major Architectural Decisions

### Modular Pipeline Pattern
- **Decision**: Evolve from monolithic scripts to a modular pipeline where each processing step (Collect, Filter, Enrich, Persist) is a discrete, testable unit.
- **Rationale**: Improves maintainability, testability, and allows for interchangeable components (e.g., swapping AI providers).

### Persistent State-Aware Pipeline
- **Decision**: Persist the state of items in a `processing_queue` throughout their lifecycle.
- **Rationale**: Ensures resilience against failures, enables easy retries/self-healing, and provides observability into the pipeline's health.

### Geo-Scoped Scaling
- **Decision**: Use a logic-based routing system (`CITY` > `STATE` > `COUNTRY`) to manage information density and relevance.
- **Rationale**: Prevents users from being overwhelmed while ensuring they don't miss critical local news.

## Technical Standards
- **Language**: TypeScript (Strict mode).
- **Environment**: ESM, Node.js 20+.
- **Security**: Service accounts for GCP, Supabase RLS, Environment variables for all secrets.
