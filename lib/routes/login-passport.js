module.exports = function(crowi, app) {
  'use strict';

  var debug = require('debug')('crowi:routes:login-passport')
    , passport = require('passport')
    , config = crowi.getConfig()
    , Config = crowi.model('Config');

  /**
   * success handler
   * @param {*} req
   * @param {*} res
   */
  const loginSuccess = (req, res, userData) => {
    req.session.user = userData;

    var jumpTo = req.session.jumpTo;
    if (jumpTo) {
      req.session.jumpTo = null;
      return res.redirect(jumpTo);
    } else {
      return res.redirect('/');
    }
  };

  /**
   * failure handler
   * @param {*} req
   * @param {*} res
   */
  const loginFailure = (req, res) => {
    return res.redirect('/login');
  };


  const loginWithLdap = (req, res, next) => {
    // TODO impl with vesse/passport-ldapauth
    return next({});
  }

  /**
   * login with LocalStrategy action
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  const loginWithLocal = (req, res, next) => {
    const loginForm = req.body.loginForm;

    if (!req.form.isValid) {
      return res.render('login', {
      });
    }

    passport.authenticate('local', (err, user, info) => {
      debug('---authentication with passport start---');
      debug('user', user);
      debug('info', info);

      if (err) { return loginFailure(req, res); }
      if (!user) { return loginFailure(req, res); }
      req.logIn(user, (err) => {
        if (err != null) {
          debug(err);
          return loginFailure(req, res);
        }
        return loginSuccess(req, res, user);
      });

      debug('---authentication with passport end---');
    })(req, res, next);
  }

  return {
    loginWithLdap,
    loginWithLocal,
  };
};
