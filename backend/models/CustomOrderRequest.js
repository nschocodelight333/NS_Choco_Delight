const mongoose = require('mongoose');

const customOrderRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Request title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    referenceImageUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        'Pending Review',
        'Quoted',
        'Accepted',
        'Rejected',
        'Converted to Order',
        'Cancelled',
      ],
      default: 'Pending Review',
    },
    quotedPrice: {
      type: Number,
      default: null,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    quotedAt: {
      type: Date,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    // Reference to the converted Order (once customer pays)
    convertedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomOrderRequest', customOrderRequestSchema);
