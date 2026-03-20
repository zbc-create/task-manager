# TaskMaster

A web-based task management application for creating, viewing, updating, and deleting tasks, with built-in filtering, searching, due dates, and dark mode support.

## Features

- Task CRUD (add, edit, complete, delete)
- Priority and due-date support
- Active/Completed/All filters
- Debounced, case-insensitive search with match highlighting
- Dark mode toggle with persisted theme preference
- Toast notifications and smooth task animations
- Inline validation for task titles

## Tech Stack

- Next.js 16.2.0
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Production

```bash
npm run build
npm run start
```
