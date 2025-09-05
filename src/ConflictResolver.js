/**
 * Advanced Conflict Resolution with multiple strategies
 */
export default class ConflictResolver {
    constructor(options = {}) {
        this.strategies = {
            'last-write-wins': this.lastWriteWins.bind(this),
            'first-write-wins': this.firstWriteWins.bind(this),
            'operational-transform': this.operationalTransform.bind(this),
            'three-way-merge': this.threeWayMerge.bind(this),
            'custom': this.customResolution.bind(this)
        };

        this.defaultStrategy = options.defaultStrategy || 'last-write-wins';
        this.customResolver = options.customResolver;
    }

    resolve(localOp, remoteOp, strategy = this.defaultStrategy) {
        const resolver = this.strategies[strategy];
        if (!resolver) {
            throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
        }

        return resolver(localOp, remoteOp);
    }

    lastWriteWins(localOp, remoteOp) {
        // Use vector clock comparison instead of timestamps
        if (remoteOp.vectorClock.happensBefore(localOp.vectorClock)) {
            return { winner: localOp, action: 'keep-local' };
        } else if (localOp.vectorClock.happensBefore(remoteOp.vectorClock)) {
            return { winner: remoteOp, action: 'apply-remote' };
        } else {
            // Concurrent operations - use session ID for deterministic ordering
            const winner = localOp.sessionId < remoteOp.sessionId ? localOp : remoteOp;
            return {
                winner,
                action: winner === localOp ? 'keep-local' : 'apply-remote'
            };
        }
    }

    firstWriteWins(localOp, remoteOp) {
        // Opposite of last-write-wins
        const result = this.lastWriteWins(localOp, remoteOp);
        return {
            winner: result.winner === localOp ? remoteOp : localOp,
            action: result.action === 'keep-local' ? 'apply-remote' : 'keep-local'
        };
    }

    operationalTransform(localOp, remoteOp) {
        // Only applicable for text operations
        if (this.isTextOperation(localOp) && this.isTextOperation(remoteOp)) {
            const transformedRemote = OperationalTransform.transform(localOp, remoteOp);

            if (transformedRemote) {
                return {
                    winner: transformedRemote,
                    action: 'apply-transformed',
                    originalLocal: localOp
                };
            }
        }

        // Fall back to last-write-wins
        return this.lastWriteWins(localOp, remoteOp);
    }

    threeWayMerge(localOp, remoteOp) {
        // Requires common ancestor - simplified implementation
        if (localOp.attributeName === remoteOp.attributeName) {
            const localValue = localOp.value || '';
            const remoteValue = remoteOp.value || '';

            // Simple text merge
            if (typeof localValue === 'string' && typeof remoteValue === 'string') {
                const merged = this.mergeText(localValue, remoteValue);
                return {
                    winner: { ...remoteOp, value: merged },
                    action: 'apply-merged'
                };
            }
        }

        return this.lastWriteWins(localOp, remoteOp);
    }

    customResolution(localOp, remoteOp) {
        if (this.customResolver) {
            return this.customResolver(localOp, remoteOp);
        }

        return this.lastWriteWins(localOp, remoteOp);
    }

    isTextOperation(operation) {
        return operation.type === 'text-operation' ||
            (operation.attributeName === 'value' && typeof operation.value === 'string');
    }

    mergeText(local, remote) {
        // Very simple text merge - in practice, you'd want something more sophisticated
        const localLines = local.split('\n');
        const remoteLines = remote.split('\n');

        const merged = [];
        const maxLength = Math.max(localLines.length, remoteLines.length);

        for (let i = 0; i < maxLength; i++) {
            const localLine = localLines[i] || '';
            const remoteLine = remoteLines[i] || '';

            if (localLine === remoteLine) {
                merged.push(localLine);
            } else if (localLine && remoteLine) {
                merged.push(`${localLine} | ${remoteLine}`);
            } else {
                merged.push(localLine || remoteLine);
            }
        }

        return merged.join('\n');
    }
}