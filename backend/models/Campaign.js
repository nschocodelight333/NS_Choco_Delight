const mongoose = require('mongoose');

// Sub-schema for hampers (combo bundles)
const hamperSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  includedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
    },
    occasion: {
      type: String,
      enum: ['Valentines', 'MothersDay', 'FathersDay', 'Diwali', 'Christmas', 'Eid', 'NewYear', 'Custom'],
      default: 'Custom',
    },
    description: {
      type: String,
      default: '',
    },
    bannerImageUrl: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Individual products featured under this campaign
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    // Hamper bundles
    hampers: [hamperSchema],
  },
  { timestamps: true }
);

// Virtual to compute display status
campaignSchema.virtual('status').get(function () {
  const now = new Date();
  if (!this.isActive) return 'Inactive';
  if (now < this.startDate) return 'Scheduled';
  if (now > this.endDate) return 'Expired';
  return 'Active';
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);
