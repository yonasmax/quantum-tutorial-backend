const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Library = require('../models/Library');

// ================================================================
// GET ALL LIBRARY RESOURCES (with filters)
// ================================================================
router.get('/', protect, async (req, res) => {
  try {
    const { category, subject, grade, search } = req.query;
    const query = { isPublic: true };

    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (grade && grade !== 'All') query.grade = { $in: [grade, 'All'] };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const resources = await Library.find(query)
      .populate('uploadedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: resources.length, resources });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET SINGLE RESOURCE
// ================================================================
router.get('/:id', protect, async (req, res) => {
  try {
    const resource = await Library.findById(req.params.id).populate(
      'uploadedBy',
      'fullName'
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.json({ success: true, resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// CREATE RESOURCE (admin only)
// ================================================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      category,
      subject,
      grade,
      coverImage,
      fileUrl,
      fileType,
      isPublic,
    } = req.body;

    if (!title || !fileUrl) {
      return res.status(400).json({ error: 'Title and file URL are required' });
    }

    const resource = await Library.create({
      title,
      author: author || '',
      description: description || '',
      category,
      subject: subject || 'General',
      grade: grade || 'All',
      coverImage: coverImage || '',
      fileUrl,
      fileType: fileType || 'pdf',
      uploadedBy: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    res.status(201).json({ success: true, resource });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// UPDATE RESOURCE (admin only)
// ================================================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const resource = await Library.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ success: true, resource });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// DELETE RESOURCE (admin only)
// ================================================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const resource = await Library.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// INCREMENT DOWNLOAD COUNT
// ================================================================
router.post('/:id/download', protect, async (req, res) => {
  try {
    const resource = await Library.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    resource.downloads += 1;
    await resource.save();

    res.json({ success: true, downloads: resource.downloads });
  } catch (error) {
    console.error('Download count error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;