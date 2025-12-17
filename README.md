# Spark AI Web UI

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

**Spark AI Web UI** is the official open-source web interface for **Spark AI**. This project provides a modern, high-performance, and user-friendly frontend for interacting with the Spark AI LLM, built with the latest web technologies.x

## 📖 Overview

This repository represents a complete rewrite and major upgrade from the previous iteration. It aims to resolve performance bottlenecks and improve code maintainability by leveraging a strongly typed architecture.

**Legacy Repository:**
This project supersedes the [Marki AI Legacy](https://github.com/vthanhduong/marki-ai-frontend-legacy). Users looking for the older version can refer to that repository for archival purposes.

## ✨ Key Features

* **Modern Architecture:** Built on React and Vite for lightning-fast HMR (Hot Module Replacement) and optimized production builds.
* **Type Safety:** Fully written in TypeScript to ensure code reliability and developer experience.
* **State Management:** Utilizes **Zustand** for a lightweight and scalable state management solution.
* **Responsive Design:** Optimized for a seamless experience across desktop and mobile devices.
* **Markdown Support:** Native rendering support for code blocks, tables, and rich text formatting within the chat interface.

## 🛠️ Tech Stack

* **Framework:** [React](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **State Management:** [Zustand](https://github.com/pmndrs/zustand)
* **Styling:** CSS Modules / TailwindCSS (Configurable)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/username/spark-ai-web-ui.git](https://github.com/username/spark-ai-web-ui.git)
    cd spark-ai-web-ui
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Configuration:**
    Rename `.env.example` to `.env` and configure your API endpoints and keys.
    ```bash
    cp .env.example .env
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or bug fixes, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeature`).
5.  Open a Pull Request.

Please ensure your code adheres to the existing style guidelines and includes appropriate type definitions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Maintained by Duong Thanh Vu*
