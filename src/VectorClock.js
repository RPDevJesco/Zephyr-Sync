/**
 * Vector Clock implementation for logical time tracking
 */
export default class VectorClock {
    constructor(nodeId) {
        this.nodeId = nodeId;
        this.clock = new Map();
        this.clock.set(nodeId, 0);
    }

    tick() {
        this.clock.set(this.nodeId, this.getClock(this.nodeId) + 1);
        return this.copy();
    }

    update(otherClock) {
        // Merge with remote clock
        for (const [nodeId, timestamp] of otherClock.entries()) {
            this.clock.set(nodeId, Math.max(this.getClock(nodeId), timestamp));
        }
        // Increment our own clock
        this.tick();
    }

    getClock(nodeId) {
        return this.clock.get(nodeId) || 0;
    }

    happensBefore(other) {
        let hasSmaller = false;
        let hasGreaterOrEqual = true;

        for (const [nodeId, timestamp] of this.clock) {
            const otherTimestamp = other.getClock(nodeId);
            if (timestamp < otherTimestamp) {
                hasSmaller = true;
            } else if (timestamp > otherTimestamp) {
                hasGreaterOrEqual = false;
                break;
            }
        }

        return hasSmaller && hasGreaterOrEqual;
    }

    isConcurrent(other) {
        return !this.happensBefore(other) && !other.happensBefore(this);
    }

    copy() {
        const copy = new VectorClock(this.nodeId);
        copy.clock = new Map(this.clock);
        return copy;
    }

    toJSON() {
        return Object.fromEntries(this.clock);
    }

    static fromJSON(nodeId, json) {
        const clock = new VectorClock(nodeId);
        clock.clock = new Map(Object.entries(json).map(([k, v]) => [k, Number(v)]));
        return clock;
    }
}