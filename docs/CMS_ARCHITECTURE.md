# CreatorX Website Builder & CMS Architectural Overview

## Architecture Principles
1. **Zero Hardcoded Public Content**: Every piece of public content—from the homepage hero, statistics, feature cards, and announcements down to navigation links and footer details—is driven by the CMS engine.
2. **Dual Storage Resilience**: Reads/writes operate seamlessly against Supabase PostgreSQL when connected, while falling back gracefully to persistent localStorage state when working offline or in local development.
3. **Glassmorphism Design Tokens**: All builder controls and dynamic public elements adhere to the CreatorX luxury design system (`src/styles/globals.css`), supporting **Dark**, **Light**, and **AMOLED** themes.
4. **Security & Input Sanitization**: Custom code snippets and rich text content are isolated and controlled via admin policies, preventing unauthorized script execution.
5. **Autosave & Version Control**: Every change automatically captures a version snapshot, allowing page comparison and rollback at any time.
