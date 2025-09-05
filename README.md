<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZephyrSync + ZephyrJS Integration Demo</title>
    <style>
        :root {
            --primary-color: #4f46e5;
            --secondary-color: #ef4444;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --background: #f8fafc;
            --card-bg: #ffffff;
            --border-color: #e5e7eb;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--background);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 32px;
        }

        .header h1 {
            color: var(--text-primary);
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        .header p {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .demo-section {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .demo-section h2 {
            color: var(--text-primary);
            font-size: 1.5rem;
            margin-bottom: 8px;
        }

        .demo-section p {
            color: var(--text-secondary);
            margin-bottom: 20px;
        }

        .sync-controls {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .sync-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 16px;
        }

        .sync-status.connected {
            background: #d1fae5;
            color: #065f46;
        }

        .sync-status.disconnected {
            background: #fee2e2;
            color: #991b1b;
        }

        .sync-status.connecting {
            background: #dbeafe;
            color: #1e40af;
        }

        .sync-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }

        .sync-indicator.pulsing {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .demo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        .client-panel {
            border: 2px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            position: relative;
            background: white;
        }

        .client-panel::before {
            content: attr(data-client);
            position: absolute;
            top: -12px;
            left: 16px;
            background: var(--card-bg);
            padding: 4px 12px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
        }

        .logs {
            background: #1e293b;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 11px;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 16px;
        }

        .log-entry {
            margin-bottom: 4px;
            padding: 2px;
        }

        .log-entry .timestamp {
            color: #64748b;
        }

        .log-entry.sync { color: #3b82f6; }
        .log-entry.error { color: #ef4444; }
        .log-entry.success { color: #10b981; }

        .form-demo {
            display: grid;
            gap: 16px;
        }

        /* ZephyrJS Component Styling */
        x-button::part(button) {
            padding: 8px 16px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--card-bg);
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
        }

        x-button[variant="primary"]::part(button) {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        x-button[variant="success"]::part(button) {
            background: var(--success-color);
            color: white;
            border-color: var(--success-color);
        }

        x-button[variant="danger"]::part(button) {
            background: var(--secondary-color);
            color: white;
            border-color: var(--secondary-color);
        }

        x-input, x-select, x-checkbox, x-textarea {
            margin-bottom: 12px;
        }

        x-tabs::part(tab-list) {
            background: #f8fafc;
            border-bottom: 1px solid var(--border-color);
        }

        x-tabs::part(tab) {
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
        }

        x-tabs::part(tab)[aria-selected="true"] {
            border-bottom-color: var(--primary-color);
            background: white;
        }

        .canvas-container {
            width: 100%;
            height: 200px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            background: white;
            position: relative;
            overflow: hidden;
            cursor: crosshair;
        }

        .drawing-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            pointer-events: none;
            transition: all 0.1s ease;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }

        .stat-card {
            text-align: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }

        .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: var(--primary-color);
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
            .demo-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                🔄 ZephyrSync + ZephyrJS Integration
            </h1>
            <p>Real-time synchronization of ZephyrJS components using DOM-as-state philosophy</p>
        </div>

        <!-- Connection Management -->
        <div class="demo-section">
            <h2>🔗 Connection Management</h2>
            <p>Connect to sync transport and see real-time component synchronization.</p>
            
            <div class="sync-controls">
                <x-button id="connect-btn" variant="primary" label="Connect to Sync"></x-button>
                <x-button id="disconnect-btn" variant="danger" label="Disconnect" disabled></x-button>
                <x-button id="simulate-peer" variant="default" label="Simulate Peer Changes"></x-button>
            </div>
            
            <div id="connection-status" class="sync-status disconnected">
                <div class="sync-indicator"></div>
                <span>Disconnected</span>
            </div>
            
            <div id="connection-logs" class="logs"></div>
        </div>

        <!-- Form Synchronization -->
        <div class="demo-section">
            <h2>📝 Form Component Synchronization</h2>
            <p>Form controls synchronize across multiple "clients" in real-time.</p>
            
            <div class="demo-grid">
                <div class="client-panel form-demo" data-client="Client A">
                    <x-input 
                        sync-id="demo-name"
                        id="name-a"
                        label="Full Name" 
                        placeholder="Enter your name"
                        value="">
                    </x-input>
                    
                    <x-select 
                        sync-id="demo-country"
                        id="country-a"
                        label="Country"
                        options='[{"value":"","label":"Select Country"},{"value":"us","label":"United States"},{"value":"ca","label":"Canada"},{"value":"uk","label":"United Kingdom"},{"value":"de","label":"Germany"},{"value":"fr","label":"France"}]'
                        value="">
                    </x-select>
                    
                    <x-checkbox 
                        sync-id="demo-newsletter"
                        id="newsletter-a"
                        label="Subscribe to newsletter">
                    </x-checkbox>
                    
                    <x-textarea
                        sync-id="demo-bio"
                        id="bio-a"
                        label="Bio"
                        rows="3"
                        placeholder="Tell us about yourself..."
                        auto-resize>
                    </x-textarea>
                </div>
                
                <div class="client-panel form-demo" data-client="Client B">
                    <x-input 
                        sync-id="demo-name"
                        id="name-b"
                        label="Full Name" 
                        placeholder="Enter your name"
                        value="">
                    </x-input>
                    
                    <x-select 
                        sync-id="demo-country"
                        id="country-b"
                        label="Country"
                        options='[{"value":"","label":"Select Country"},{"value":"us","label":"United States"},{"value":"ca","label":"Canada"},{"value":"uk","label":"United Kingdom"},{"value":"de","label":"Germany"},{"value":"fr","label":"France"}]'
                        value="">
                    </x-select>
                    
                    <x-checkbox 
                        sync-id="demo-newsletter"
                        id="newsletter-b"
                        label="Subscribe to newsletter">
                    </x-checkbox>
                    
                    <x-textarea
                        sync-id="demo-bio"
                        id="bio-b"
                        label="Bio"
                        rows="3"
                        placeholder="Tell us about yourself..."
                        auto-resize>
                    </x-textarea>
                </div>
            </div>
        </div>

        <!-- Tab Synchronization -->
        <div class="demo-section">
            <h2>🗂️ Tab Navigation Synchronization</h2>
            <p>Tab states synchronize across clients. Click different tabs to see them sync.</p>
            
            <div class="demo-grid">
                <div class="client-panel" data-client="Client A">
                    <x-tabs sync-id="demo-tabs" id="tabs-a" active="profile">
                        <div tab-id="profile" tab-label="👤 Profile">
                            <h3>Profile Settings</h3>
                            <p>Configure your profile information here.</p>
                            <x-input sync-id="profile-email" label="Email" placeholder="your@email.com"></x-input>
                            <x-checkbox sync-id="profile-public" label="Make profile public"></x-checkbox>
                        </div>
                        <div tab-id="settings" tab-label="⚙️ Settings">
                            <h3>Application Settings</h3>
                            <p>Customize your application preferences.</p>
                            <x-select sync-id="settings-theme" label="Theme" options='[{"value":"light","label":"Light"},{"value":"dark","label":"Dark"},{"value":"auto","label":"Auto"}]' value="light"></x-select>
                            <x-checkbox sync-id="settings-notifications" label="Enable notifications"></x-checkbox>
                        </div>
                        <div tab-id="help" tab-label="❓ Help">
                            <h3>Help & Support</h3>
                            <p>Find answers to common questions.</p>
                            <x-button variant="primary" label="Contact Support"></x-button>
                        </div>
                    </x-tabs>
                </div>
                
                <div class="client-panel" data-client="Client B">
                    <x-tabs sync-id="demo-tabs" id="tabs-b" active="profile">
                        <div tab-id="profile" tab-label="👤 Profile">
                            <h3>Profile Settings</h3>
                            <p>Configure your profile information here.</p>
                            <x-input sync-id="profile-email" label="Email" placeholder="your@email.com"></x-input>
                            <x-checkbox sync-id="profile-public" label="Make profile public"></x-checkbox>
                        </div>
                        <div tab-id="settings" tab-label="⚙️ Settings">
                            <h3>Application Settings</h3>
                            <p>Customize your application preferences.</p>
                            <x-select sync-id="settings-theme" label="Theme" options='[{"value":"light","label":"Light"},{"value":"dark","label":"Dark"},{"value":"auto","label":"Auto"}]' value="light"></x-select>
                            <x-checkbox sync-id="settings-notifications" label="Enable notifications"></x-checkbox>
                        </div>
                        <div tab-id="help" tab-label="❓ Help">
                            <h3>Help & Support</h3>
                            <p>Find answers to common questions.</p>
                            <x-button variant="primary" label="Contact Support"></x-button>
                        </div>
                    </x-tabs>
                </div>
            </div>
        </div>

        <!-- Simple Collaborative Drawing -->
        <div class="demo-section">
            <h2>🎨 Simple Collaborative Drawing</h2>
            <p>Click anywhere to add colored dots. See them appear on both canvases.</p>
            
            <div class="demo-grid">
                <div class="client-panel" data-client="Client A">
                    <div class="canvas-container" id="canvas-a" data-user-color="#4f46e5">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #9ca3af; pointer-events: none;">
                            Click to draw
                        </div>
                    </div>
                </div>
                
                <div class="client-panel" data-client="Client B">
                    <div class="canvas-container" id="canvas-b" data-user-color="#ef4444">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #9ca3af; pointer-events: none;">
                            Click to draw
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics -->
        <div class="demo-section">
            <h2>📊 Sync Statistics</h2>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="elements-synced">0</div>
                    <div class="stat-label">Elements Synced</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="sync-operations">0</div>
                    <div class="stat-label">Sync Operations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="active-connections">0</div>
                    <div class="stat-label">Active Connections</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="last-sync">Never</div>
                    <div class="stat-label">Last Sync</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Load ZephyrJS from jsdelivr CDN -->
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/micro-framework@master/src/core/XBase.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/micro-framework@master/src/elements/XButton.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/micro-framework@master/src/elements/XInput.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/micro-framework@master/src/elements/XSelect.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/micro-framework@master/src/elements/XCheckbox.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/micro-framework@master/src/elements/XTextArea.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/micro-framework@master/src/elements/XTabs.js"></script>

    <script type="module">
        // Simplified ZephyrSync implementation for demo
        class DemoZephyrSync extends EventTarget {
            constructor() {
                super();
                this.connected = false;
                this.syncedElements = new Map();
                this.stats = {
                    elementsInSync: 0,
                    syncOperations: 0,
                    activeConnections: 0
                };
                this.sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
            }
            
            connect() {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        this.connected = true;
                        this.stats.activeConnections = 1;
                        this.dispatchEvent(new CustomEvent('sync-connected'));
                        this.log('Connected to sync server', 'success');
                        resolve();
                    }, 500);
                });
            }
            
            disconnect() {
                this.connected = false;
                this.stats.activeConnections = 0;
                this.dispatchEvent(new CustomEvent('sync-disconnected'));
                this.log('Disconnected from sync server', 'error');
            }
            
            sync(element, config = {}) {
                if (!element.hasAttribute('sync-id')) {
                    console.warn('Element must have sync-id attribute');
                    return;
                }
                
                const syncId = element.getAttribute('sync-id');
                
                if (this.syncedElements.has(syncId)) {
                    return syncId; // Already synced
                }
                
                const syncConfig = {
                    syncAttributes: true,
                    debounce: 150,
                    ...config
                };
                
                // Set up observer
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (mutation.type === 'attributes' && 
                            !mutation.attributeName.startsWith('data-internal')) {
                            this.handleAttributeChange(syncId, mutation.attributeName, element.getAttribute(mutation.attributeName));
                        }
                    });
                });
                
                observer.observe(element, {
                    attributes: true,
                    attributeOldValue: true
                });
                
                // Listen for component events
                const componentEvents = ['input-change', 'select-change', 'checkbox-change', 'textarea-change', 'tab-changed'];
                componentEvents.forEach(eventType => {
                    element.addEventListener(eventType, (e) => {
                        this.handleComponentEvent(syncId, eventType, e.detail);
                    });
                });
                
                this.syncedElements.set(syncId, {
                    element,
                    config: syncConfig,
                    observer
                });
                
                this.stats.elementsInSync++;
                this.updateStats();
                this.log(`Registered element for sync: ${syncId}`, 'sync');
                
                return syncId;
            }
            
            handleAttributeChange(syncId, attributeName, value) {
                if (!this.connected) return;
                
                const operation = {
                    type: 'attribute-change',
                    syncId,
                    attributeName,
                    value,
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                };
                
                // Simulate sending to other clients
                setTimeout(() => {
                    this.simulateRemoteUpdate(operation);
                }, Math.random() * 100 + 50);
                
                this.stats.syncOperations++;
                this.updateStats();
            }
            
            handleComponentEvent(syncId, eventType, detail) {
                if (!this.connected) return;
                
                const operation = {
                    type: 'component-event',
                    syncId,
                    eventType,
                    detail,
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                };
                
                // Simulate sending to other clients
                setTimeout(() => {
                    this.simulateRemoteUpdate(operation);
                }, Math.random() * 100 + 50);
                
                this.stats.syncOperations++;
                this.updateStats();
            }
            
            simulateRemoteUpdate(operation) {
                // Simulate receiving the same operation from a remote client
                const remoteOperation = {
                    ...operation,
                    sessionId: 'remote_session_' + Math.random().toString(36).substr(2, 5)
                };
                
                this.receiveRemoteUpdate(remoteOperation);
            }
            
            receiveRemoteUpdate(operation) {
                if (operation.sessionId === this.sessionId) return;
                
                // Find all elements with this sync-id
                const elements = document.querySelectorAll(`[sync-id="${operation.syncId}"]`);
                
                elements.forEach(element => {
                    // Temporarily disable observer to prevent loops
                    const syncData = this.syncedElements.get(operation.syncId);
                    if (syncData && syncData.observer) {
                        syncData.observer.disconnect();
                    }
                    
                    try {
                        if (operation.type === 'attribute-change') {
                            element.setAttribute(operation.attributeName, operation.value);
                            
                            // Trigger re-render for ZephyrJS components
                            if (element.render && typeof element.render === 'function') {
                                element.render();
                            }
                        } else if (operation.type === 'component-event') {
                            // Handle specific component events
                            this.handleRemoteComponentEvent(element, operation);
                        }
                    } finally {
                        // Re-enable observer
                        setTimeout(() => {
                            if (syncData && syncData.observer) {
                                syncData.observer.observe(element, {
                                    attributes: true,
                                    attributeOldValue: true
                                });
                            }
                        }, 100);
                    }
                });
                
                this.log(`Applied remote update for ${operation.syncId}`, 'sync');
            }
            
            handleRemoteComponentEvent(element, operation) {
                switch (operation.eventType) {
                    case 'tab-changed':
                        if (element.setActiveTab) {
                            element.setActiveTab(operation.detail.activeTab);
                        }
                        break;
                    // Add more component event handlers as needed
                }
            }
            
            autoSync() {
                const elements = document.querySelectorAll('[sync-id]');
                elements.forEach(element => {
                    this.sync(element);
                });
                this.log(`Auto-synced ${elements.length} elements`, 'success');
            }
            
            updateStats() {
                document.getElementById('elements-synced').textContent = this.stats.elementsInSync;
                document.getElementById('sync-operations').textContent = this.stats.syncOperations;
                document.getElementById('active-connections').textContent = this.stats.activeConnections;
                document.getElementById('last-sync').textContent = new Date().toLocaleTimeString();
            }
            
            log(message, type = 'info') {
                const logsContainer = document.getElementById('connection-logs');
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = document.createElement('div');
                logEntry.className = `log-entry ${type}`;
                logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
                
                logsContainer.appendChild(logEntry);
                logsContainer.scrollTop = logsContainer.scrollHeight;
                
                // Keep only last 50 entries
                while (logsContainer.children.length > 50) {
                    logsContainer.removeChild(logsContainer.firstChild);
                }
            }
        }
        
        // Initialize sync system
        const sync = new DemoZephyrSync();
        
        // Update connection status
        function updateConnectionStatus(status, text) {
            const statusEl = document.getElementById('connection-status');
            statusEl.className = `sync-status ${status}`;
            statusEl.querySelector('span').textContent = text;
            statusEl.querySelector('.sync-indicator').className = `sync-indicator ${status === 'connecting' ? 'pulsing' : ''}`;
        }
        
        // Event listeners
        sync.addEventListener('sync-connected', () => {
            updateConnectionStatus('connected', 'Connected & Syncing');
            document.getElementById('connect-btn').setAttribute('disabled', '');
            document.getElementById('disconnect-btn').removeAttribute('disabled');
            sync.autoSync();
        });
        
        sync.addEventListener('sync-disconnected', () => {
            updateConnectionStatus('disconnected', 'Disconnected');
            document.getElementById('connect-btn').removeAttribute('disabled');
            document.getElementById('disconnect-btn').setAttribute('disabled', '');
        });
        
        // Button handlers
        document.getElementById('connect-btn').addEventListener('button-click', async () => {
            updateConnectionStatus('connecting', 'Connecting...');
            await sync.connect();
        });
        
        document.getElementById('disconnect-btn').addEventListener('button-click', () => {
            sync.disconnect();
        });
        
        document.getElementById('simulate-peer').addEventListener('button-click', () => {
            // Simulate changes from a remote peer
            const changes = [
                { syncId: 'demo-name', attr: 'value', value: 'John Doe' },
                { syncId: 'demo-country', attr: 'value', value: 'us' },
                { syncId: 'demo-newsletter', attr: 'checked', value: '' },
                { syncId: 'demo-bio', attr: 'value', value: 'Software developer passionate about web technologies.' }
            ];
            
            changes.forEach((change, index) => {
                setTimeout(() => {
                    sync.receiveRemoteUpdate({
                        type: 'attribute-change',
                        syncId: change.syncId,
                        attributeName: change.attr,
                        value: change.value,
                        sessionId: 'peer_session',
                        timestamp: Date.now()
                    });
                }, index * 500);
            });
            
            sync.log('Simulated peer changes', 'success');
        });
        
        // Simple collaborative drawing
        function setupCollaborativeDrawing() {
            const canvases = [
                { element: document.getElementById('canvas-a'), color: '#4f46e5' },
                { element: document.getElementById('canvas-b'), color: '#ef4444' }
            ];
            
            canvases.forEach(({ element, color }) => {
                element.addEventListener('click', (e) => {
                    const rect = element.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    const dot = document.createElement('div');
                    dot.className = 'drawing-dot';
                    dot.style.left = x + '%';
                    dot.style.top = y + '%';
                    dot.style.backgroundColor = color;
                    
                    element.appendChild(dot);
                    
                    // Sync to other canvases
                    canvases.forEach(otherCanvas => {
                        if (otherCanvas.element !== element) {
                            setTimeout(() => {
                                const otherDot = dot.cloneNode(true);
                                otherDot.style.backgroundColor = color;
                                otherCanvas.element.appendChild(otherDot);
                            }, Math.random() * 200 + 100);
                        }
                    });
                    
                    sync.stats.syncOperations++;
                    sync.updateStats();
                });
            });
        }
        
        // Initialize when components are loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit for components to initialize
            setTimeout(() => {
                setupCollaborativeDrawing();
                sync.log('Demo initialized - ready for synchronization', 'success');
            }, 1000);
        });
    </script>
</body>
</html>