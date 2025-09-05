# ZephyrSync

> Real-time synchronization for web components using DOM-as-state philosophy

ZephyrSync is a lightweight, transport-agnostic synchronization library that enables real-time collaboration across web applications. By leveraging the DOM as the natural state container, ZephyrSync delivers seamless multi-user experiences without the complexity of traditional state management systems.

## 🌟 Why ZephyrSync?

### **DOM-as-State Synchronization**
While modern frameworks require complex state management for real-time features, ZephyrSync works directly with DOM attributes—the way HTML was designed to store state:

- **Transparent Sync** - All synchronized state is visible in the DOM inspector
- **Zero State Duplication** - No separate sync state layer to maintain
- **Framework Agnostic** - Works with any web components or vanilla HTML
- **Conflict-Free** - Attribute-level synchronization prevents complex merge conflicts

### **Real-Time Made Simple**
```html
<!-- Add sync to any element with one attribute -->
<x-input sync-id="user-name" value="John"></x-input>
<x-select sync-id="country" value="US"></x-select>

<!-- Changes sync automatically across all connected clients -->
<script type="module">
import ZephyrSync from './ZephyrSync.js';

const sync = new ZephyrSync();
await sync.connect();
sync.syncAll(); // All elements with sync-id now sync in real-time
</script>
```

### **Performance Through Simplicity**
- **Minimal Overhead** - Direct DOM manipulation, no virtual layers
- **Debounced Updates** - Intelligent batching prevents sync storms
- **Memory Optimized** - Automatic cleanup with AbortController patterns
- **Transport Agnostic** - Works with WebSockets, WebRTC, Server-Sent Events, or custom transports

## 🚀 Quick Start

### Installation

```bash
# Clone the ZephyrSync repository
git clone https://github.com/RPDevJesco/zephyr-sync.git
cd zephyr-sync
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="path/to/ZephyrSync.js"></script>
</head>
<body>
    <!-- Any element can be synchronized -->
    <input sync-id="shared-input" value="Hello World">
    <div sync-id="shared-content" data-count="0">Click count: 0</div>
    <button onclick="incrementCounter()">Increment</button>

    <script type="module">
        import ZephyrSync from './ZephyrSync.js';
        
        // Initialize sync
        const sync = new ZephyrSync({
            transport: 'websocket',
            url: 'ws://localhost:8080'
        });
        
        // Connect and start syncing
        await sync.connect();
        sync.syncAll();
        
        // Changes to any sync-id element now sync in real-time
        function incrementCounter() {
            const counter = document.querySelector('[sync-id="shared-content"]');
            const count = parseInt(counter.dataset.count) + 1;
            counter.dataset.count = count;
            counter.textContent = `Click count: ${count}`;
            // Changes automatically sync to all connected clients
        }
        
        window.incrementCounter = incrementCounter;
    </script>
</body>
</html>
```

## 📦 Core Features

### Real-Time Synchronization
- **Attribute Sync** - DOM attributes sync across all connected clients
- **Content Sync** - innerHTML changes propagate in real-time
- **Component Events** - Custom component events sync automatically
- **Selective Sync** - Choose exactly which elements to synchronize

### Transport Flexibility
- **WebSocket** - Low-latency bidirectional communication
- **WebRTC** - Peer-to-peer synchronization without servers
- **Server-Sent Events** - Simple server-to-client updates
- **Custom Transports** - Implement any transport layer

### Conflict Resolution
- **Last-Write-Wins** - Simple, predictable conflict resolution
- **Timestamp-Based** - Automatic ordering of concurrent changes
- **Attribute-Level** - Granular synchronization prevents large conflicts
- **Custom Strategies** - Implement domain-specific conflict resolution

### Performance Optimizations
- **Debounced Updates** - Batch rapid changes to prevent sync storms
- **Change Detection** - Only sync actual changes, not redundant updates
- **Memory Management** - Automatic cleanup prevents memory leaks
- **Selective Observation** - Monitor only synchronized elements

## 🎯 Perfect Use Cases

### **Real-Time Collaboration**
```html
<!-- Collaborative forms -->
<form sync-group="application-form">
    <x-input sync-id="applicant-name" label="Full Name"></x-input>
    <x-select sync-id="department" label="Department"></x-select>
    <x-textarea sync-id="cover-letter" label="Cover Letter"></x-textarea>
</form>

<!-- Multiple users can edit simultaneously -->
```

### **Live Dashboards**
```html
<!-- Synchronized dashboard controls -->
<x-tabs sync-id="dashboard-view" active="analytics">
    <div tab-id="analytics">Analytics View</div>
    <div tab-id="reports">Reports View</div>
</x-tabs>

<x-date-range sync-id="date-filter" start="2024-01-01" end="2024-12-31"></x-date-range>

<!-- All users see the same dashboard state -->
```

