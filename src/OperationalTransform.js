/**
 * Operational Transform implementation for text synchronization
 */
export default class OperationalTransform {
    static transformInsert(op1, op2) {
        if (op1.position <= op2.position) {
            return { ...op2, position: op2.position + op1.content.length };
        }
        return op2;
    }

    static transformDelete(op1, op2) {
        if (op1.position + op1.length <= op2.position) {
            return { ...op2, position: op2.position - op1.length };
        } else if (op1.position >= op2.position + op2.length) {
            return op2;
        } else {
            // Overlapping deletes - need more complex handling
            return null; // Conflict that needs manual resolution
        }
    }

    static transform(localOp, remoteOp) {
        if (localOp.type === 'insert' && remoteOp.type === 'insert') {
            // Both insertions
            if (localOp.position < remoteOp.position) {
                return { ...remoteOp, position: remoteOp.position + localOp.content.length };
            } else if (localOp.position > remoteOp.position) {
                return remoteOp;
            } else {
                // Same position - use session ID for deterministic ordering
                return localOp.sessionId < remoteOp.sessionId ?
                    { ...remoteOp, position: remoteOp.position + localOp.content.length } :
                    remoteOp;
            }
        } else if (localOp.type === 'delete' && remoteOp.type === 'delete') {
            return this.transformDelete(localOp, remoteOp);
        } else if (localOp.type === 'insert' && remoteOp.type === 'delete') {
            return this.transformDelete(remoteOp, localOp);
        } else if (localOp.type === 'delete' && remoteOp.type === 'insert') {
            return this.transformInsert(remoteOp, localOp);
        }

        return remoteOp;
    }

    static apply(text, operation) {
        switch (operation.type) {
            case 'insert':
                return text.slice(0, operation.position) +
                    operation.content +
                    text.slice(operation.position);
            case 'delete':
                return text.slice(0, operation.position) +
                    text.slice(operation.position + operation.length);
            case 'retain':
                return text;
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }

    static generateOperations(oldText, newText) {
        const operations = [];
        let i = 0, j = 0;

        while (i < oldText.length || j < newText.length) {
            if (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
                // Characters match, retain
                i++;
                j++;
            } else if (j < newText.length) {
                // Insertion
                let content = '';
                const start = j;
                while (j < newText.length && (i >= oldText.length || oldText[i] !== newText[j])) {
                    content += newText[j];
                    j++;
                }
                operations.push({
                    type: 'insert',
                    position: i,
                    content
                });
            } else {
                // Deletion
                let length = 0;
                while (i < oldText.length) {
                    length++;
                    i++;
                }
                operations.push({
                    type: 'delete',
                    position: i - length,
                    length
                });
            }
        }

        return operations;
    }
}