# 🎨 stroke.it

**stroke.it** is a collaborative whiteboard application where multiple users can draw together in real-time. Choose colors, brush sizes, shapes — then undo, redo, clear, or export your work. Connect with friends and draw together across the web!

---

## ✨ Features
- 🖌️ **Marker** — 4 brush sizes
- 🧽 **Eraser** — 4 sizes
- 🟧 **Shapes** — Rectangle, Circle, Triangle
- 🎨 **Color picker** — unlimited colors
- ↩️ **Undo / Redo** — step backward or forward
- 🧹 **Clear screen** — wipes the whole canvas
- 💾 **Export as PNG/PDF** — download your artwork
- 🌐 **Collaborative** — multiple users drawing in real-time

---

## 🖼️ Screenshot
![stroke.it preview](/asset/WhatsApp Image 2025-06-25 at 13.55.48.jpeg)

---

## 🧰 Tech Stack
- **Frontend** — HTML5 Canvas, CSS, JavaScript
- **Backend** — [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/) and [Socket.IO](https://socket.io/)
- **Communication** — WebSockets for real-time updates

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/smallskull/stroke.it.git
   cd stroke.it
2. Change line-5 of script.js to:
   ```bash
   var io = io.connect('http://localhost:6969');
3. Install dependencies:
   ```bash
   npm install
4. Start the server:
   ```bash
   npm run dev
5. Open the whiteboard in your browser
   ```bash
   http://localhost:6969

---

## 🎯 Usage
- Click a toolbar button to switch tools.
- Adjust brush or eraser size.
- Draw shapes or freehand.
- Pick any color with the color picker.
- Use undo, redo, or clear to manage your work.
- Export your canvas as PNG or PDF.

---