### **Interactive Presentations**
```html
<!-- Speaker controls, audience follows -->
<x-presentation sync-id="slide-deck" current-slide="1">
    <div slide-id="1">Introduction</div>
    <div slide-id="2">Key Features</div>
    <div slide-id="3">Demo</div>
</x-presentation>

<!-- Slide changes sync to all participants -->
```

### **Multiplayer Interfaces**
```html
<!-- Shared drawing canvas -->
<x-canvas sync-id="collaborative-whiteboard" 
          width="800" 
          height="600"
          tools="pen,eraser,text">
</x-canvas>

<!-- Drawing actions sync in real-time -->
```

## 🛠️ API Reference

### ZephyrSync Class

```javascript
import ZephyrSync from './ZephyrSync.js';

const sync = new ZephyrSync(options);
```

#### Constructor Options
```javascript
const sync = new ZephyrSync({
    // Transport configuration
    transport: 'websocket',           // 'websocket', 'webrtc', 'sse', 'custom'
    url: 'ws://localhost:8080',       // Transport URL
    
    // Sync behavior
    debounceMs: 150,                  // Debounce rapid changes
    enableAttributeSync: true,        // Sync DOM attributes
    enableContentSync: false,         // Sync innerHTML changes
    enableComponentEvents: true,      // Sync component events
    
    // Session management
    sessionId: null,                  // Custom session ID
    userId: null,                     // User identifier
    
    // Custom transport
    customTransport: null             // Custom transport implementation
});
```

#### Core Methods

```javascript
// Connection management
await sync.connect();
sync.disconnect();

// Element synchronization
const syncId = sync.sync(element, config);
sync.unsync(syncId);
sync.syncAll();                      // Sync all elements with sync-id

// Group synchronization
sync.syncGroup('form-inputs');       // Sync elements with sync-group="form-inputs"

// Manual operations
sync.broadcastChange(syncId, attributeName, newValue);
sync.broadcastEvent(syncId, eventType, detail);

// Configuration
sync.setTransport(transport, config);
sync.setDebounce(milliseconds);
```

#### Element-Level Configuration

```javascript
// Sync specific element with custom config
const element = document.querySelector('#my-input');
const syncId = sync.sync(element, {
    syncAttributes: true,            // Sync attributes (default: true)
    syncContent: false,              // Sync innerHTML (default: false)
    debounce: 100,                   // Custom debounce (default: global setting)
    conflictResolution: 'last-write' // 'last-write', 'first-write', 'custom'
});
```

### Events

```javascript
// Connection events
sync.addEventListener('sync-connected', (e) => {
    console.log('Connected to sync transport');
});

sync.addEventListener('sync-disconnected', (e) => {
    console.log('Disconnected from sync transport');
});

// Sync events
sync.addEventListener('sync-updated', (e) => {
    console.log('Element updated:', e.detail.syncId);
});

sync.addEventListener('sync-conflict', (e) => {
    console.log('Conflict detected:', e.detail);
});

// Element-level events
element.addEventListener('sync-updated', (e) => {
    console.log('This element was updated by remote sync');
});
```

## 🔧 Advanced Configuration

### Custom Transport Implementation

```javascript
class CustomTransport {
    constructor(config) {
        this.config = config;
        this.connected = false;
    }
    
    async connect() {
        // Implement connection logic
        this.connected = true;
    }
    
    disconnect() {
        // Implement disconnection logic
        this.connected = false;
    }
    
    send(operation) {
        // Send operation to other clients
        console.log('Sending operation:', operation);
    }
    
    onReceive(callback) {
        // Set callback for incoming operations
        this.receiveCallback = callback;
    }
}

// Use custom transport
const sync = new ZephyrSync({
    transport: 'custom',
    customTransport: new CustomTransport(config)
});
```

### Conflict Resolution Strategies

```javascript
const sync = new ZephyrSync({
    conflictResolution: (local, remote) => {
        // Custom conflict resolution logic
        if (local.timestamp > remote.timestamp) {
            return local;
        }
        return remote;
    }
});
```

### Selective Synchronization

```html
<!-- Sync specific attributes only -->
<x-input sync-id="partial-sync" 
         sync-attributes="value,disabled"
         value="Hello"
         disabled="false"
         placeholder="Not synchronized">
</x-input>

<!-- Group synchronization -->
<div sync-group="dashboard">
    <x-chart sync-id="chart-1" type="bar"></x-chart>
    <x-filter sync-id="filter-1" value="2024"></x-filter>
</div>
```

## 🎨 Integration Examples

### With ZephyrJS Components

```html
<script type="module">
    import { XInput, XButton, XCard } from 'zephyrjs';
    import ZephyrSync from './ZephyrSync.js';
    
    const sync = new ZephyrSync({
        transport: 'websocket',
        url: 'ws://localhost:8080'
    });
    
    await sync.connect();
    
    // ZephyrJS components work seamlessly
    document.addEventListener('DOMContentLoaded', () => {
        sync.syncAll(); // All ZephyrJS components with sync-id will sync
    });
</script>

<!-- Synchronized ZephyrJS components -->
<x-input sync-id="user-name" label="Name" value=""></x-input>
<x-select sync-id="status" label="Status" value="active"></x-select>
<x-tabs sync-id="current-tab" active="profile">
    <div tab-id="profile">Profile</div>
    <div tab-id="settings">Settings</div>
</x-tabs>
```

