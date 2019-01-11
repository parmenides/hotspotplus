import config from '../../server/modules/config';

module.exports = function(Coupon) {
  Coupon.validatesUniquenessOf('uniqueCouponId');

  Coupon.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.isNewInstance) {
      ctx.instance.uniqueCouponId =
        (ctx.instance.businessId || '_' + config.ADMIN_OWNER_ID) +
        ctx.instance.code;
    }
    next();
  });

  Coupon.verifyGiftCode = function(giftCode, cb) {
    Coupon.findOne(
      {
        where: {
          and: [{ code: giftCode }, { ownerId: config.ADMIN_OWNER_ID }],
        },
      },
      function(error, result) {
        if (error) {
          return cb(error);
        }
        return cb(null, result);
      },
    );
  };

  Coupon.remoteMethod('verifyGiftCode', {
    accepts: [{ arg: 'giftCode', type: 'string', required: true }],
    returns: { root: true },
  });
};
