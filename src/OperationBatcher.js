/**
 * Efficient Operation Batching and Compression
 */
export default class OperationBatcher {
    constructor(options = {}) {
        this.pendingOperations = new Map(); // syncId -> operations
        this.batchTimeout = null;
        this.compressionEnabled = options.compression !== false;

        this.options = {
            batchDelay: 50,
            maxBatchSize: 100,
            compressionThreshold: 500, // bytes
            ...options
        };
    }

    schedule(operation, callback) {
        const syncId = operation.syncId;

        if (!this.pendingOperations.has(syncId)) {
            this.pendingOperations.set(syncId, []);
        }

        this.pendingOperations.get(syncId).push(operation);

        // Store callback for this batch
        this.flushCallback = callback;

        this.scheduleBatchFlush();
    }

    scheduleBatchFlush() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        this.batchTimeout = setTimeout(() => {
            this.flushBatch();
        }, this.options.batchDelay);
    }

    flushBatch() {
        if (this.pendingOperations.size === 0) return;

        const batches = this.createBatches();
        this.pendingOperations.clear();
        this.batchTimeout = null;

        batches.forEach(batch => {
            if (this.flushCallback) {
                this.flushCallback(batch);
            }
        });
    }

    createBatches() {
        const batches = [];
        let currentBatch = [];
        let currentSize = 0;

        for (const [syncId, operations] of this.pendingOperations) {
            // Consolidate operations for the same element
            const consolidated = this.consolidateOperations(operations);

            for (const operation of consolidated) {
                const operationSize = this.estimateSize(operation);

                if (currentSize + operationSize > this.options.maxBatchSize && currentBatch.length > 0) {
                    batches.push(this.finalizeBatch(currentBatch));
                    currentBatch = [];
                    currentSize = 0;
                }

                currentBatch.push(operation);
                currentSize += operationSize;
            }
        }

        if (currentBatch.length > 0) {
            batches.push(this.finalizeBatch(currentBatch));
        }

        return batches;
    }

    consolidateOperations(operations) {
        // Group by attribute name and only keep the latest value for each
        const consolidated = new Map();

        operations.forEach(op => {
            const key = `${op.syncId}:${op.attributeName}`;

            if (op.type === 'attribute-change') {
                // For attribute changes, only keep the latest
                consolidated.set(key, op);
            } else {
                // For other operations, preserve all (like text operations)
                const existing = consolidated.get(key) || [];
                if (Array.isArray(existing)) {
                    existing.push(op);
                } else {
                    consolidated.set(key, [existing, op]);
                }
            }
        });

        return Array.from(consolidated.values()).flat();
    }

    finalizeBatch(operations) {
        const batch = {
            type: 'operation-batch',
            operations,
            timestamp: Date.now(),
            batchId: this.generateBatchId()
        };

        if (this.compressionEnabled) {
            const serialized = JSON.stringify(batch);
            if (serialized.length > this.options.compressionThreshold) {
                batch.compressed = this.compress(serialized);
                delete batch.operations; // Remove original to save space
            }
        }

        return batch;
    }

    compress(data) {
        // Simple compression simulation - in real implementation, use proper compression
        const compressed = data.replace(/\s+/g, ' ').trim();
        return {
            data: compressed,
            originalSize: data.length,
            compressedSize: compressed.length,
            algorithm: 'simple'
        };
    }

    decompress(compressed) {
        // Simple decompression
        return compressed.data;
    }

    estimateSize(operation) {
        return JSON.stringify(operation).length;
    }

    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    forceBatch() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.flushBatch();
        }
    }
}