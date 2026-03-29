import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

export function useAppSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect to same origin
    const socket = io("/", {
      path: "/socket.io",
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join", { userId: user.id, role: user.role });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("notification", (data) => {
      // Invalidate notifications query to fetch fresh ones
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

      // Show toast
      toast({
        title: data.title || "New Notification",
        description: data.message,
        duration: 5000
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient, toast]);

  return { socket: socketRef.current, isConnected };
}