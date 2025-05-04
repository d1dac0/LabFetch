declare module 'event-source-polyfill' {
    interface EventSourcePolyfillInit extends EventSourceInit {
        headers?: Record<string, string>;
        // Add other options from the polyfill if needed
    }

    export class EventSourcePolyfill extends EventSource {
        constructor(url: string, eventSourceInitDict?: EventSourcePolyfillInit);
        // Add specific methods or properties from the polyfill if needed
    }
} 