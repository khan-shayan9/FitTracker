# 💪 Fitness Tracker

A web app for gym trainers to manage clients and track fitness progress.

## Features

**Trainer Dashboard**
- Manage clients (add, edit, delete)
- Set monthly goals with auto-unlocked achievements
- Track measurements (in inches)
- Add coach notes & weekly check-ins
- Optional progress photos

**Client Portal**
- View profile & progress
- Track measurements history
- Read coach notes & feedback
- View goals & achievements

## Tech Stack
- React + Vite
- Supabase (PostgreSQL)
- Supabase Storage (photos)

## Quick Start

1. Clone & install: `npm install`
2. Set `.env.local` with Supabase keys
3. Run migrations in Supabase SQL Editor
4. Create `photos` storage bucket
5. Start: `npm run dev`

## Database

Tables: users, clients, measurements, goals, coach_notes, weekly_checkins, progress_photos

---

**Last Updated:** April 2026
