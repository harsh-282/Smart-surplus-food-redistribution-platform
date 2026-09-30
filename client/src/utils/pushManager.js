/**
 * Utility function to convert VAPID public key from URL-safe base64 string to Uint8Array
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Service Worker and Push Manager are supported by the browser
 */
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Registers the Service Worker (/sw.js)
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('✅ ServiceWorker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ ServiceWorker registration failed:', error);
    return null;
  }
}

/**
 * Gets current notification permission and active push subscription state
 */
export async function getPushSubscriptionState() {
  if (!isPushNotificationSupported()) {
    return { isSupported: false, permission: 'unsupported', isSubscribed: false };
  }

  const permission = Notification.permission;
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  
  if (!registration) {
    return { isSupported: true, permission, isSubscribed: false };
  }

  const subscription = await registration.pushManager.getSubscription();
  return {
    isSupported: true,
    permission,
    isSubscribed: Boolean(subscription),
    subscription,
  };
}

/**
 * Prompts user for permission and subscribes to Web Push Notifications
 * @param {AxiosInstance} api - Axios API client instance
 */
export async function subscribeUserToPush(api) {
  if (!isPushNotificationSupported()) {
    throw new Error('Web Push Notifications are not supported on this browser or device.');
  }

  // 1. Check/Request Notification Permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'denied') {
    throw new Error('Notification permission was denied. Please enable notifications in your browser settings.');
  }

  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  // 2. Ensure Service Worker is registered
  let registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) {
    registration = await registerServiceWorker();
  }

  if (!registration) {
    throw new Error('Failed to register service worker for push notifications.');
  }

  // Wait until service worker is ready
  await navigator.serviceWorker.ready;

  // 3. Get VAPID public key from backend
  const res = await api.get('/notifications/vapid-key');
  const publicKey = res.data?.publicKey;

  if (!publicKey) {
    throw new Error('Failed to fetch VAPID public key from server.');
  }

  const convertedKey = urlBase64ToUint8Array(publicKey);

  // 4. Subscribe with PushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  });

  // 5. Send subscription to backend database
  await api.post('/notifications/subscribe', {
    subscription,
    userAgent: navigator.userAgent,
  });

  return subscription;
}

/**
 * Unsubscribes current browser session from Web Push Notifications
 * @param {AxiosInstance} api - Axios API client instance
 */
export async function unsubscribeUserFromPush(api) {
  if (!isPushNotificationSupported()) return false;

  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) return false;

  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await api.post('/notifications/unsubscribe', { endpoint });
  }

  return true;
}
