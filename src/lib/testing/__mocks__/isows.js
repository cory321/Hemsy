// Mock for isows WebSocket library
export const WebSocket =
  global.WebSocket ||
  class WebSocket {
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
  };

export const NativeWebSocket = WebSocket;
