# Sorcery UI

**A GUI-based low/no-code tool for design engineers and developers to fine-tune and precisely calibrate UI elements and components.**

This project is a high-fidelity implementation of a tool that allows developers to paste React component code, interact with it in a live preview, and visually edit its properties. It is designed with a robust, extensible architecture to handle complex, real-world components.

Save on tokens (and therefore $$$) by not having to go back and forth with AI for simple tweaks. Save on time if you want to manually explore and tune certain values to find just the perfect look for your design needs.

This MVP is currently designed to work with React based components, standard CSS, and Tailwind CSS classes. Context, dependencies, props, and child components can all be loaded in and rendered to check out. More to come soon.

Work on the browser client directly by copy pasting code in and copy pasting your final output back out or via MCP connection to your IDE or AI builder tool of your choice.

[**View the Live Demo**](#) <!-- Placeholder for deployed link -->
[**Read the Full Technical Plan**](./PLAN.md)

---

## Core Features

*   **Live Component Rendering:** Paste raw JSX/TSX code and see it render instantly in a sandboxed `iframe`.
*   **Smart Selection:** Click to select elements, or hold `Shift` + click for overlapping elements to choose from an enhanced context menu with visual layer indicators and live element highlighting.
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
*   pnpm (recommended) or npm / yarn
*   A MongoDB Atlas account (or a local MongoDB instance)

### Installation & Setup
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/imperorrp/runable-task.git
    cd runable-task
    ```
2.  **Install pnpm globally (if not already installed):**
    ```bash
    npm install -g pnpm
    ```
3.  **Install all dependencies:**
    *(This will install for the root, client, and server workspaces)*
    ```bash
    pnpm install
    ```
4.  **Configure environment variables:**
    *   In the `/server` directory, create a `.env` file from the `.env.example`.
    *   Add your MongoDB connection string: `MONGO_URI=your_connection_string`
5.  **Run the application:**
    ```bash
    # This concurrently starts the client (localhost:5173) and the server (localhost:3000)
    pnpm run dev
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

## Note to self:

This could be a nice useful MCP server for frontend dev work: a sort of human-in-the-loop editor that opens up (via an MCP tool call) to help tweak the last 10-20% of design of portions of a frontend. This can be frustrating to get AI to do perfectly, and a lot of back and forths b/w a human and AI agentic IDE can be avoided by manually tweaking some styles and so on for near-instant previews via this editor. Some no-code platforms have solutions for this already, like V0 and Runable, but IDEs proper like VSCode don't (yet) - a place where this would be useful 
