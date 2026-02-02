
import React, { useState, useEffect } from 'react';

declare global {
    interface Window {
        __NETSIM__: {
            offline: boolean;
            force401: boolean;
            latency: number;
        };
    }
}

// Init Global State
if (typeof window !== 'undefined') {
    window.__NETSIM__ = {
        offline: false,
        force401: false,
        latency: 0
    };
}

export const NetSimPanel: React.FC = () => {
    const [collapsed, setCollapsed] = useState(true);
    const [config, setConfig] = useState(window.__NETSIM__);

    // Sync state to window
    useEffect(() => {
        window.__NETSIM__ = config;
    }, [config]);

    if (!import.meta.env.DEV) return null; // Dev only

    if (collapsed) {
        return (
            <div
                onClick={() => setCollapsed(false)}
                style={{
                    position: 'fixed', bottom: '10px', left: '10px',
                    background: 'rgba(0,0,0,0.8)', color: '#0f0',
                    padding: '5px 10px', borderRadius: '5px',
                    fontSize: '10px', cursor: 'pointer', zIndex: 9999
                }}
            >
                NET SIM
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', bottom: '10px', left: '10px',
            background: 'rgba(0,0,0,0.9)', color: 'white',
            padding: '10px', borderRadius: '8px',
            fontSize: '12px', zIndex: 9999,
            border: '1px solid #444', minWidth: '200px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ color: '#0f0' }}>Sub-Zero NetSim</strong>
                <button onClick={() => setCollapsed(true)}>X</button>
            </div>

            <div style={{ marginBottom: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        checked={config.offline}
                        onChange={(e) => setConfig({ ...config, offline: e.target.checked })}
                    />
                    OFFLINE (Network Error)
                </label>
            </div>

            <div style={{ marginBottom: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        checked={config.force401}
                        onChange={(e) => setConfig({ ...config, force401: e.target.checked })}
                    />
                    FORCE 401 (Auth Fail)
                </label>
            </div>

            <div style={{ marginBottom: '5px' }}>
                <label>Latency: {config.latency}ms</label>
                <input
                    type="range" min="0" max="5000" step="100"
                    value={config.latency}
                    onChange={(e) => setConfig({ ...config, latency: Number(e.target.value) })}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
                Refreshes require manual trigger.
            </div>
        </div>
    );
};
