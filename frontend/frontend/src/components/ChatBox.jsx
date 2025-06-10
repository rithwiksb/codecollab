import { useState, useEffect, useRef } from 'react';

function ChatBox({ messages = [], onSendMessage }) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (inputMessage.trim() === '') return;
    
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.isCurrentUser ? 'current-user' : ''}`}>
              <div className="message-header">
                <span className="username">{msg.username}</span>
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatBox;