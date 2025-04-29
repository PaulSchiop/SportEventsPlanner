const fs = require('fs');
const path = require('path');

class FileService {
    constructor(uploadsDir) {
        this.uploadsDir = uploadsDir;
        this.ensureUploadsDirExists();
    }

    ensureUploadsDirExists() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    getFileInfo(file) {
        return {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: `/api/files/${file.filename}`
        };
    }

    getFileList() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.uploadsDir, (err, files) => {
                if (err) return reject(err);
                resolve(files.map(file => ({
                    filename: file,
                    path: `/api/files/${file}`
                })));
            });
        });
    }

    getFilePath(filename) {
        return path.join(this.uploadsDir, filename);
    }

    fileExists(filename) {
        return fs.existsSync(this.getFilePath(filename));
    }
}

module.exports = FileService;