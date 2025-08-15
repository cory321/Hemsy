// Mock for isows WebSocket library (ESM-friendly)
class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 0;
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
  }

  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
}

export const WebSocket = globalThis.WebSocket ?? MockWebSocket;
export const NativeWebSocket = WebSocket;
export default WebSocket;
