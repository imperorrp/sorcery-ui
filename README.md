# Project Live-Component-Editor

**A professional-grade, visual editor for live React components.**

This project is a high-fidelity implementation of a tool that allows developers to paste React component code, interact with it in a live preview, and visually edit its properties. It is designed with a robust, extensible architecture to handle complex, real-world components.

[**View the Live Demo**](#) <!-- Placeholder for deployed link -->
[**Read the Full Technical Plan**](./PLAN.md)

---

## Core Features

*   **Live Component Rendering:** Paste raw JSX/TSX code and see it render instantly in a sandboxed `iframe`.
*   **Visual WYSIWYG Editing:** Click on any element to select it and modify its styles (typography, layout, color) through a user-friendly inspector panel.
*   **Multi-Component Support:** Manage and render components that call other components within a shared workspace.
*   **Real-World Environment Simulation:** Configure props, context providers (like Theme or Redux), and inject 3rd-party libraries (e.g., Framer Motion) to replicate a production environment.
*   **AI-Assisted Workflow:** Generate mock props and component boilerplate using AI to accelerate the setup process.
*   **Code Generation:** Get clean, formatted JSX code as an output that reflects your visual changes.
*   **Full History:** Unlimited undo and redo for all actions.

## Tech Stack

*   **Frontend:** React (Vite), Zustand, Tailwind CSS, Monaco Editor, Babel, DOMPurify
*   **Backend:** Node.js, Express.js, MongoDB, Mongoose
*   **Deployment:** Vercel (Client), Render (Server & DB)

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm / yarn / pnpm
*   A MongoDB Atlas account (or a local MongoDB instance)

### Installation & Setup
1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd live-component-editor
    ```
2.  **Install all dependencies:**
    *(This will install for the root, client, and server workspaces)*
    ```bash
    npm install
    ```
3.  **Configure environment variables:**
    *   In the `/server` directory, create a `.env` file from the `.env.example`.
    *   Add your MongoDB connection string: `MONGO_URI=your_connection_string`
4.  **Run the application:**
    ```bash
    # This concurrently starts the client (localhost:5173) and the server (localhost:3000)
    npm run dev
    ```

## Project Structure

This project is a monorepo managed by npm workspaces.

```
/
├── client/ # Contains the Vite + React frontend application
├── server/ # Contains the Express.js + MongoDB backend API
└── package.json # Root package file with workspace definitions
``` 

---