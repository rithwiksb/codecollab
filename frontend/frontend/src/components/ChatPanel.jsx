import React, { useState, useEffect, useRef } from 'react';

// This component will integrate with your existing Socket.io chat implementation
const ChatPanel = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Your existing chat initialization code would go here
    // This would connect to your socket server for chat messages
    console.log(`Initializing chat for room ${roomId}`);
    
    // Example of how you might handle incoming messages
    // socket.on('chat_message', (data) => {
    //   setMessages(prevMessages => [...prevMessages, data]);
    // });
    
    // Clean up function for disconnecting when component unmounts
    return () => {
      console.log('Cleaning up chat resources');
      // Your existing cleanup code would go here
    };
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Your existing code to send a chat message via socket would go here
    // socket.emit('chat_message', { roomId, message: newMessage });
    
    // For demo purposes, we'll just add it locally
    const messageObj = {
      id: Date.now(),
      sender: 'You',
      text: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, messageObj]);
    setNewMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat</h3>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.sender === 'You' ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-sender">{msg.sender}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;