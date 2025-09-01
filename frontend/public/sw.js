const CACHE_NAME = 'pomodoro-cache-v1';

// 서비스 워커 설치 시 즉시 캐싱할 파일 목록
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

const sw = self;
let timerId;

// 1. 설치 (Install)
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // 새 서비스 워커를 즉시 활성화합니다.
        return sw.skipWaiting();
      })
  );
});

// 2. 활성화 (Activate) - 오래된 캐시 정리
sw.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => sw.clients.claim())
  );
});

// 3. 요청 가로채기 (Fetch) - 캐시 우선 전략
sw.addEventListener('fetch', (event) => {
  // GET 요청만 캐싱합니다.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 응답이 있으면 바로 반환합니다.
        if (response) {
          return response;
        }
        // 캐시에 없으면 네트워크로 요청을 보냅니다.
        return fetch(event.request).then((networkResponse) => {
          // 유효한 응답을 받으면 캐시에 저장하고 반환합니다.
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // 오프라인 상태 등 에러 발생 시 대체 페이지를 보여줄 수 있습니다.
        // 예: return caches.match('/offline.html');
      })
  );
});

// 4. 커스텀 메시지 핸들링 (백그라운드 타이머)
sw.addEventListener("message", (event) => {
  if (event.data && event.data.type === "START_TIMER") {
    const { title, ...options } = event.data.notification;
    const delay = event.data.delay;
    if (timerId) clearTimeout(timerId);
    timerId = sw.setTimeout(() => {
      sw.registration.showNotification(title, options);
      timerId = undefined;
    }, delay);
  }

  if (event.data && event.data.type === "STOP_TIMER") {
    if (timerId) clearTimeout(timerId);
    timerId = undefined;
  }
});

// 5. 알림 클릭 이벤트
sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const focusedClient = clientList.find(client => client.focused);
      if (focusedClient) {
        return focusedClient.focus();
      }
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return sw.clients.openWindow('/');
    })
  );
});