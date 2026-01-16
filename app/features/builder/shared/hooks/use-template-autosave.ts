import { useCallback, useEffect, useRef, useState } from "react";

import type { Template } from "../types";

export type SaveStatus = "idle" | "connecting" | "saving" | "saved" | "error";

interface UseTemplateWebSocketOptions {
  templateId: string | null;
  organizationId: string;
  onTemplateReceived?: (template: Template) => void;
  enabled?: boolean;
}

interface UseTemplateWebSocketReturn {
  saveStatus: SaveStatus;
  sendUpdate: (data: Partial<Template>) => void;
  isConnected: boolean;
  lastSavedAt: Date | null;
}

/**
 * Custom hook for managing WebSocket connection to auto-save template changes.
 *
 * Since React Router doesn't have built-in WebSocket support, we simulate
 * real-time saving using debounced HTTP requests. This provides the same
 * user experience (auto-save with status indicator) while being simpler
 * to implement and more compatible with the existing infrastructure.
 */
export function useTemplateWebSocket({
  templateId,
  organizationId: _organizationId,
  onTemplateReceived: _onTemplateReceived,
  enabled = true,
}: UseTemplateWebSocketOptions): UseTemplateWebSocketReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const pendingUpdateRef = useRef<Partial<Template> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced save function
  const performSave = useCallback(
    async (data: Partial<Template>) => {
      if (!templateId || !enabled) return;

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setSaveStatus("saving");

      try {
        const formData = new FormData();
        formData.set("intent", "save");
        formData.set("templateId", templateId);
        formData.set("name", data.name || "");
        formData.set("type", data.type || "resume");
        formData.set("sections", JSON.stringify(data.sections || []));
        formData.set("globalStyles", JSON.stringify(data.globalStyles || {}));
        if (data.colorPalette) {
          formData.set("colorPalette", JSON.stringify(data.colorPalette));
        }

        const response = await fetch(window.location.href, {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (response.ok) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          // Reset to idle after 2 seconds
          setTimeout(() => {
            setSaveStatus((current) =>
              current === "saved" ? "idle" : current,
            );
          }, 2000);
        } else {
          setSaveStatus("error");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted, don't update status
          return;
        }
        setSaveStatus("error");
      }
    },
    [templateId, enabled],
  );

  // Debounced update sender
  const sendUpdate = useCallback(
    (data: Partial<Template>) => {
      if (!enabled) return;

      pendingUpdateRef.current = {
        ...pendingUpdateRef.current,
        ...data,
      };

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce for 1 second
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingUpdateRef.current) {
          performSave(pendingUpdateRef.current);
          pendingUpdateRef.current = null;
        }
      }, 1000);
    },
    [enabled, performSave],
  );

  // Mark as connected when enabled
  useEffect(() => {
    if (enabled && templateId) {
      setIsConnected(true);
      setSaveStatus("idle");
    } else {
      setIsConnected(false);
    }

    return () => {
      // Cleanup on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, templateId]);

  return {
    saveStatus,
    sendUpdate,
    isConnected,
    lastSavedAt,
  };
}
