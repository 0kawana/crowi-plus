exports.login = require('./login');
exports.register = require('./register');
exports.revision = require('./revision');
exports.me = {
  user: require('./me/user'),
  password: require('./me/password')
};
exports.admin = {
  app: require('./admin/app'),
  sec: require('./admin/sec'),
  aws: require('./admin/aws'),
  google: require('./admin/google'),
  fb: require('./admin/fb'),
};