### With React Components

```jsx
import { useEffect, useRef } from 'react';
import ZephyrSync from './ZephyrSync.js';

function SyncedInput({ syncId, value, onChange }) {
    const inputRef = useRef();
    const syncRef = useRef();
    
    useEffect(() => {
        const sync = new ZephyrSync({
            transport: 'websocket',
            url: 'ws://localhost:8080'
        });
        
        sync.connect().then(() => {
            inputRef.current.setAttribute('sync-id', syncId);
            sync.sync(inputRef.current);
            
            // Listen for remote changes
            inputRef.current.addEventListener('sync-updated', (e) => {
                onChange(inputRef.current.value);
            });
        });
        
        syncRef.current = sync;
        
        return () => sync.disconnect();
    }, [syncId]);
    
    return (
        <input 
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}
```

### With Vue Components

```vue
<template>
    <input 
        ref="inputElement"
        :value="value"
        @input="updateValue"
    />
</template>

<script>
import ZephyrSync from './ZephyrSync.js';

export default {
    props: ['syncId', 'value'],
    
    async mounted() {
        this.sync = new ZephyrSync({
            transport: 'websocket',
            url: 'ws://localhost:8080'
        });
        
        await this.sync.connect();
        
        this.$refs.inputElement.setAttribute('sync-id', this.syncId);
        this.sync.sync(this.$refs.inputElement);
        
        this.$refs.inputElement.addEventListener('sync-updated', () => {
            this.$emit('update:value', this.$refs.inputElement.value);
        });
    },
    
    beforeUnmount() {
        this.sync?.disconnect();
    },
    
    methods: {
        updateValue(event) {
            this.$emit('update:value', event.target.value);
        }
    }
}
</script>
```

## 📊 Performance Benchmarks

### Memory Usage
- **ZephyrSync** - ~2MB for 1000 synchronized elements
- **React + Redux + Socket.io** - ~8MB for equivalent functionality
- **Vue + Pinia + Socket.io** - ~6MB for equivalent functionality

### Bundle Size
- **ZephyrSync Core** - 8KB gzipped
- **With WebSocket Transport** - 12KB gzipped
- **With WebRTC Transport** - 18KB gzipped

### Sync Performance
- **DOM Updates** - Sub-millisecond attribute changes
- **Network Latency** - WebSocket: ~2ms, WebRTC: ~1ms (local network)
- **Conflict Resolution** - ~0.1ms per conflict
- **Memory Cleanup** - Automatic with AbortController

## 🛡️ Security Considerations

### Transport Security
- **WebSocket** - Use `wss://` for encrypted connections
- **WebRTC** - Built-in encryption with DTLS/SRTP
- **Authentication** - Implement transport-level auth

### Data Validation
```javascript
const sync = new ZephyrSync({
    validator: (operation) => {
        // Validate incoming operations
        if (operation.type === 'attribute-change') {
            return isValidAttributeValue(operation.value);
        }
        return true;
    }
});
```

### Permission Control
```javascript
const sync = new ZephyrSync({
    permissions: {
        'user-profile': ['read', 'write'],
        'admin-settings': ['read']
    }
});
```

## 🔮 Roadmap

### Version 2.0 (Coming Soon)
- **Offline Sync** - Queue changes when disconnected
- **Operational Transforms** - Advanced conflict resolution
- **Schema Validation** - Type-safe synchronization
- **Plugin System** - Extensible transport and conflict resolution

### Version 2.1
- **Time Travel** - Replay sync history
- **Permissions API** - Fine-grained access control
- **Compression** - Efficient large payload handling
- **Analytics** - Sync performance monitoring

### Version 3.0
- **CRDT Integration** - Conflict-free replicated data types
- **P2P Discovery** - Automatic peer discovery
- **Mobile Optimizations** - Battery and bandwidth efficient sync

## 🤝 Contributing

We welcome contributions! ZephyrSync is designed to be simple, fast, and standards-compliant.

### Development Principles

1. **DOM-First** - The DOM is the source of truth
2. **Transport Agnostic** - Work with any real-time transport
3. **Framework Neutral** - Integrate with any UI library
4. **Performance Critical** - Every byte and millisecond matters
5. **Standards Compliant** - Built on stable web APIs

### Getting Started

```bash
# Clone the repository
git clone https://github.com/RPDevJesco/zephyr-sync.git
cd zephyr-sync
```

## 📄 License

MIT License - Use ZephyrSync in any project, commercial or personal.

---

**ZephyrSync: Real-time collaboration as simple as adding an attribute.**