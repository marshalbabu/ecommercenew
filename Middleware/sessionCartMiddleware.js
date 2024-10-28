module.exports = (req, res, next) => {
    if (!req.session.cart) {
      req.session.cart = { items: [], totalPrice: 0 };
    }
    next();
  };
  