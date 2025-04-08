import React, { useState, useEffect } from 'react';
import { networkStatus } from '../utils/networkStatus';
import '../styles/NetworkStatusBar.css';

const NetworkStatusBar = () => {
    const [status, setStatus] = useState(networkStatus.getStatus());

    useEffect(() => {
        const handleStatusChange = (newStatus) => {
            setStatus(newStatus);
        };
        networkStatus.addListener(handleStatusChange);
        return () => networkStatus.removeListener(handleStatusChange);
    }, []);

    if (!status.isOnline) {
        return (
            <div className="network-status offline">
                ⚠️ Offline - No internet connection
            </div>
        );
    }

    if (!status.isServerAvailable) {
        return (
            <div className="network-status server-down">
                ⚠️ Server unavailable - Working offline
            </div>
        );
    }

    return (
        <div className="network-status online">
            ✓ Online - Connected to server
        </div>
    );
};

export default NetworkStatusBar;