class FocusPlay {
    constructor() {
        this.currentUrl = window.location.href;
        this.episodePattern = /episode|ep|part|chapter|season|s[0-9]+e[0-9]+/i;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.isFocusing = false;
        
        // Settings synced from popup
        this.enabled = false; 
        
        this.setupMessageListener();
    }

    async init() {
        if (!this.enabled) return;
        
        console.log('[FocusPlay] Activated on whitelisted domain');
        
        // Set up URL change detection
        this.setupUrlChangeDetection();
        
        // Initial attempt to focus media player if enabled
        setTimeout(() => this.focusMediaPlayer(), 1000);
        
        // Periodic check (in case detection misses something)
        setInterval(() => this.periodicCheck(), 10000);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'init_focus' && !this.enabled) {
                this.enabled = true;
                this.init();
            }
            
            // Live Setting Updates from Popup
            if (request.action === 'update_settings') {
                if (request.masterPower !== undefined) {
                    this.enabled = request.masterPower;
                    if (this.enabled) this.init(); // reactivate if turned back on
                }
            }
            
            sendResponse({ success: true });
            return true;
        });
    }

    setupUrlChangeDetection() {
        // Method 1: MutationObserver for SPA navigation
        this.observer = new MutationObserver((mutations) => {
            if (!this.enabled) return;
            
            const newUrl = window.location.href;
            if (newUrl !== this.currentUrl) {
                this.handleUrlChange(newUrl);
            }
        });

        this.observer.observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['href', 'src']
        });

        // Method 2: Listen for popstate and hashchange (for SPA)
        const handleNavigation = () => {
            if (!this.enabled) return;
            setTimeout(() => {
                this.handleUrlChange(window.location.href);
            }, 1000);
        };

        window.addEventListener('popstate', handleNavigation);
        window.addEventListener('hashchange', handleNavigation);

        // Method 3: Override pushState and replaceState for SPA
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function() {
            originalPushState.apply(this, arguments);
            window.dispatchEvent(new Event('pushstate'));
        };

        history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event('replacestate'));
        };

        window.addEventListener('pushstate', handleNavigation);
        window.addEventListener('replacestate', handleNavigation);
    }

    handleUrlChange(newUrl) {
        if (!this.enabled) return;
        
        if (this.isEpisodeChange(this.currentUrl, newUrl)) {
            console.log('[FocusPlay] Episode change detected, refocusing...');
            this.currentUrl = newUrl;
            this.retryCount = 0;
            
            // Wait for page to load, then focus media player
            setTimeout(() => {
                this.focusMediaPlayer();
            }, 3000);
        } else {
            this.currentUrl = newUrl;
        }
    }

    isEpisodeChange(oldUrl, newUrl) {
        if (oldUrl === newUrl) return false;
        
        return this.episodePattern.test(newUrl) || 
               this.looksLikeMediaUrl(newUrl) ||
               this.hasDifferentMediaContent();
    }

    looksLikeMediaUrl(url) {
        const mediaPatterns = [
            /\/watch\//,
            /\/video\//,
            /\/play\//,
            /\/episode\//,
            /\?episode=/,
            /\?video=/
        ];
        return mediaPatterns.some(pattern => pattern.test(url));
    }

    hasDifferentMediaContent() {
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');
        return videos.length > 0 || audios.length > 0;
    }

    async focusMediaPlayer() {
        if (!this.enabled || this.isFocusing) return false;
        
        this.isFocusing = true;
        
        const strategies = [
            () => this.quickPauseResumeMediaElements(),
            () => this.clickVideoElements(),
            () => this.clickCommonPlayerSelectors(),
            () => this.focusPlayerContainer()
        ];

        let success = false;

        for (const strategy of strategies) {
            if (await strategy.call(this)) {
                success = true;
                break;
            }
        }

        if (!success) {
            this.retryCount++;
            if (this.retryCount <= this.maxRetries) {
                setTimeout(() => {
                    this.isFocusing = false;
                    this.focusMediaPlayer();
                }, 2000);
            } else {
                this.isFocusing = false;
            }
        } else {
            this.retryCount = 0;
            this.isFocusing = false;
        }

        return success;
    }

    async quickPauseResumeMediaElements() {
        if (!this.enabled) return false;
        
        const mediaElements = [
            ...document.querySelectorAll('video'),
            ...document.querySelectorAll('audio')
        ];

        for (const media of mediaElements) {
            try {
                if (this.isVisibleAndSized(media)) {
                    const wasPlaying = !media.paused && !media.ended;
                    const currentTime = media.currentTime;
                    
                    media.focus();
                    
                    if (wasPlaying) {
                        media.pause();
                        await new Promise(resolve => setTimeout(resolve, 50));
                        media.currentTime = currentTime;
                        await media.play();
                    } else {
                        media.click();
                    }
                    return media; // Return the element, not just true
                }
            } catch (e) {
                // ignore
            }
        }
        return null;
    }

    clickVideoElements() {
        if (!this.enabled) return null;
        
        const mediaElements = [
            ...document.querySelectorAll('video'),
            ...document.querySelectorAll('audio')
        ];

        for (const media of mediaElements) {
            try {
                if (this.isVisibleAndSized(media)) {
                    media.focus();
                    media.click();
                    return media;
                }
            } catch (e) {
                // ignore
            }
        }
        return null;
    }

    clickCommonPlayerSelectors() {
        if (!this.enabled) return null;
        
        const selectors = [
            '[class*="video"][class*="player"]',
            '[class*="vp-player"]',
            '[class*="media-player"]',
            '[class*="video-container"]',
            '[class*="player-container"]',
            '.video-player',
            '.media-player',
            '.vp-player',
            '#video-player',
            '#media-player',
            '[class*="player"] video',
            '[class*="video"] video',
            '#player', // added sflix explicit selector
            '.player-bg'
        ];

        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (this.isVisibleAndSized(element)) {
                        element.focus();
                        element.click();
                        return element;
                    }
                }
            } catch (e) {
                // ignore
            }
        }
        return null;
    }

    focusPlayerContainer() {
        if (!this.enabled) return null;
        
        const containers = document.querySelectorAll('div, section, article');
        let largestContainer = null;
        let maxArea = 0;

        for (const container of containers) {
            if (this.isVisibleAndSized(container)) {
                const area = container.offsetWidth * container.offsetHeight;
                const classes = container.className.toLowerCase();
                const id = container.id.toLowerCase();

                if ((classes.includes('video') || classes.includes('player') || 
                     id.includes('video') || id.includes('player')) && 
                    area > maxArea) {
                    largestContainer = container;
                    maxArea = area;
                }
            }
        }

        if (largestContainer) {
            try {
                largestContainer.focus();
                largestContainer.click();
                return largestContainer;
            } catch (e) {
                // ignore
            }
        }
        return null;
    }

    isVisibleAndSized(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 100 &&
            rect.height > 50 &&
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    periodicCheck() {
        if (!this.enabled) return;
        
        const mediaElements = [
            ...document.querySelectorAll('video'),
            ...document.querySelectorAll('audio')
        ];

        if (mediaElements.length > 0) {
            const playingMedia = mediaElements.find(media => 
                !media.paused && !media.ended && media.currentTime > 0
            );

            if (playingMedia) {
                playingMedia.focus();
            }
        }
    }
}

// Initialize the extension
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FocusPlay();
    });
} else {
    new FocusPlay();
}
