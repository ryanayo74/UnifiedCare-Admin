import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import '../../css/MessageDetailsPage.css'; // Ensure you have corresponding CSS

function MessageDetailsPage() {
  const { userId } = useParams(); // Get userId from URL
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Fetch messages between the facility and the selected user
        const querySnapshot = await getDocs(collection(db, 'messages', userId, 'messageThread'));
        const messagesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [userId]);

  if (loading) return <p>Loading messages...</p>;

  return (
    <div className="message-details-page">
      <div className="message-header">
        <h2>Chat with Parent {userId}</h2> {/* Adjust parent details as needed */}
      </div>

      <div className="message-thread">
        {messages.map((message) => (
          <div key={message.id} className="message-bubble">
            <p>{message.text}</p>
            <span className="message-time">{new Date(message.timestamp?.toDate()).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      
      {/* Input to send new messages */}
      <div className="message-input-container">
        <input type="text" placeholder="Type your message..." />
        <button className="send-message-btn">Send</button>
      </div>
    </div>
  );
}

export default MessageDetailsPage;
