export {
  LIVE_LOCATION_NAMESPACE,
  LIVE_LOCATION_SOCKET_URL,
  SOCKET_BASE_URL,
  SOCKET_RECONNECTION_CONFIG,
} from "./config";
export {
  connectSocket,
  disconnectSocket,
  getLiveLocationSocket,
  listenToLocationUpdates,
} from "./live-location-socket";
