import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

let stompClient = null;
let subscriptionQueue = [];

export const connectOrderSocket = (topicId, onMessage) => {
  // 1. If already connected, subscribe immediately and exit
  if (stompClient && stompClient.connected) {
    console.log(`📡 Adding immediate subscription for: ${topicId}`);
    stompClient.subscribe(`/topic/orders/${topicId}`, (message) => {
      onMessage(JSON.parse(message.body));
    });
    return;
  }

  // 2. If already connecting, queue this request and exit
  if (stompClient && stompClient.active) {
    subscriptionQueue.push({ topicId, onMessage });
    return;
  }

  // 3. Start fresh connection
  const socket = new SockJS("http://localhost:8080/ws");
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    
    onConnect: () => {
      console.log(`✅ WebSocket connected. Initializing subscriptions...`);
      
      // Subscribe to the initial request
      stompClient.subscribe(`/topic/orders/${topicId}`, (message) => {
        onMessage(JSON.parse(message.body));
      });

      // Process any queued subscriptions (prevents the "No underlying connection" error)
      while (subscriptionQueue.length > 0) {
        const { topicId: qId, onMessage: qFn } = subscriptionQueue.shift();
        stompClient.subscribe(`/topic/orders/${qId}`, (msg) => qFn(JSON.parse(msg.body)));
      }
    },

    onStompError: (frame) => {
      console.error("❌ STOMP error:", frame.headers['message']);
    },

    onWebSocketClose: () => {
      console.warn("🔌 WebSocket connection closed.");
    }
  });

  stompClient.activate();
};

export const disconnectSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    subscriptionQueue = [];
    console.log("🔌 WebSocket deactivated");
  }
};