import { currentIdToken } from './firebase';

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface Handlers {
  onMessage?: (data: any) => void;
  onError?: (msg: string) => void;
  /** Fires only on UNEXPECTED disconnects (never on intentional disconnect()). */
  onDisconnect?: () => void;
  onReconnect?: () => void;
}

/**
 * Port of the Flutter WebSocketClient. Auto-injects userId into every outgoing
 * message, refreshes the Firebase token before each reconnect, keeps a
 * heartbeat, and — critically — does NOT fire onDisconnect on an intentional
 * disconnect (so the feedback navigation race can't trigger).
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private status: WsStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalDisconnect = false;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((e: unknown) => void) | null = null;
  private connectPromise: Promise<void> | null = null;

  static readonly maxReconnectAttempts = 5;
  static readonly reconnectDelayMs = 2000;

  constructor(
    private readonly url: string,
    private readonly userId: string,
    private readonly sessionId: string,
    private readonly handlers: Handlers,
  ) {}

  get connectionStatus(): WsStatus {
    return this.status;
  }
  get isConnected(): boolean {
    return this.status === 'connected';
  }

  connect(authToken?: string | null): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return this.connectPromise ?? Promise.resolve();
    }
    this.status = 'connecting';
    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
    });

    try {
      const wsUrl =
        authToken && authToken.length > 0
          ? `${this.url}${this.url.includes('?') ? '&' : '?'}token=${encodeURIComponent(authToken)}`
          : this.url;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        const wasReconnecting = this.reconnectAttempts > 0;
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        if (wasReconnecting) this.handlers.onReconnect?.();
        this.connectResolve?.();
      };
      this.socket.onmessage = (ev) => this.handleMessage(ev.data);
      this.socket.onerror = () => {
        this.handlers.onError?.('WebSocket error');
      };
      this.socket.onclose = () => this.handleDisconnect();
    } catch (e) {
      this.status = 'disconnected';
      this.connectReject?.(e);
      this.scheduleReconnect();
      throw e;
    }

    return this.connectPromise;
  }

  async waitForConnection(): Promise<void> {
    if (this.connectPromise) await this.connectPromise;
  }

  private handleMessage(raw: unknown): void {
    try {
      const data = JSON.parse(raw as string);
      this.handlers.onMessage?.(data);
    } catch (e) {
      this.handlers.onError?.(`Failed to parse message: ${e}`);
    }
  }

  private handleDisconnect(): void {
    if (this.intentionalDisconnect) return; // FE-BUG #6: stay silent
    this.status = 'disconnected';
    this.stopHeartbeat();
    this.handlers.onDisconnect?.();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (
      this.intentionalDisconnect ||
      this.reconnectAttempts >= WebSocketClient.maxReconnectAttempts
    ) {
      return;
    }
    this.status = 'reconnecting';
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = WebSocketClient.reconnectDelayMs * Math.min(this.reconnectAttempts + 1, 15);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      try {
        const newToken = await currentIdToken(true);
        await this.connect(newToken);
      } catch (e) {
        this.handlers.onError?.(`Failed to refresh token for reconnect: ${e}`);
        this.scheduleReconnect();
      }
    }, delay);
  }

  sendMessage(message: Record<string, unknown>): void {
    if (this.status !== 'connected' || !this.socket) {
      this.handlers.onError?.('Cannot send message: not connected');
      return;
    }
    try {
      const payload = { ...message, userId: this.userId };
      this.socket.send(JSON.stringify(payload));
    } catch (e) {
      this.handlers.onError?.(`Failed to send message: ${e}`);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) this.sendMessage({ type: 'ping' });
    }, 5 * 60 * 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    try {
      this.socket?.close(1000);
    } catch {
      /* ignore */
    }
    this.socket = null;
    this.status = 'disconnected';
  }
}
