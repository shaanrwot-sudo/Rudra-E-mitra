const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const queuePath = path.join(dataDir, 'uploads.json');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || 'upload');
    const safeName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|png|jpg|jpeg|doc|docx|xls|xlsx)$/i)) {
      cb(null, true);
      return;
    }

    cb(new Error('Unsupported file type'));
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

function readUploads() {
  try {
    const data = fs.readFileSync(queuePath, 'utf8');
    if (!data.trim()) return [];
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeUploads(items) {
  fs.writeFileSync(queuePath, JSON.stringify(items, null, 2));
}

function normalizeShopName(shopName) {
  return (shopName || 'CSC Cyber Cafe').trim() || 'CSC Cyber Cafe';
}

app.get('/api/config', (req, res) => {
  res.json({ baseUrl: BASE_URL, siteName: 'Rudra E-Mitra' });
});

app.get('/api/qr', async (req, res) => {
  const shopName = normalizeShopName(req.query.shop || 'CSC Cyber Cafe');
  const customerUrl = `${BASE_URL}/customer?shop=${encodeURIComponent(shopName)}`;

  try {
    const qrCode = await QRCode.toDataURL(customerUrl);
    res.json({ url: customerUrl, qrCode });
  } catch (error) {
    res.status(500).json({ message: 'QR generation failed', error: error.message });
  }
});

app.get('/api/uploads', (req, res) => {
  const uploads = readUploads().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(uploads);
});

app.post('/api/upload', upload.array('documents', 10), (req, res) => {
  try {
    const uploads = readUploads();
    const uploadedFiles = (req.files || []).map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `${BASE_URL}/uploads/${file.filename}`
    }));

    const submission = {
      id: uuidv4(),
      customerName: req.body.customerName || 'Unspecified',
      phone: req.body.phone || '',
      service: req.body.service || 'General Service',
      notes: req.body.notes || '',
      shop: normalizeShopName(req.body.shop || 'CSC Cyber Cafe'),
      createdAt: new Date().toISOString(),
      documents: uploadedFiles
    };

    uploads.unshift(submission);
    writeUploads(uploads);

    res.status(201).json({
      message: 'Documents uploaded successfully',
      submission,
      redirectUrl: `${BASE_URL}/customer?shop=${encodeURIComponent(submission.shop)}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

app.get('/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error) {
    res.status(400).json({ message: error.message || 'Bad request' });
    return;
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Rudra E-Mitra running at ${BASE_URL}`);
});
