const router = require('express').Router();
const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const Video  = require('../models/Video');
const { requireAdmin } = require('../middleware/authMiddleware');

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'videos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-');
    cb(null, `video-${Date.now()}-${base}${ext}`);
  },
});

const thumbStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'images', 'video-thumbs');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `thumb-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'video_file') {
        const dir = path.join(__dirname, '..', 'public', 'videos');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      } else {
        const dir = path.join(__dirname, '..', 'public', 'images', 'video-thumbs');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      }
    },
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-');
      const prefix = file.fieldname === 'video_file' ? 'video' : 'thumb';
      cb(null, `${prefix}-${Date.now()}-${base}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video_file') {
      const ok = ['.mp4', '.webm', '.mov', '.avi'];
      cb(null, ok.includes(path.extname(file.originalname).toLowerCase()));
    } else {
      const ok = ['.jpg', '.jpeg', '.png', '.webp'];
      cb(null, ok.includes(path.extname(file.originalname).toLowerCase()));
    }
  },
  limits: { fileSize: 200 * 1024 * 1024 }, 
}).fields([
  { name: 'video_file', maxCount: 1 },
  { name: 'thumbnail',  maxCount: 1 },
]);

const handleUpload = (req, res, next) => {
  upload(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

function getEmbedUrl(url) {
  if (!url) return '';

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  if (url.includes('/embed/') || url.includes('player.vimeo')) return url;

  return url;
}

function getYoutubeThumbnail(url) {
  const ytMatch = url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return '';
}

router.get('/', async (req, res) => {
  try {
    const videos = await Video.find({ is_active: true }).sort({ sort_order: 1, created_at: -1 });
    const result = videos.map(v => {
      const obj = v.toObject();
      obj.embed_url = getEmbedUrl(v.video_url);
      if (!obj.thumbnail && v.source_type === 'youtube') {
        obj.auto_thumbnail = getYoutubeThumbnail(v.video_url);
      }
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', requireAdmin, async (req, res) => {
  try {
    const videos = await Video.find().sort({ sort_order: 1, created_at: -1 });
    const result = videos.map(v => {
      const obj = v.toObject();
      obj.embed_url = getEmbedUrl(v.video_url);
      if (!obj.thumbnail && v.source_type === 'youtube') {
        obj.auto_thumbnail = getYoutubeThumbnail(v.video_url);
      }
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, handleUpload, async (req, res) => {
  try {
    const { title, description, source_type, video_url, sort_order } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });

    const videoFile = req.files?.video_file?.[0];
    const thumbFile = req.files?.thumbnail?.[0];

    const video = await Video.create({
      title:       title.trim(),
      description: description || '',
      source_type: source_type || 'youtube',
      video_url:   video_url   || '',
      video_file:  videoFile ? `/videos/${videoFile.filename}` : '',
      thumbnail:   thumbFile  ? `/images/video-thumbs/${thumbFile.filename}` : '',
      sort_order:  parseInt(sort_order) || 0,
      is_active:   true,
    });

    const obj = video.toObject();
    obj.embed_url      = getEmbedUrl(video.video_url);
    obj.auto_thumbnail = getYoutubeThumbnail(video.video_url);
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, handleUpload, async (req, res) => {
  try {
    const existing = await Video.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Video not found.' });

    const { title, description, source_type, video_url, sort_order, is_active } = req.body;
    const videoFile = req.files?.video_file?.[0];
    const thumbFile  = req.files?.thumbnail?.[0];

    const update = {
      title:       title?.trim()    || existing.title,
      description: description      ?? existing.description,
      source_type: source_type      || existing.source_type,
      video_url:   video_url        ?? existing.video_url,
      sort_order:  sort_order !== undefined ? parseInt(sort_order) || 0 : existing.sort_order,
      is_active:   is_active  !== undefined ? (is_active === 'true' || is_active === true) : existing.is_active,
    };

    if (videoFile) {
      if (existing.video_file) {
        fs.unlink(path.join(__dirname, '..', 'public', existing.video_file), () => {});
      }
      update.video_file = `/videos/${videoFile.filename}`;
    }

    if (thumbFile) {
      if (existing.thumbnail) {
        fs.unlink(path.join(__dirname, '..', 'public', existing.thumbnail), () => {});
      }
      update.thumbnail = `/images/video-thumbs/${thumbFile.filename}`;
    }

    const video = await Video.findByIdAndUpdate(req.params.id, update, { new: true });
    const obj   = video.toObject();
    obj.embed_url      = getEmbedUrl(video.video_url);
    obj.auto_thumbnail = getYoutubeThumbnail(video.video_url);
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found.' });
    if (video.video_file) fs.unlink(path.join(__dirname, '..', 'public', video.video_file), () => {});
    if (video.thumbnail)  fs.unlink(path.join(__dirname, '..', 'public', video.thumbnail),  () => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;