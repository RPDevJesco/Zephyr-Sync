/**
 * Memory Management and Cleanup
 */
export default class MemoryManager {
    constructor() {
        this.elementData = new WeakMap();
        this.observers = new Set();
        this.cleanupCallbacks = new Map();
        this.intersectionObserver = null;

        this.setupGlobalObservers();
    }

    setupGlobalObservers() {
        // Observe element removal from DOM
        this.domObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.handleElementRemoval(node);
                    }
                });
            });
        });

        this.domObserver.observe(document, {
            childList: true,
            subtree: true
        });

        // Observe visibility changes for performance optimization
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const data = this.elementData.get(element);

                if (data) {
                    data.isVisible = entry.isIntersecting;

                    // Pause sync for invisible elements
                    if (data.pauseWhenHidden && data.observer) {
                        if (entry.isIntersecting) {
                            data.observer.observe(element, data.observerConfig);
                        } else {
                            data.observer.disconnect();
                        }
                    }
                }
            });
        }, {
            rootMargin: '100px' // Start observing slightly before element becomes visible
        });
    }

    register(element, config = {}) {
        const elementId = this.generateElementId();

        const data = {
            elementId,
            isVisible: true,
            pauseWhenHidden: config.pauseWhenHidden !== false,
            observers: [],
            cleanupFunctions: [],
            observerConfig: config.observerConfig || { attributes: true, attributeOldValue: true }
        };

        this.elementData.set(element, data);

        // Start observing visibility if requested
        if (data.pauseWhenHidden) {
            this.intersectionObserver.observe(element);
        }

        return elementId;
    }

    addObserver(element, observer) {
        const data = this.elementData.get(element);
        if (data) {
            data.observers.push(observer);
            this.observers.add(observer);
        }
    }

    addCleanupFunction(element, cleanupFn) {
        const data = this.elementData.get(element);
        if (data) {
            data.cleanupFunctions.push(cleanupFn);
        }
    }

    handleElementRemoval(element) {
        this.cleanupElement(element);

        // Also check all child elements
        const children = element.querySelectorAll('*');
        children.forEach(child => this.cleanupElement(child));
    }

    cleanupElement(element) {
        const data = this.elementData.get(element);
        if (!data) return;

        // Stop intersection observation
        this.intersectionObserver.unobserve(element);

        // Disconnect all observers
        data.observers.forEach(observer => {
            observer.disconnect();
            this.observers.delete(observer);
        });

        // Run cleanup functions
        data.cleanupFunctions.forEach(cleanupFn => {
            try {
                cleanupFn();
            } catch (error) {
                console.warn('Cleanup function error:', error);
            }
        });

        // Remove from WeakMap (happens automatically, but explicit for clarity)
        this.elementData.delete(element);
    }

    generateElementId() {
        return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getStats() {
        return {
            trackedElements: this.elementData instanceof WeakMap ? 'WeakMap (size not available)' : 0,
            activeObservers: this.observers.size,
            memoryPressure: this.estimateMemoryPressure()
        };
    }

    estimateMemoryPressure() {
        // Simple heuristic based on number of observers
        if (this.observers.size > 1000) return 'high';
        if (this.observers.size > 500) return 'medium';
        return 'low';
    }

    cleanup() {
        // Global cleanup
        this.domObserver.disconnect();
        this.intersectionObserver.disconnect();

        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}