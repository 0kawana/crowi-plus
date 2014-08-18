module.exports = function(app) {
  'use strict';

  var googleapis = require('googleapis')
    , debug = require('debug')('crowi:routes:login')
    , models = app.set('models')
    , config = require('config')
    , Page = models.Page
    , User = models.User
    , Revision = models.Revision
    , actions = {};

  var loginSuccess = function(req, res, userData) {
    req.user = req.session.user = userData;
    if (!userData.password) {
      return res.redirect('/me/password');
    }

    var jumpTo = req.session.jumpTo;
    if (jumpTo) {
      req.session.jumpTo = null;
      return res.redirect(jumpTo);
    } else {
      return res.redirect('/');
    }
  };

  var loginFailure = function(req, res) {
    req.flash('warningMessage', 'ログインに失敗しました');
    return res.redirect('/login');
  };

  actions.googleCallback = function(req, res) {
    var nextAction = req.session.googleCallbackAction || '/login';
    debug('googleCallback.nextAction', nextAction);
    req.session.googleAuthCode = req.query.code || '';

    return res.redirect(nextAction);
  };

  actions.login = function(req, res) {
    var loginForm = req.body.loginForm;

    if (req.method == 'POST' && req.form.isValid) {
      var email = loginForm.email;
      var password = loginForm.password;

      User.findUserByEmailAndPassword(email, password, function(err, userData) {
        debug('on login findUserByEmailAndPassword', err, userData);
        if (userData) {
          loginSuccess(req, res, userData);
        } else {
          loginFailure(req, res);
        }
      });
    } else { // method GET
      return res.render('login', {
      });
    }
  };

  actions.loginGoogle = function(req, res) {
    var code = req.session.googleAuthCode || null;

    if (!code) {
      require('../lib/googleAuth').createAuthUrl(req, function(err, redirectUrl) {
        if (err) {
          // TODO
        }

        req.session.googleCallbackAction = '/login/google';
        return res.redirect(redirectUrl);
      });
    } else {
      require('../lib/googleAuth').handleCallback(req, function(err, tokenInfo) {
        console.log('handleCallback', err, tokenInfo);
        if (err) {
          return loginFailure(req, res);
        }

        var googleId = tokenInfo.user_id;
        User.findUserByGoogleId(googleId, function(err, userData) {
          console.log('findUserByGoogleId', err, userData);
          if (!userData) {
            return loginFailure(req, res);
          }
          return loginSuccess(req, res, userData);
        });
      });
    }
  };

  actions.loginFacebook = function(req, res) {
    var facebook = req.facebook;

    facebook.getUser(function(err, fbId) {
      if (err || !fbId) {
        req.user = req.session.user = false;
        return res.redirect('/login');
      }

      User.findUserByFacebookId(fbId, function(err, userData) {
        console.log('on login findUserByFacebookId', err, userData);
        if (userData) {
          return loginSuccess(req, res, userData);
        } else {
          return loginFailure(req, res);
        }
      });
    });
  };

  actions.register = function(req, res) {
    var registerForm = req.body.registerForm || {};

    // ログイン済みならさようなら
    if (req.user) {
      return res.redirect('/');
    }

    // config で closed ならさよなら
    if (config.security.registrationMode == 'Closed') {
      return res.redirect('/');
    }

    if (req.method == 'POST' && req.form.isValid) {
      var name = registerForm.name;
      var username = registerForm.username;
      var email = registerForm.email;
      var password = registerForm.password;
      var facebookId = registerForm.fbId || null;
      var googleId = registerForm.googleId || null;

      // email と username の unique チェックする
      User.isRegisterable(email, username, function (isRegisterable, errOn) {
        var isError = false;
        if (!User.isEmailValid(email)) {
          isError = true;
          req.flash('registerWarningMessage', 'このメールアドレスは登録できません。(ホワイトリストなどを確認してください)');
        }
        if (!isRegisterable) {
          if (!errOn.username) {
            isError = true;
            req.flash('registerWarningMessage', 'このユーザーIDは利用できません。');
          }
          if (!errOn.email) {
            isError = true;
            req.flash('registerWarningMessage', 'このメールアドレスは登録済みです。');
          }

        }
        if (isError) {
          return res.render('login', {
          });
        }

        User.createUserByEmailAndPassword(name, username, email, password, function(err, userData) {
          if (err) {
            req.flash('registerWarningMessage', 'ユーザー登録に失敗しました。');
            return res.redirect('/login?register=1');
          } else {
            if (facebookId || googleId) {
              userData.updateGoogleIdAndFacebookId(googleId, facebookId, function(err, userData) {
                if (err) { // TODO
                }
                return loginSuccess(req, res, userData);
              });
            } else {
              return loginSuccess(req, res, userData);
            }
          }
        });
      });
    } else { // method GET
      // google callback を受ける可能性もある
      var code = req.session.googleAuthCode || null;

      console.log('register. if code', code);
      if (code) {
        require('../lib/googleAuth').handleCallback(req, function(err, tokenInfo) {
          if (err) {
            req.flash('registerWarningMessage', 'Googleコネクト中にエラーが発生しました。');
            return res.redirect('/login?register=1'); // TODO Handling
          }

          var googleId = tokenInfo.user_id;
          var googleEmail = tokenInfo.email;
          if (!User.isEmailValid(googleEmail)) {
            req.flash('registerWarningMessage', 'このメールアドレスのGoogleアカウントはコネクトできません。');
            return res.redirect('/login?register=1');
          }

          return res.render('login', {
            googleId: googleId,
            googleEmail: googleEmail,
          });
        });
      } else {
        return res.render('login', {
        });
      }
    }
  };

  actions.registerGoogle = function(req, res) {
    require('../lib/googleAuth').createAuthUrl(req, function(err, redirectUrl) {
      if (err) {
        // TODO
      }

      req.session.googleCallbackAction = '/register';
      return res.redirect(redirectUrl);
    });
  };

  return actions;
};
