import React, { useState, useRef } from "react";
import { uploadFile} from "../services/fileService";

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
    const videoRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);

        // Create preview for video files
        if (file && file.type.startsWith("video/")) {
            const url = URL.createObjectURL(file);
            setVideoPreviewUrl(url);
        } else {
            setVideoPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            const result = await uploadFile(selectedFile);
            onUploadSuccess?.(result);
            setSelectedFile(null);
            setVideoPreviewUrl(null); // Clear preview after upload
            document.getElementById("file-input").value = "";
        } catch (error) {
            onUploadError?.(error);
        } finally {
            setIsUploading(false);
        }
    };

    const clearPreview = () => {
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
        }
    };

    return (
        <div className="file-upload-container">
            <input
                id="file-input"
                type="file"
                accept="video/*" // Restrict to video files
                onChange={handleFileChange}
                disabled={isUploading}
            />

            {/* Video Preview */}
            {videoPreviewUrl && (
                <div className="video-preview">
                    <video
                        ref={videoRef}
                        src={videoPreviewUrl}
                        controls
                        width="300"
                        onLoad={clearPreview} // Clean up when component unmounts
                    />
                    <button
                        onClick={() => videoRef.current?.play()}
                        className="preview-button"
                    >
                        Play Preview
                    </button>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="upload-button"
            >
                {isUploading ? "Uploading..." : "Upload Video"}
            </button>
        </div>
    );
};

export default FileUpload;