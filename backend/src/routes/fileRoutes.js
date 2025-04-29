const express = require("express");
const multer = require("multer");
const FileService = require("../controllers/fileController");
const path = require("path");

const router = express.Router();
const uploadsDir = path.join(__dirname, '../uploads');
const fileService = new FileService(uploadsDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 500 }
});

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200).json(fileService.getFileInfo(req.file));
});

router.post('/upload-multiple', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }
    res.status(200).json(req.files.map(file => fileService.getFileInfo(file)));
});

router.get('/files/:filename', (req, res) => {
    const { filename } = req.params;
    if (!fileService.fileExists(filename)) {
        return res.status(404).send('File not found');
    }
    res.download(fileService.getFilePath(filename));
});

router.get('/files', async (req, res) => {
    try {
        const files = await fileService.getFileList();
        res.status(200).json(files);
    } catch (err) {
        res.status(500).send('Error reading files directory');
    }
});

module.exports = router;