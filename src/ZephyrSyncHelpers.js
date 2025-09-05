// Helper classes for common use cases
export default class ZephyrSyncHelpers {
    static autoSync(sync, selector = '[sync-id], x-*, [is^="x-"]') {
        return sync.autoSync(selector);
    }

    static syncForm(sync, formElement, options = {}) {
        const config = {
            syncAttributes: true,
            conflictResolution: 'last-write-wins',
            debounce: 200,
            ...options
        };

        const formControls = formElement.querySelectorAll(
            'x-input, x-select, x-checkbox, x-textarea, x-radio-group, input, select, textarea'
        );

        const syncIds = [];
        formControls.forEach(control => {
            if (!control.hasAttribute('sync-id')) {
                control.setAttribute('sync-id', `form-${control.name || control.id || 'field'}`);
            }
            const syncId = sync.sync(control, config);
            syncIds.push(syncId);
        });

        return syncIds;
    }

    static createCollaborativeTextEditor(sync, textElement, options = {}) {
        const config = {
            enableOT: true,
            conflictResolution: 'operational-transform',
            debounce: 100,
            ...options
        };

        if (!textElement.hasAttribute('sync-id')) {
            textElement.setAttribute('sync-id', `text-${Date.now()}`);
        }

        return sync.sync(textElement, config);
    }
}