import { networkStatus } from "../utils/networkStatus.js";

const API_URL = `http://${window.location.hostname}:5000/api/upload`;

export const uploadFile = async (file) => {
    if (!networkStatus.getStatus().isServerAvailable) {
        throw new Error("Cannot upload files while offline");
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("File upload error:", error);
        throw error;
    }
};

export const getUploadedFiles = async () => {
    try {
        const response = await fetch(`http://${window.location.hostname}:5000/api/files`);

        if (!response.ok) {
            throw new Error(`Failed to fetch files: ${response.statusText}`);
        }

        const files = await response.json();
        return files;
    } catch (error) {
        console.error("Error fetching files:", error);
        throw error;
    }
};

export const getFileUrl = (filename) => {
    return `http://${window.location.hostname}:5000/api/files/${filename}`;
};