module.exports = function(crowi, app) {
  'use strict';

  var debug = require('debug')('crowi:routes:login-passport')
    , passport = require('passport')
    , config = crowi.getConfig()
    , Config = crowi.model('Config')
    , passportService = crowi.passportService
    ;

  /**
   * success handler
   * @param {*} req
   * @param {*} res
   */
  const loginSuccess = (req, res, user) => {
    // update lastLoginAt
    user.updateLastLoginAt(new Date(), (err, userData) => {
      if (err) {
        console.log(`updateLastLoginAt dumps error: ${err}`);
        debug(`updateLastLoginAt dumps error: ${err}`);
      }
    });

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
  const loginFailure = (req, res, next) => {
    req.flash('errorMessage', 'Sign in failure.');
    return res.redirect('/login');
  };

  /**
   * middleware that login with LdapStrategy
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  const loginWithLdap = (req, res, next) => {
    if (!passportService.isLdapStrategySetup) {
      debug('LdapStrategy has not been set up');
      return next();
    }

    const loginForm = req.body.loginForm;

    if (!req.form.isValid) {
      debug("invalid form");
      return res.render('login', {
      });
    }

    passport.authenticate('ldapauth', (err, user, info) => {
      if (res.headersSent) {  // dirty hack -- 2017.09.25
        return;               // cz: somehow passport.authenticate called twice when ECONNREFUSED error occurred
      }

      debug('--- authenticate with LdapStrategy ---');
      debug('user', user);
      debug('info', info);

      if (err) {  // DB Error
        console.log('LDAP Server Error: ', err);
        req.flash('warningMessage', 'LDAP Server Error occured.');
        return next(); // pass and the flash message is displayed when all of authentications are failed.
      }
      if (info) {
        if (info.name != null && info.name === 'DuplicatedUsernameException') {
          req.flash('isDuplicatedUsernameExceptionOccured', true);
          return next();
        }
      }
      if (!user) { return next(); }
      req.logIn(user, (err) => {
        if (err) { return next(); }
        else {
          return loginSuccess(req, res);
        }
      });
    })(req, res, next);
  }

  /**
   * middleware that login with LocalStrategy
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
      debug('--- authenticate with LocalStrategy ---');
      debug('user', user);
      debug('info', info);

      if (err) {  // DB Error
        console.log('Database Server Error: ', err);
        req.flash('warningMessage', 'Database Server Error occured.');
        return next(); // pass and the flash message is displayed when all of authentications are failed.
      }
      if (!user) { return next(); }
      req.logIn(user, (err) => {
        if (err) { return next(); }
        else {
          return loginSuccess(req, res);
        }
      });
    })(req, res, next);
  }

  return {
    loginFailure,
    loginWithLdap,
    loginWithLocal,
  };
};
