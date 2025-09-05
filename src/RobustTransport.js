/**
 * Robust Transport Layer with multiple transport support and retry logic
 */
export default class RobustTransport extends EventTarget {
    constructor(transports = [], options = {}) {
        super();
        this.transports = transports;
        this.activeTransport = null;
        this.messageQueue = [];
        this.retryQueue = [];
        this.isOnline = navigator.onLine;

        this.options = {
            maxRetries: 3,
            baseRetryDelay: 1000,
            maxRetryDelay: 30000,
            queueLimit: 1000,
            ...options
        };

        this.setupNetworkHandling();
    }

    setupNetworkHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processQueuedMessages();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async connect() {
        for (const transport of this.transports) {
            try {
                await transport.connect();
                this.activeTransport = transport;

                // Forward events
                transport.addEventListener('message', (e) => {
                    this.dispatchEvent(new CustomEvent('message', { detail: e.detail }));
                });

                transport.addEventListener('disconnect', () => {
                    this.handleDisconnection();
                });

                // Process queued messages
                this.processQueuedMessages();
                return;

            } catch (error) {
                console.warn(`Transport ${transport.constructor.name} failed to connect:`, error);
            }
        }

        throw new Error('All transports failed to connect');
    }

    async send(data) {
        if (!this.isOnline) {
            this.queueMessage(data);
            return;
        }

        try {
            if (this.activeTransport) {
                await this.activeTransport.send(data);
            } else {
                this.queueMessage(data);
            }
        } catch (error) {
            this.handleSendError(data, error);
        }
    }

    queueMessage(data) {
        if (this.messageQueue.length >= this.options.queueLimit) {
            // Remove oldest message
            this.messageQueue.shift();
        }

        this.messageQueue.push({
            data,
            timestamp: Date.now(),
            attempts: 0
        });
    }

    handleSendError(data, error) {
        // Add to retry queue
        this.retryQueue.push({
            data,
            attempts: 0,
            lastAttempt: Date.now(),
            error
        });

        this.scheduleRetry();
        this.tryFallbackTransport();
    }

    scheduleRetry() {
        if (this.retryTimer) return;

        this.retryTimer = setTimeout(() => {
            this.processRetryQueue();
            this.retryTimer = null;
        }, this.options.baseRetryDelay);
    }

    async processRetryQueue() {
        const now = Date.now();
        const itemsToRetry = this.retryQueue.filter(item =>
            item.attempts < this.options.maxRetries &&
            now - item.lastAttempt >= this.getRetryDelay(item.attempts)
        );

        for (const item of itemsToRetry) {
            try {
                await this.send(item.data);
                // Remove from retry queue on success
                const index = this.retryQueue.indexOf(item);
                if (index > -1) {
                    this.retryQueue.splice(index, 1);
                }
            } catch (error) {
                item.attempts++;
                item.lastAttempt = now;
                item.error = error;
            }
        }

        // Remove items that exceeded max retries
        this.retryQueue = this.retryQueue.filter(item =>
            item.attempts < this.options.maxRetries
        );

        if (this.retryQueue.length > 0) {
            this.scheduleRetry();
        }
    }

    getRetryDelay(attempts) {
        return Math.min(
            this.options.baseRetryDelay * Math.pow(2, attempts),
            this.options.maxRetryDelay
        );
    }

    async tryFallbackTransport() {
        const availableTransports = this.transports.filter(t => t !== this.activeTransport);

        for (const transport of availableTransports) {
            try {
                await transport.connect();
                this.activeTransport = transport;
                this.processQueuedMessages();
                return;
            } catch (error) {
                continue;
            }
        }
    }

    async processQueuedMessages() {
        const messages = [...this.messageQueue];
        this.messageQueue = [];

        for (const message of messages) {
            try {
                await this.send(message.data);
            } catch (error) {
                // Re-queue if still failing
                this.queueMessage(message.data);
            }
        }
    }

    handleDisconnection() {
        this.activeTransport = null;
        this.dispatchEvent(new CustomEvent('disconnect'));

        // Attempt to reconnect with fallback transports
        setTimeout(() => {
            this.tryFallbackTransport();
        }, this.options.baseRetryDelay);
    }

    disconnect() {
        if (this.activeTransport) {
            this.activeTransport.disconnect();
        }
    }

    getStats() {
        return {
            activeTransport: this.activeTransport?.constructor.name || null,
            queuedMessages: this.messageQueue.length,
            retryQueueSize: this.retryQueue.length,
            isOnline: this.isOnline
        };
    }
}