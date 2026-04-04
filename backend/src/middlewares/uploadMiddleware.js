const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que a pasta de uploads existe (No Vercel usamos /tmp)
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const uploadDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads/justificativas');

if (!isVercel) {
    try {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    } catch (err) {
        console.warn('⚠️ Não foi possível criar a pasta de uploads (normal no Vercel):', err.message);
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo não suportado. Use PDF, JPG ou PNG.'), false);
    }
};

const uploadJustificativa = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = uploadJustificativa;
