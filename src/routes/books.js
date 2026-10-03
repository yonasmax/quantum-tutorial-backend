const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Book = require('../models/Book');
const BookOrder = require('../models/BookOrder');

// ================================================================
// GET ALL BOOKS (with filters)
// ================================================================
router.get('/', protect, async (req, res) => {
  try {
    const { category, grade, search, minPrice, maxPrice } = req.query;
    const query = { isPublished: true };

    if (category) query.category = category;
    if (grade && grade !== 'All') query.grade = { $in: [grade, 'All'] };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const books = await Book.find(query)
      .populate('seller', 'fullName')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: books.length, books });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET SINGLE BOOK
// ================================================================
router.get('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'seller',
      'fullName'
    );
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Increment views
    book.views += 1;
    await book.save();

    // Check if this user has already purchased this book
    const existingOrder = await BookOrder.findOne({
      buyer: req.user._id,
      book: book._id,
      status: 'confirmed',
    });

    res.json({
      success: true,
      book,
      hasPurchased: !!existingOrder,
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// CREATE BOOK (admin only)
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
      price,
      fileUrl,
      fileType,
    } = req.body;

    if (!title || !price || !fileUrl) {
      return res.status(400).json({
        error: 'Title, price, and file URL are required',
      });
    }

    const book = await Book.create({
      title,
      author: author || '',
      description: description || '',
      category,
      subject: subject || '',
      grade: grade || 'All',
      coverImage: coverImage || '',
      price: Number(price),
      fileUrl,
      fileType: fileType || 'pdf',
      seller: req.user._id,
    });

    res.status(201).json({ success: true, book });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// UPDATE BOOK (admin only)
// ================================================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// DELETE BOOK (admin only)
// ================================================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ success: true, message: 'Book deleted' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// PLACE ORDER (student buys a book)
// ================================================================
router.post('/:id/order', protect, async (req, res) => {
  try {
    const { paymentMethod, transactionRef, paymentNote, screenshotUrl } =
      req.body;

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Prevent duplicate pending orders
    const existingPending = await BookOrder.findOne({
      buyer: req.user._id,
      book: book._id,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(400).json({
        error: 'You already have a pending order for this book',
        orderId: existingPending._id,
      });
    }

    const order = await BookOrder.create({
      buyer: req.user._id,
      book: book._id,
      seller: book.seller,
      quantity: 1,
      unitPrice: book.price,
      totalPrice: book.price,
      paymentMethod,
      transactionRef: transactionRef || '',
      paymentNote: paymentNote || '',
      screenshotUrl: screenshotUrl || '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Order placed. Awaiting admin confirmation.',
      order,
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET MY ORDERS (student)
// ================================================================
router.get('/orders/my', protect, async (req, res) => {
  try {
    const orders = await BookOrder.find({ buyer: req.user._id })
      .populate('book', 'title author coverImage price fileUrl fileType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET ALL ORDERS (admin)
// ================================================================
router.get('/orders/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await BookOrder.find(query)
      .populate('book', 'title author price')
      .populate('buyer', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// CONFIRM ORDER (admin marks as paid)
// ================================================================
router.put('/orders/:id/confirm', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await BookOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'confirmed') {
      return res.status(400).json({ error: 'Order already confirmed' });
    }

    order.status = 'confirmed';
    order.confirmedBy = req.user._id;
    order.confirmedAt = new Date();
    await order.save();

    // Increment book sales count
    await Book.findByIdAndUpdate(order.book, { $inc: { totalSales: 1 } });

    res.json({
      success: true,
      message: 'Order confirmed. Buyer can now download the book.',
      order,
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// CANCEL ORDER (admin)
// ================================================================
router.put('/orders/:id/cancel', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await BookOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = 'cancelled';
    order.confirmedBy = req.user._id;
    order.confirmedAt = new Date();
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;