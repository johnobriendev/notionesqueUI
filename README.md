# Esque

A powerful task management application built with React, Redux, TypeScript, and Tailwind CSS. Manage your tasks with advanced capabilities similar to a simplified Notion database, featuring multiple view modes, drag-and-drop functionality, and full undo/redo support.

**🚀 Live Application:** [esque.click](https://esque.click/)

---

## Table of Contents

- [Features](#features)
- [How to Use](#how-to-use)
  - [Creating Tasks](#creating-tasks)
  - [Managing Tasks](#managing-tasks)
  - [Using Views](#using-views)
  - [Filtering and Searching](#filtering-and-searching)
  - [Undo/Redo](#undoredo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [License](#license)

---

## Features

### Multiple View Modes

* **List View**: Table format with sorting and pagination
* **Kanban View**: Drag-and-drop interface organized by priority

### Rich Task Management

* Create, edit, and delete tasks
* Set title, description, status, and priority
* Add custom fields for extended information
* View detailed task information

### Advanced Filtering & Sorting

* Filter by status and priority
* Search by task name
* Sort by any column in list view

### User-Friendly Interface

* Drag and drop tasks between priority columns
* Bulk selection and actions
* Responsive design for all screen sizes

### Data Persistence

* Automatic local storage saving
* Undo/redo functionality for all actions

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React** | UI library for building the interface |
| **TypeScript** | Static typing for better development experience |
| **Redux Toolkit** | State management with advanced features |
| **Redux-Persist** | Local storage persistence |
| **Auth0** | Authentication and user management |
| **React Router** | Client-side routing |
| **Axios** | HTTP client for API requests |
| **@hello-pangea/dnd** | Drag-and-drop functionality |
| **Tailwind CSS** | Utility-first CSS framework |
| **Vite** | Build tool and development server |

---

## Architecture

This project demonstrates several advanced architectural patterns and best practices:

**Custom Command Pattern**
- Implemented a custom Command Pattern for managing undo/redo functionality
- Provides robust state management with full action history
- All operations (create, edit, delete, priority changes) are fully reversible

**Feature-Based Organization**
- Code organized by feature rather than file type
- Each feature contains its own components, hooks, services, and state management
- Promotes modularity and maintainability

**State Management**
- Redux Toolkit for centralized state management
- Redux async thunks for handling asynchronous operations
- Redux-Persist for selective state persistence
- Optimized selectors for performance

**Type Safety**
- Full TypeScript implementation throughout the codebase
- Strongly typed Redux store and actions
- Type-safe API calls and component props

---

## How to Use

Visit [esque.click](https://esque.click/) to start using the application. No installation required!

### Creating Tasks

1. Click the **"Create Task"** button in the header
2. Fill in the task details:
   - **Title** (required)
   - **Description** (optional)
   - **Status** (Not Started, In Progress, Completed)
   - **Priority** (Low, Medium, High, Urgent)
   - **Custom Fields** (optional)
3. Click **"Create"** to add the task

### Managing Tasks

- **Edit a Task** - Click the "Edit" button on a task card or in the detail view
- **Delete a Task** - Click the "Delete" button on a task card or in the detail view
- **Bulk Actions** - Select multiple tasks in list view to perform actions on them

### Using Views

- Toggle between **List** and **Kanban** views using the buttons in the header
- **List View** - Sort by clicking column headers, paginate with controls at the bottom
- **Kanban View** - Drag tasks between priority columns to change their priority

### Filtering and Searching

- Use the **search box** to find tasks by title
- Use the **Status** and **Priority** dropdowns to filter tasks
- Filters work in both List and Kanban views

### Undo/Redo

- Use the **undo** and **redo** buttons in the header to revert or restore changes
- All actions (create, edit, delete, priority changes) can be undone

---

## Project Structure

```
src/
├── app/                    # Redux store setup and app hooks
│   ├── hooks.ts            # Custom Redux hooks
│   └── store.ts            # Redux store configuration
├── auth/                   # Authentication related components
│   └── AuthProvider.tsx    # Authentication context provider
├── components/             # UI components
│   ├── layout/             # Layout components
│   │   ├── AuthLayout.tsx  # Authentication layout wrapper
│   │   ├── DashboardHeader.tsx # Dashboard header component
│   │   └── Header.tsx      # Main header component
│   ├── modals/             # Modal components
│   │   └── DeleteConfirmModal.tsx # Delete confirmation modal
│   └── ui/                 # Common UI components
│       └── LoadingSpinner.tsx # Loading spinner component
├── features/               # Feature-based organization
│   ├── commands/           # Command pattern implementation
│   │   ├── store/          # Command state management
│   │   │   └── commandSlice.ts
│   │   ├── types/          # Command type definitions
│   │   │   └── commandTypes.ts
│   │   └── taskCommands.ts # Task-specific commands
│   ├── projects/           # Project management feature
│   │   ├── components/     # Project-specific components
│   │   │   ├── ProjectDashboard.tsx
│   │   │   └── ProjectView.tsx
│   │   ├── hooks/          # Project-specific hooks
│   │   ├── services/       # Project business logic
│   │   │   └── projectService.ts
│   │   └── store/          # Project state management
│   │       ├── projectSelectors.ts
│   │       └── projectsSlice.ts
│   ├── tasks/              # Task management feature
│   │   ├── components/     # Task-specific components
│   │   │   ├── BulkEditModal.tsx
│   │   │   ├── TaskDetailVIew.tsx
│   │   │   └── TaskModal.tsx
│   │   ├── hooks/          # Task-specific hooks
│   │   ├── services/       # Task business logic
│   │   │   └── taskService.ts
│   │   └── store/          # Task state management
│   │       ├── taskSelectors.ts
│   │       └── tasksSlice.ts
│   └── ui/                 # UI state management
│       ├── components/     # UI-specific components
│       │   └── HistoryControls.tsx
│       └── store/          # UI state slice
│           └── uiSlice.ts
├── lib/                    # Utility libraries
│   ├── api.ts              # API configuration and utilities
│   └── utils.ts            # Common utility functions
├── types/                  # TypeScript type definitions
│   └── index.ts            # Global type definitions
├── views/                  # Main application views
│   ├── KanbanView.tsx      # Kanban board view
│   ├── ListView.tsx        # List/table view
│   └── WelcomePage.tsx     # Welcome/landing page
├── App.tsx                 # Main App component
├── index.css               # Global styles
├── main.tsx                # Entry point
├── setupTests.ts           # Test configuration
└── vite-env.d.ts           # Vite environment types
```

---

## Local Development

Want to run this project locally or contribute? Follow these steps:

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Setup

**1. Clone the repository**

```bash
git clone https://github.com/johnobriendev/notionesque.git
cd notionesque
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development server**

```bash
npm run dev
```

**4. Open your browser**

Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

