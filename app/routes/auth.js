import express from 'express';
import Jwt from 'jsonwebtoken';
import User from '../models/User';
import Customer from '../models/Customer';
import config from '../config/config'

const router = express.Router();
const privateKey = config.key.privateKey;

function requireAuth(req, res, next) {
  let bearerToken;
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    bearerToken = bearer[1];
    req.token = bearerToken;

    try {
      req.user = Jwt.verify(req.token, privateKey);
    } catch (err) {
      return res.sendStatus(403);
    }

    next();
  } else {
    return res.sendStatus(403);
  }
}

router.use('/userinfo', requireAuth);

router.route('/register')
  .post((req, res) => {
    const user = new User();
    user.username = req.body.username;
    user.password = req.body.password;
    user.email = req.body.email;

    user.save((err) => {
      if (err) {
        return res.send(err);
      }

      return res.json({ message: 'User created!', data: user });
    });
  });

router.route('/')
  .post((req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User
      .findOne({ email, password })
      .populate({
        path: 'customer',
        model: 'Customer',
        populate: {
          path: 'orders',
          model: 'Order',
        }
      })
      .exec((err, user) => {
        if (err) {
          return res.send(err);
        }

        if (!user) {
          return res.json(null);
        }
        const token = Jwt.sign({ _id: user._id, email: user.email }, privateKey);

        return res.json({ token });
      });
  });

router.route('/userinfo')
  .get((req, res) => {
    User
      .findOne({ _id: req.user._id })
      .populate({
        path: 'customer',
        model: 'Customer',
        populate: {
          path: 'orders',
          model: 'Order',
        }
      })
      .populate({
        path: 'orders',
        model: 'Order',
        populate: [
          {
            path: 'items.product',
            model: 'Product',
          },
          {
            path: 'shipping.value',
            model: 'Shipping'
          }
        ],
      })
      .exec((err, user) => {
        if (err) {
          return res.send(err);
        }

        return res.json(user);
      });
  })
  .put((req, res) => {
    User
      .findOne({ _id: req.user._id }).exec()
      .then((user) => {
        user.customer = req.body.customer;
        return user.save();
      })
      .then(user => res.json(user))
      .catch(err => res.status(500).send(err));
  });


export default router;
