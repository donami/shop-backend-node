import mongoose from 'mongoose';
import httpStatus from 'http-status';
import Promise from 'bluebird';
import mongooseDelete from 'mongoose-delete';

import APIError from '../helpers/APIError';

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  name: String,
  description: String,
  images: [{
    url: String,
    label: String,
    main: Boolean,
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  }],
  quantity: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  price: Number,
  onSale: { type: Boolean, default: false },
  discount: {
    value: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  variants: [{
    type: Schema.ObjectId,
    ref: 'Variant',
  }],
  optionTypes: [{
    type: Schema.ObjectId,
    ref: 'OptionType',
  }],
});

ProductSchema.plugin(mongooseDelete);

ProductSchema.statics = {
  get(id) {
    return this.findById(id)
      .populate('category')
      .populate({
        path: 'optionTypes',
        model: 'OptionType',
        populate: {
          path: 'values',
          model: 'OptionValue',
        }
      })
      .populate({
        path: 'variants',
        model: 'Variant',
        populate: {
          path: 'options',
          model: 'OptionValue',
        },
      })
      .then((product) => {
        if (product) {
          return product;
        }
        const err = new APIError('No such product exists!', httpStatus.NOT_FOUND, true);
        return Promise.reject(err);
      });
  },

  list({ skip = 0, limit = 50, query = '' } = {}) {
    return this.find({
      name: new RegExp(query, 'i')
    })
    .populate('category')
    .populate({
      path: 'variants',
      model: 'Variant',
      populate: {
        path: 'options',
        model: 'OptionValue',
      },
    })
    .populate({
      path: 'optionTypes',
      model: 'OptionType',
      populate: {
        path: 'values',
        model: 'OptionValue',
      }
    })
    .sort({
      createdAt: -1
    })
    .skip(+skip)
    .limit(+limit)
    .exec();
  },

};

export default mongoose.model('Product', ProductSchema);
