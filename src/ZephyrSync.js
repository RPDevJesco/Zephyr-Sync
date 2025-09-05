// ZephyrSync v2.0 - Real-time UI Synchronization

import ConflictResolver from './ConflictResolver.js';
import MemoryManager from "./MemoryManager.js";
import OperationalTransform from "./OperationalTransform.js";
import OperationBatcher from "./OperationBatcher.js";
import RobustTransport from "./RobustTransport.js";
import VectorClock from "./VectorClock.js";
import ZephyrSyncHelpers from "./ZephyrSyncHelpers.js";

/**
 * ZephyrSync v2.0 - Main Controller
 */
export default class ZephyrSync extends EventTarget {
    constructor(options = {}) {
        super();

        this.options = {
            conflictResolution: 'last-write-wins',
            enableBatching: true,
            enableCompression: true,
            enableOT: false,
            debug: false,
            maxOperationHistory: 1000,
            ...options
        };

        // Core components
        this.sessionId = this.generateSessionId();
        this.vectorClock = new VectorClock(this.sessionId);
        this.memoryManager = new MemoryManager();
        this.conflictResolver = new ConflictResolver({
            defaultStrategy: this.options.conflictResolution,
            customResolver: this.options.customResolver
        });

        // State management
        this.syncedElements = new Map();
        this.operationHistory = [];
        this.isApplyingRemoteUpdate = false;
        this.state = {
            connected: false,
            syncing: true,
            sessionId: this.sessionId
        };

        // Operation batching
        if (this.options.enableBatching) {
            this.batcher = new OperationBatcher({
                compression: this.options.enableCompression
            });
        }

        // Transport layer
        this.transport = null;

        // Bind methods for proper context
        this.handleAttributeChange = this.handleAttributeChange.bind(this);
        this.handleComponentEvent = this.handleComponentEvent.bind(this);
        this.receiveRemoteUpdate = this.receiveRemoteUpdate.bind(this);

        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseSync();
            } else {
                this.resumeSync();
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    async connect(transport) {
        if (Array.isArray(transport)) {
            this.transport = new RobustTransport(transport);
        } else {
            this.transport = transport;
        }

        try {
            await this.transport.connect();

            // Set up transport event listeners
            this.transport.addEventListener('message', (e) => {
                this.handleTransportMessage(e.detail);
            });

            this.transport.addEventListener('disconnect', () => {
                this.handleDisconnection();
            });

            this.state.connected = true;
            this.dispatchEvent(new CustomEvent('sync-connected', {
                detail: { sessionId: this.sessionId }
            }));

            this.log('Connected to sync transport');

        } catch (error) {
            this.log(`Connection failed: ${error.message}`, 'error');
            throw error;
        }
    }

    disconnect() {
        if (this.transport) {
            this.transport.disconnect();
        }

        this.state.connected = false;
        this.dispatchEvent(new CustomEvent('sync-disconnected'));
        this.log('Disconnected from sync transport');
    }

    sync(element, config = {}) {
        if (!(element instanceof HTMLElement)) {
            throw new Error('sync() requires an HTMLElement');
        }

        const syncId = element.getAttribute('sync-id') || this.generateSyncId();
        element.setAttribute('sync-id', syncId);

        if (this.syncedElements.has(syncId)) {
            this.log(`Element ${syncId} already synced`);
            return syncId;
        }

        const syncConfig = {
            syncAttributes: true,
            syncContent: false,
            syncClasses: false,
            syncStyles: false,
            conflictResolution: this.options.conflictResolution,
            debounce: 100,
            enableOT: this.options.enableOT,
            pauseWhenHidden: true,
            ...config
        };

        // Register with memory manager
        const elementId = this.memoryManager.register(element, {
            pauseWhenHidden: syncConfig.pauseWhenHidden,
            observerConfig: {
                attributes: syncConfig.syncAttributes,
                childList: syncConfig.syncContent,
                subtree: syncConfig.syncContent,
                attributeOldValue: true
            }
        });

        // Set up mutation observer
        const observer = new MutationObserver((mutations) => {
            if (this.isApplyingRemoteUpdate) return;

            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && syncConfig.syncAttributes) {
                    this.scheduleAttributeChange(
                        syncId,
                        mutation.attributeName,
                        element.getAttribute(mutation.attributeName),
                        mutation.oldValue
                    );
                } else if (mutation.type === 'childList' && syncConfig.syncContent) {
                    this.scheduleContentChange(syncId, element.innerHTML);
                }
            });
        });

        // Start observing
        observer.observe(element, {
            attributes: syncConfig.syncAttributes,
            childList: syncConfig.syncContent,
            subtree: syncConfig.syncContent,
            attributeOldValue: true
        });

        // Set up component event listeners
        this.setupComponentListeners(element, syncId, syncConfig);

        // Store sync data
        this.syncedElements.set(syncId, {
            element,
            config: syncConfig,
            observer,
            elementId,
            lastUpdate: Date.now(),
            debounceTimer: null
        });

        // Register observer with memory manager
        this.memoryManager.addObserver(element, observer);
        this.memoryManager.addCleanupFunction(element, () => {
            this.unsync(syncId);
        });

        this.log(`Element synced: ${syncId}`);
        return syncId;
    }

    setupComponentListeners(element, syncId, config) {
        const componentEvents = [
            'input-change', 'select-change', 'checkbox-change',
            'textarea-change', 'radio-change', 'tab-changed',
            'button-click', 'accordion-expand', 'accordion-collapse'
        ];

        componentEvents.forEach(eventType => {
            element.addEventListener(eventType, (e) => {
                if (this.isApplyingRemoteUpdate) return;
                this.handleComponentEvent(syncId, eventType, e.detail);
            });
        });
    }

    scheduleAttributeChange(syncId, attributeName, newValue, oldValue) {
        // Skip sync-related and internal attributes
        if (attributeName.startsWith('sync-') ||
            attributeName.startsWith('data-internal-') ||
            attributeName.startsWith('aria-')) {
            return;
        }

        const syncData = this.syncedElements.get(syncId);
        if (!syncData) return;

        // Debounce rapid changes
        if (syncData.debounceTimer) {
            clearTimeout(syncData.debounceTimer);
        }

        syncData.debounceTimer = setTimeout(() => {
            this.handleAttributeChange(syncId, attributeName, newValue, oldValue);
        }, syncData.config.debounce);
    }

    scheduleContentChange(syncId, newContent) {
        const syncData = this.syncedElements.get(syncId);
        if (!syncData) return;

        if (syncData.debounceTimer) {
            clearTimeout(syncData.debounceTimer);
        }

        syncData.debounceTimer = setTimeout(() => {
            this.handleContentChange(syncId, newContent);
        }, syncData.config.debounce);
    }

    handleAttributeChange(syncId, attributeName, newValue, oldValue) {
        const operation = this.createOperation({
            type: 'attribute-change',
            syncId,
            attributeName,
            value: newValue,
            oldValue,
            vectorClock: this.vectorClock.tick()
        });

        this.broadcastOperation(operation);
    }

    handleContentChange(syncId, newContent) {
        const operation = this.createOperation({
            type: 'content-change',
            syncId,
            content: newContent,
            vectorClock: this.vectorClock.tick()
        });

        this.broadcastOperation(operation);
    }

    handleComponentEvent(syncId, eventType, detail) {
        const operation = this.createOperation({
            type: 'component-event',
            syncId,
            eventType,
            detail,
            vectorClock: this.vectorClock.tick()
        });

        this.broadcastOperation(operation);
    }

    createOperation(data) {
        const operation = {
            ...data,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            operationId: this.generateOperationId()
        };

        // Add to operation history
        this.operationHistory.push(operation);

        // Keep history bounded
        if (this.operationHistory.length > this.options.maxOperationHistory) {
            this.operationHistory.shift();
        }

        return operation;
    }

    broadcastOperation(operation) {
        if (!this.state.connected || !this.transport) {
            this.log('Cannot broadcast: not connected', 'warn');
            return;
        }

        if (this.options.enableBatching && this.batcher) {
            this.batcher.schedule(operation, (batch) => {
                this.transport.send(batch);
            });
        } else {
            this.transport.send(operation);
        }

        this.log(`Broadcasted operation: ${operation.type} for ${operation.syncId}`);
    }

    handleTransportMessage(message) {
        if (message.type === 'operation-batch') {
            this.handleOperationBatch(message);
        } else {
            this.receiveRemoteUpdate(message);
        }
    }

    handleOperationBatch(batch) {
        let operations = batch.operations;

        // Handle compressed batches
        if (batch.compressed && this.batcher) {
            const decompressed = this.batcher.decompress(batch.compressed);
            const parsedBatch = JSON.parse(decompressed);
            operations = parsedBatch.operations;
        }

        operations.forEach(operation => {
            this.receiveRemoteUpdate(operation);
        });
    }

    receiveRemoteUpdate(operation) {
        // Ignore our own operations
        if (operation.sessionId === this.sessionId) {
            return;
        }

        // Update vector clock
        if (operation.vectorClock) {
            const remoteClock = VectorClock.fromJSON(this.sessionId, operation.vectorClock);
            this.vectorClock.update(remoteClock.clock);
        }

        const syncData = this.syncedElements.get(operation.syncId);
        if (!syncData) {
            this.log(`Received operation for unknown element: ${operation.syncId}`);
            return;
        }

        // Check for conflicts
        const conflict = this.detectConflict(operation, syncData);
        if (conflict) {
            this.handleConflict(conflict.local, operation, syncData);
        } else {
            this.applyRemoteOperation(operation, syncData);
        }
    }

    detectConflict(remoteOp, syncData) {
        // Find recent local operations that might conflict
        const recentOps = this.operationHistory.filter(op =>
            op.syncId === remoteOp.syncId &&
            op.sessionId === this.sessionId &&
            Math.abs(op.timestamp - remoteOp.timestamp) < 5000 // Within 5 seconds
        );

        // Check for concurrent operations using vector clocks
        for (const localOp of recentOps) {
            if (localOp.vectorClock && remoteOp.vectorClock) {
                const localClock = VectorClock.fromJSON(this.sessionId, localOp.vectorClock);
                const remoteClock = VectorClock.fromJSON(this.sessionId, remoteOp.vectorClock);

                if (localClock.isConcurrent(remoteClock)) {
                    return { local: localOp, remote: remoteOp };
                }
            }
        }

        return null;
    }

    handleConflict(localOp, remoteOp, syncData) {
        const strategy = syncData.config.conflictResolution;
        const resolution = this.conflictResolver.resolve(localOp, remoteOp, strategy);

        this.dispatchEvent(new CustomEvent('sync-conflict', {
            detail: {
                syncId: localOp.syncId,
                local: localOp,
                remote: remoteOp,
                resolution
            }
        }));

        switch (resolution.action) {
            case 'apply-remote':
            case 'apply-transformed':
            case 'apply-merged':
                this.applyRemoteOperation(resolution.winner, syncData);
                break;
            case 'keep-local':
                // Do nothing, keep local state
                this.log(`Conflict resolved: keeping local state for ${localOp.syncId}`);
                break;
        }
    }

    applyRemoteOperation(operation, syncData) {
        this.isApplyingRemoteUpdate = true;

        try {
            const { element } = syncData;

            switch (operation.type) {
                case 'attribute-change':
                    this.applyAttributeChange(element, operation);
                    break;
                case 'content-change':
                    this.applyContentChange(element, operation);
                    break;
                case 'component-event':
                    this.applyComponentEvent(element, operation);
                    break;
            }

            syncData.lastUpdate = operation.timestamp;

            // Dispatch sync event
            element.dispatchEvent(new CustomEvent('sync-updated', {
                bubbles: true,
                detail: { operation, syncId: operation.syncId }
            }));

            this.log(`Applied remote operation: ${operation.type} for ${operation.syncId}`);

        } catch (error) {
            this.log(`Error applying remote operation: ${error.message}`, 'error');
        } finally {
            this.isApplyingRemoteUpdate = false;
        }
    }

    applyAttributeChange(element, operation) {
        const { attributeName, value } = operation;

        if (value === null || value === undefined) {
            element.removeAttribute(attributeName);
        } else {
            element.setAttribute(attributeName, value);
        }

        // Trigger component re-render if available
        if (element.render && typeof element.render === 'function') {
            element.render();
        }
    }

    applyContentChange(element, operation) {
        element.innerHTML = operation.content;
    }

    applyComponentEvent(element, operation) {
        const { eventType, detail } = operation;

        // Handle specific component events
        switch (eventType) {
            case 'tab-changed':
                if (element.setActiveTab && detail.activeTab) {
                    element.setActiveTab(detail.activeTab);
                }
                break;
            case 'accordion-expand':
                if (element.expandSection && detail.sectionId) {
                    element.expandSection(detail.sectionId);
                }
                break;
            case 'accordion-collapse':
                if (element.collapseSection && detail.sectionId) {
                    element.collapseSection(detail.sectionId);
                }
                break;
            // Add more component event handlers as needed
        }
    }

    unsync(syncIdOrElement) {
        const syncId = typeof syncIdOrElement === 'string'
            ? syncIdOrElement
            : syncIdOrElement.getAttribute('sync-id');

        const syncData = this.syncedElements.get(syncId);
        if (!syncData) return false;

        // Clean up observer
        if (syncData.observer) {
            syncData.observer.disconnect();
        }

        // Clear debounce timer
        if (syncData.debounceTimer) {
            clearTimeout(syncData.debounceTimer);
        }

        // Remove sync-id attribute
        syncData.element.removeAttribute('sync-id');

        // Remove from tracking
        this.syncedElements.delete(syncId);

        this.log(`Element unsynced: ${syncId}`);
        return true;
    }

    pauseSync() {
        this.state.syncing = false;
        this.log('Sync paused');
    }

    resumeSync() {
        this.state.syncing = true;
        this.log('Sync resumed');
    }

    autoSync(selector = '[sync-id]') {
        const elements = document.querySelectorAll(selector);
        const syncIds = [];

        elements.forEach(element => {
            try {
                const syncId = this.sync(element);
                syncIds.push(syncId);
            } catch (error) {
                this.log(`Failed to auto-sync element: ${error.message}`, 'error');
            }
        });

        this.log(`Auto-synced ${syncIds.length} elements`);
        return syncIds;
    }

    getStats() {
        return {
            connected: this.state.connected,
            syncing: this.state.syncing,
            sessionId: this.sessionId,
            syncedElements: this.syncedElements.size,
            operationHistory: this.operationHistory.length,
            memoryStats: this.memoryManager.getStats(),
            transportStats: this.transport?.getStats?.() || null,
            vectorClock: this.vectorClock.toJSON()
        };
    }

    cleanup() {
        // Stop all syncing
        this.syncedElements.forEach((_, syncId) => {
            this.unsync(syncId);
        });

        // Disconnect transport
        this.disconnect();

        // Clean up memory manager
        this.memoryManager.cleanup();

        // Force flush any pending batches
        if (this.batcher) {
            this.batcher.forceBatch();
        }

        this.log('ZephyrSync cleaned up');
    }

    // Utility methods
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSyncId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    log(message, level = 'info') {
        if (this.options.debug) {
            const timestamp = new Date().toISOString();
            console[level](`[ZephyrSync ${timestamp}] ${message}`);
        }

        this.dispatchEvent(new CustomEvent('sync-log', {
            detail: { message, level, timestamp: Date.now() }
        }));
    }
}

// Global registration for script tag usage
if (typeof window !== 'undefined') {
    window.ZephyrSync = ZephyrSync;
    window.ZephyrSyncHelpers = ZephyrSyncHelpers;
    window.VectorClock = VectorClock;
    window.OperationalTransform = OperationalTransform;
    window.ConflictResolver = ConflictResolver;
    window.RobustTransport = RobustTransport;
}