# CodeCollab

**CodeCollab** is a real-time collaborative coding platform that enables users to create, join, and work together in coding rooms with live video chat, code editing, and instant messaging. Designed for pair programming, interviews, study groups, and remote team collaboration, CodeCollab brings seamless communication and productivity to your browser.

---

## 🚀 Features

- **Live Code Collaboration:** Real-time code editing with syntax highlighting for multiple languages.
- **Video & Audio Chat:** Built-in video call for face-to-face collaboration.
- **Instant Messaging:** Integrated chat panel for quick discussions and sharing code snippets.
- **Room Management:** Create, join, and delete rooms. Only room owners can delete their rooms.
- **User Authentication:** Secure JWT-based login and registration.
- **Language Selection:** Switch between popular programming languages in the editor.
- **Responsive UI:** Modern, dark-themed interface optimized for desktop browsers.

---

## 🛠️ Tech Stack

- **Frontend:** React, Socket.IO-client, CodeMirror, CSS
- **Backend:** Flask, Flask-SocketIO, Flask-JWT-Extended, SQLite/MySQL
- **WebRTC:** For real-time video and audio communication
- **Authentication:** JWT (JSON Web Tokens)

---

## ⚡ Getting Started

### Prerequisites

- Node.js & npm
- Python 3.x & pip

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/CodeCollab.git
cd CodeCollab
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```
### 3. Frontend Setup
```bash
cd frontend/frontend
npm install
npm run dev
```

### 4. Open in Local Broswer
Visit http://localhost:5173 to start collaborating!


📚 Usage
Create a Room: From the dashboard, click "Create New Room".
Join a Room: Enter a room code or select from your collaboration rooms.
Collaborate: Use the code editor, chat, and video call features.
Delete Room: Only the room owner can delete a room from within the room view.
📝 Contributing
Contributions are welcome! Please open issues or submit pull requests for new features, bug fixes, or improvements.

📄 License
You are not allowed to commercially use this project, you are free to use the components of this project for non-profit purposes with appropriate credits

🙏 Acknowledgements
React
Flask
Socket.IO
CodeMirror
WebRTC
Happy Collaborating! 🚀 ```