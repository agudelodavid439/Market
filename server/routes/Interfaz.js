import express from 'express';

const router = express.Router();

// Ruta raíz
router.get('/', (req, res) => {
	// Escapar los backticks internos usando \`
	res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chat Groq AI</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary-text: #ffffff;
                    --secondary-text: #b0b7c3;
                    --system-msg-bg: rgba(255, 255, 255, 0.05);
                    --user-msg-bg: rgba(25, 118, 210, 0.15);
                    --ai-msg-bg: rgba(255, 255, 255, 0.07);
                    --input-bg: rgba(255, 255, 255, 0.07);
                    --border-color: rgba(255, 255, 255, 0.1);
                    --accent-color: #4d84e6;
                    --avatar-size: 35px;
                    --avatar-border-radius: 50%;
                    --message-gap: 10px;
                }

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    font-family: 'Inter', sans-serif;
                    color: var(--primary-text);
                    background-color: #0a1929;
                }

                .chat-container {
                    width: 100%;
                    max-width: 900px;
                    height: 100vh;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
                }

                .chat-header {
                    padding: 20px 25px;
                    border-bottom: 1px solid var(--border-color);
                }

                .chat-header h1 {
                    font-size: 22px;
                    font-weight: 500;
                    color: var(--primary-text);
                    letter-spacing: 0.5px;
                }

                .messages-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    scroll-behavior: smooth;
                }

                .message {
                    margin-bottom: 18px;
                    display: flex;
                    max-width: 85%;
                    align-items: flex-start;
                    gap: 10px;
                }

                .message-avatar {
                    width: 35px;
                    height: 35px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--accent-color), #2c4167);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    transition: transform 0.2s;
                }

                .message-avatar:hover {
                    transform: scale(1.05);
                }

                .message-user .message-avatar {
                    background: linear-gradient(135deg, #1976d2, #1565c0);
                }

                .message-user {
                    margin-left: auto;
                    flex-direction: row-reverse;
                }

                .message-ai {
                    margin-right: auto;
                }

                .avatar-icon {
                    width: 20px;
                    height: 20px;
                    fill: white;
                }

                .message-content {
                    padding: 14px 18px;
                    border-radius: 10px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    min-width: 100px;
                    max-width: calc(100% - 50px);
                }

                .message-user .message-content {
                    background-color: var(--user-msg-bg);
                    border-radius: 10px 2px 10px 10px;
                }

                .message-ai .message-content {
                    background-color: var(--ai-msg-bg);
                    border-radius: 2px 10px 10px 10px;
                }

                .input-container {
                    padding: 20px;
                    border-top: 1px solid var(--border-color);
                }

                .input-group {
                    display: flex;
                    align-items: center;
                    background-color: var(--input-bg);
                    border-radius: 10px;
                    padding: 4px 8px;
                    border: 1px solid var(--border-color);
                }

                .message-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: var(--primary-text);
                    padding: 14px;
                    font-size: 15px;
                    font-family: 'Inter', sans-serif;
                }

                .message-input:focus {
                    outline: none;
                }

                .message-input::placeholder {
                    color: var(--secondary-text);
                }

                .send-button {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: var(--accent-color);
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <div class="chat-header">
                    <h1>Chat Groq AI</h1>
                </div>
                <div class="messages-area" id="messages"></div>
                <div class="input-container">
                    <form id="chat-form" class="input-group">
                        <input type="text" class="message-input" placeholder="Escriba su mensaje..." required>
                        <button type="submit" class="send-button">→</button>
                    </form>
                </div>
            </div>
            <script>
                const form = document.getElementById('chat-form');
                const input = form.querySelector('input');
                const messagesDiv = document.getElementById('messages');

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const pregunta = input.value.trim();
                    if (!pregunta) return;

                    addMessage(pregunta, 'user');
                    input.value = '';

                    try {
                        const response = await fetch('/api/chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ pregunta })
                        });

                        const data = await response.json();
                        addMessage(data.respuesta, 'ai');
                    } catch (error) {
                        console.error('Error:', error);
                        addMessage('Error de conexión', 'system');
                    }
                });

                function addMessage(text, sender) {
                    const div = document.createElement('div');
                    div.className = 'message message-' + sender;
                    
                    const avatarSvg = sender === 'user' ? 
                        '<svg class="avatar-icon" viewBox="0 0 24 24"><path d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/></svg>' :
                        '<svg class="avatar-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
                    
                    div.innerHTML = \`
                        <div class="message-avatar">
                            \${avatarSvg}
                        </div>
                        <div class="message-content">
                            <span class="message-text">\${text}</span>
                            <span class="message-time">
                                \${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    \`;
                    
                    messagesDiv.appendChild(div);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            </script>
        </body>
        </html>
    `);
});

// Exportar el router para usarlo en el servidor principal
export default router;
