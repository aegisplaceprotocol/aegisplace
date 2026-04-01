import { useEffect, useRef, useState, useCallback } from "react";
import { withApiBase } from "@/lib/api";

export type SSEEventType = "invocation" | "registration" | "dispute" | "validator_join";

export interface LiveFeedEvent {
  id: string;
  event: SSEEventType;
  data: Record<string, unknown> & { timestamp: number };
}

const MAX_EVENTS = 100;
const RECONNECT_DELAY_MS = 3000;

export function useLiveFeed() {
  const [events, setEvents] = useState<LiveFeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addEvent = useCallback((event: LiveFeedEvent) => {
    setEvents((prev) => {
      const next = [event, ...prev];
      if (next.length > MAX_EVENTS) next.length = MAX_EVENTS;
      return next;
    });
  }, []);

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(withApiBase("/api/feed"));
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    const handleEvent = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        addEvent({
          id: e.lastEventId || String(Date.now()),
          event: e.type as SSEEventType,
          data,
        });
      } catch {
        // Ignore malformed events
      }
    };

    // Listen for each event type
    es.addEventListener("invocation", handleEvent);
    es.addEventListener("registration", handleEvent);
    es.addEventListener("dispute", handleEvent);
    es.addEventListener("validator_join", handleEvent);

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      // Auto-reconnect after delay
      reconnectTimer.current = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY_MS);
    };
  }, [addEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);

  return { events, connected };
}
