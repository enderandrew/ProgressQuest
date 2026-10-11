/**
 * Progress Quest - Matrix Screensaver Controller
 * Activates after 5 minutes of inactivity if the tab is focused.
 * Wakes up immediately upon any mouse movement, click, or keypress.
 */
(function () {
    const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const CHECK_INTERVAL_MS = 1000;        // Check every second

    let lastActivityTime = Date.now();
    let isScreensaverActive = false;
    let containerEl = null;

    function isTabFocused() {
        return typeof document.hasFocus === 'function' ? document.hasFocus() && !document.hidden : !document.hidden;
    }

    function recordActivity() {
        lastActivityTime = Date.now();
        if (isScreensaverActive) {
            wakeUp();
        }
    }

    function startScreensaver() {
        if (isScreensaverActive) return;
        isScreensaverActive = true;

        containerEl = document.createElement('div');
        containerEl.id = 'pq-screensaver-container';
        containerEl.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: 0',
            'width: 100vw',
            'height: 100vh',
            'z-index: 2147483647',
            'background: #000',
            'margin: 0',
            'padding: 0',
            'overflow: hidden',
            'cursor: default'
        ].join(';');

        const iframe = document.createElement('iframe');
        iframe.id = 'pq-screensaver-frame';
        iframe.src = 'matrix.html';
        iframe.style.cssText = 'width: 100%; height: 100%; border: none; display: block; background: #000;';

        iframe.onload = function () {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach(function (evt) {
                    doc.addEventListener(evt, recordActivity, { passive: true });
                });
            } catch (e) {
                // Fallback handled via postMessage inside matrix.html
            }
        };

        containerEl.appendChild(iframe);
        document.body.appendChild(containerEl);
    }

    function wakeUp() {
        if (!isScreensaverActive) return;
        isScreensaverActive = false;
        lastActivityTime = Date.now();

        if (containerEl && containerEl.parentNode) {
            const iframe = containerEl.querySelector('iframe');
            if (iframe) {
                iframe.src = 'about:blank'; // Force immediate termination of Babylon WebGL render loop
            }
            containerEl.parentNode.removeChild(containerEl);
        }
        containerEl = null;
    }

    // Periodically verify idle duration and focus state
    setInterval(function () {
        if (!isScreensaverActive) {
            const elapsed = Date.now() - lastActivityTime;
            if (isTabFocused() && elapsed >= IDLE_TIMEOUT_MS) {
                startScreensaver();
            }
        }
    }, CHECK_INTERVAL_MS);

    // Primary input listeners on main window
    const events = ['mousemove', 'mousedown', 'mouseup', 'keydown', 'touchstart', 'wheel'];
    events.forEach(function (evt) {
        window.addEventListener(evt, recordActivity, { passive: true, capture: true });
    });

    // Tab state listeners
    window.addEventListener('focus', function () {
        lastActivityTime = Date.now();
    });

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            lastActivityTime = Date.now();
        }
    });

    // Cross-frame messaging from matrix.html
    window.addEventListener('message', function (evt) {
        if (evt.data === 'screensaver-wakeup') {
            recordActivity();
        }
    });
})();
