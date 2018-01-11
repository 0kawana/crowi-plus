module.exports = function(crowi, app) {
  'use strict';

  var debug = require('debug')('crowi:routes:admin')
    , models = crowi.models
    , Page = models.Page
    , User = models.User
    , UserGroup = models.UserGroup
    , UserGroupRelation = models.UserGroupRelation
    , Config = models.Config
    , PluginUtils = require('../plugins/plugin-utils')
    , pluginUtils = new PluginUtils()
    , ApiResponse = require('../util/apiResponse')

    , MAX_PAGE_LIST = 50
    , actions = {};

  function createPager(total, limit, page, pagesCount, maxPageList) {
    const pager = {
      page: page,
      pagesCount: pagesCount,
      pages: [],
      total: total,
      previous: null,
      previousDots: false,
      next: null,
      nextDots: false,
    };

    if (page > 1) {
      pager.previous = page - 1;
    }

    if (page < pagesCount) {
      pager.next = page + 1;
    }

    let pagerMin = Math.max(1, Math.ceil(page - maxPageList/2));
    let pagerMax = Math.min(pagesCount, Math.floor(page + maxPageList/2));
    if (pagerMin === 1) {
      if (MAX_PAGE_LIST < pagesCount) {
        pagerMax = MAX_PAGE_LIST;
      } else {
        pagerMax = pagesCount;
      }
    }
    if (pagerMax === pagesCount) {
      if ((pagerMax - MAX_PAGE_LIST) < 1) {
        pagerMin = 1;
      } else {
        pagerMin = pagerMax - MAX_PAGE_LIST;
      }
    }

    pager.previousDots = null;
    if (pagerMin > 1) {
      pager.previousDots = true;
    }

    pager.nextDots = null;
    if (pagerMax < pagesCount) {
      pager.nextDots = true;
    }

    for (let i = pagerMin; i <= pagerMax; i++) {
      pager.pages.push(i);
    }

    return pager;
  }

  actions.index = function(req, res) {
    return res.render('admin/index', {
      plugins: pluginUtils.listPlugins(crowi.rootDir),
    });
  };

  // app.get('/admin/app'                  , admin.app.index);
  actions.app = {};
  actions.app.index = function(req, res) {
    var settingForm;
    settingForm = Config.setupCofigFormData('crowi', req.config);

    return res.render('admin/app', {
      settingForm: settingForm,
    });
  };

  actions.app.settingUpdate = function(req, res) {
  };

  // app.get('/admin/security'                  , admin.security.index);
  actions.security = {};
  actions.security.index = function(req, res) {
    var settingForm;
    settingForm = Config.setupCofigFormData('crowi', req.config);
    return res.render('admin/security', { settingForm });
  };

  // app.get('/admin/markdown'                  , admin.markdown.index);
  actions.markdown = {};
  actions.markdown.index = function(req, res) {
    var config = crowi.getConfig();
    var markdownSetting = Config.setupCofigFormData('markdown', config);
    return res.render('admin/markdown', {
      markdownSetting: markdownSetting,
    });
  };

  // app.post('/admin/markdown/lineBreaksSetting' , admin.markdown.lineBreaksSetting);
  actions.markdown.lineBreaksSetting = function(req, res) {
    var markdownSetting = req.form.markdownSetting;

    req.session.markdownSetting = markdownSetting;
    if (req.form.isValid) {
      Config.updateNamespaceByArray('markdown', markdownSetting, function(err, config) {
        Config.updateConfigCache('markdown', config);
        req.session.markdownSetting = null;
        req.flash('successMessage', ['Successfully updated!']);
        return res.redirect('/admin/markdown');
      });
    } else {
      req.flash('errorMessage', req.form.errors);
      return res.redirect('/admin/markdown');
    }
  };

  // app.get('/admin/customize' , admin.customize.index);
  actions.customize = {};
  actions.customize.index = function(req, res) {
    var settingForm;
    settingForm = Config.setupCofigFormData('crowi', req.config);

    return res.render('admin/customize', {
      settingForm: settingForm,
    });
  };

  // app.get('/admin/notification'               , admin.notification.index);
  actions.notification = {};
  actions.notification.index = function(req, res) {
    var config = crowi.getConfig();
    var UpdatePost = crowi.model('UpdatePost');
    var slackSetting = Config.setupCofigFormData('notification', config);
    var hasSlackWebClientConfig = Config.hasSlackWebClientConfig(config);
    var hasSlackIwhUrl = Config.hasSlackIwhUrl(config);
    var hasSlackToken = Config.hasSlackToken(config);
    var slack = crowi.slack;
    var slackAuthUrl = '';

    if (!Config.hasSlackWebClientConfig(req.config)) {
      slackSetting['slack:clientId'] = '';
      slackSetting['slack:clientSecret'] = '';
    }
    else {
      slackAuthUrl = slack.getAuthorizeURL();
    }
    if (!Config.hasSlackIwhUrl(req.config)) {
      slackSetting['slack:incomingWebhookUrl'] = '';
    }

    if (req.session.slackSetting) {
      slackSetting = req.session.slackSetting;
      req.session.slackSetting = null;
    }

    UpdatePost.findAll()
    .then(function(settings) {
      return res.render('admin/notification', {
        settings,
        slackSetting,
        hasSlackWebClientConfig,
        hasSlackIwhUrl,
        hasSlackToken,
        slackAuthUrl
      });
    });
  };

  // app.post('/admin/notification/slackSetting' , admin.notification.slackauth);
  actions.notification.slackSetting = function(req, res) {
    var slackSetting = req.form.slackSetting;

    req.session.slackSetting = slackSetting;
    if (req.form.isValid) {
      Config.updateNamespaceByArray('notification', slackSetting, function(err, config) {
        Config.updateConfigCache('notification', config);
        req.flash('successMessage', ['Successfully Updated!']);
        req.session.slackSetting = null;

        // Re-setup
        crowi.setupSlack().then(function() {
          return res.redirect('/admin/notification');
        });
      });
    } else {
      req.flash('errorMessage', req.form.errors);
      return res.redirect('/admin/notification');
    }
  };

  // app.get('/admin/notification/slackAuth'     , admin.notification.slackauth);
  actions.notification.slackAuth = function(req, res) {
    const code = req.query.code;
    const config = crowi.getConfig();

    if (!code || !Config.hasSlackConfig(req.config)) {
      return res.redirect('/admin/notification');
    }

    const slack = crowi.slack;
    slack.getOauthAccessToken(code)
    .then(data => {
      debug('oauth response', data);
        Config.updateNamespaceByArray('notification', {'slack:token': data.access_token}, function(err, config) {
          if (err) {
            req.flash('errorMessage', ['Failed to save access_token. Please try again.']);
          } else {
            Config.updateConfigCache('notification', config);
            req.flash('successMessage', ['Successfully Connected!']);
          }

          return res.redirect('/admin/notification');
        });
    }).catch(err => {
      debug('oauth response ERROR', err);
      req.flash('errorMessage', ['Failed to fetch access_token. Please do connect again.']);
      return res.redirect('/admin/notification');
    });
  };

  actions.search = {};
  actions.search.index = function(req, res) {
    var search = crowi.getSearcher();
    if (!search) {
      return res.redirect('/admin');
    }

    return res.render('admin/search', {
    });
  };

  // app.post('/admin/notification/slackIwhSetting' , admin.notification.slackIwhSetting);
  actions.notification.slackIwhSetting = function(req, res) {
    var slackIwhSetting = req.form.slackIwhSetting;

    if (req.form.isValid) {
      Config.updateNamespaceByArray('notification', slackIwhSetting, function(err, config) {
        Config.updateConfigCache('notification', config);
        req.flash('successMessage', ['Successfully Updated!']);

        // Re-setup
        crowi.setupSlack().then(function() {
          return res.redirect('/admin/notification#slack-incoming-webhooks');
        });
      });
    } else {
      req.flash('errorMessage', req.form.errors);
      return res.redirect('/admin/notification#slack-incoming-webhooks');
    }
  };

  // app.post('/admin/notification/slackSetting/disconnect' , admin.notification.disconnectFromSlack);
  actions.notification.disconnectFromSlack = function(req, res) {
    const config = crowi.getConfig();
    const slack = crowi.slack;

    Config.updateNamespaceByArray('notification', {'slack:token': ''}, function(err, config) {
      Config.updateConfigCache('notification', config);
      req.flash('successMessage', ['Successfully Disconnected!']);

      return res.redirect('/admin/notification');
    });
  };

  actions.search.buildIndex = function(req, res) {
    var search = crowi.getSearcher();
    if (!search) {
      return res.redirect('/admin');
    }

    return new Promise(function(resolve, reject) {
      search.deleteIndex()
        .then(function(data) {
          debug('Index deleted.');
          resolve();
        }).catch(function(err) {
          debug('Delete index Error, but if it is initialize, its ok.', err);
          resolve();
        });
    })
    .then(function() {
      return search.buildIndex()
    })
    .then(function(data) {
      if (!data.errors) {
        debug('Index created.');
      }
      return search.addAllPages();
    })
    .then(function(data) {
      if (!data.errors) {
        debug('Data is successfully indexed.');
        req.flash('successMessage', 'Data is successfully indexed.');
      } else {
        debug('Data index error.', data.errors);
        req.flash('errorMessage', `Data index error: ${data.errors}`);
      }
      return res.redirect('/admin/search');
    })
    .catch(function(err) {
      debug('Error', err);
      req.flash('errorMessage', `Error: ${err}`);
      return res.redirect('/admin/search');
    });
  };

  actions.user = {};
  actions.user.index = function(req, res) {
    var page = parseInt(req.query.page) || 1;

    User.findUsersWithPagination({page: page}, function(err, result) {
      const pager = createPager(result.total, result.limit, result.page, result.pages, MAX_PAGE_LIST);

      return res.render('admin/users', {
        users: result.docs,
        pager: pager
      });
    });
  };

  actions.user.invite = function(req, res) {
    var form = req.form.inviteForm;
    var toSendEmail = form.sendEmail || false;
    if (req.form.isValid) {
      User.createUsersByInvitation(form.emailList.split('\n'), toSendEmail, function(err, userList) {
        if (err) {
          req.flash('errorMessage', req.form.errors.join('\n'));
        } else {
          req.flash('createdUser', userList);
        }
        return res.redirect('/admin/users');
      });
    } else {
      req.flash('errorMessage', req.form.errors.join('\n'));
      return res.redirect('/admin/users');
    }
  };

  actions.user.makeAdmin = function(req, res) {
    var id = req.params.id;
    User.findById(id, function(err, userData) {
      userData.makeAdmin(function(err, userData) {
        if (err === null) {
          req.flash('successMessage', userData.name + 'さんのアカウントを管理者に設定しました。');
        } else {
          req.flash('errorMessage', '更新に失敗しました。');
          debug(err, userData);
        }
        return res.redirect('/admin/users');
      });
    });
  };

  actions.user.removeFromAdmin = function(req, res) {
    var id = req.params.id;
    User.findById(id, function(err, userData) {
      userData.removeFromAdmin(function(err, userData) {
        if (err === null) {
          req.flash('successMessage', userData.name + 'さんのアカウントを管理者から外しました。');
        } else {
          req.flash('errorMessage', '更新に失敗しました。');
          debug(err, userData);
        }
        return res.redirect('/admin/users');
      });
    });
  };

  actions.user.activate = function(req, res) {
    var id = req.params.id;
    User.findById(id, function(err, userData) {
      userData.statusActivate(function(err, userData) {
        if (err === null) {
          req.flash('successMessage', userData.name + 'さんのアカウントを承認しました');
        } else {
          req.flash('errorMessage', '更新に失敗しました。');
          debug(err, userData);
        }
        return res.redirect('/admin/users');
      });
    });
  };

  actions.user.suspend = function(req, res) {
    var id = req.params.id;

    User.findById(id, function(err, userData) {
      userData.statusSuspend(function(err, userData) {
        if (err === null) {
          req.flash('successMessage', userData.name + 'さんのアカウントを利用停止にしました');
        } else {
          req.flash('errorMessage', '更新に失敗しました。');
          debug(err, userData);
        }
        return res.redirect('/admin/users');
      });
    });
  };

  actions.user.remove = function(req, res) {
    var id = req.params.id;
    let username = '';

    return new Promise((resolve, reject) => {
      User.findById(id, (err, userData) => {
        username = userData.username;
        return resolve(userData);
      });
    })
    .then((userData) => {
      return new Promise((resolve, reject) => {
        userData.statusDelete((err, userData) => {
          if (err) {
            reject(err);
          }
          resolve(userData);
        });
      });
    })
    .then((userData) => {
      return Page.removePageByPath(`/user/${username}`)
        .then(() => userData);
    })
    .then((userData) => {
      req.flash('successMessage', `${username} さんのアカウントを削除しました`);
      return res.redirect('/admin/users');
    })
    .catch((err) => {
      req.flash('errorMessage', '削除に失敗しました。');
      return res.redirect('/admin/users');
    });
  };

  // これやったときの relation の挙動未確認
  actions.user.removeCompletely = function(req, res) {
    // ユーザーの物理削除
    var id = req.params.id;

    User.removeCompletelyById(id, function(err, removed) {
      if (err) {
        debug('Error while removing user.', err, id);
        req.flash('errorMessage', '完全な削除に失敗しました。');
      } else {
        req.flash('successMessage', '削除しました');
      }
      return res.redirect('/admin/users');
    });
  };

  // app.post('/_api/admin/users.resetPassword' , admin.api.usersResetPassword);
  actions.user.resetPassword = function(req, res) {
    const id = req.body.user_id;
    const User = crowi.model('User');

    User.resetPasswordByRandomString(id)
    .then(function(data) {
      data.user = User.filterToPublicFields(data.user);
      return res.json(ApiResponse.success(data));
    }).catch(function(err) {
      debug('Error on reseting password', err);
      return res.json(ApiResponse.error('Error'));
    });
  }

  actions.userGroup = {};
  actions.userGroup.index = function (req, res) {
    var page = parseInt(req.query.page) || 1;

    UserGroup.findUserGroupsWithPagination({ page: page }, function (err, result) {
      const pager = createPager(result.total, result.limit, result.page, result.pages, MAX_PAGE_LIST);
      var userGroups = result.docs
      var groupRelations = new Map();
      if (userGroups) {
        userGroups.forEach(group => {
          UserGroupRelation.findAllRelationForUserGroup(group)
          .then(function(relations) {
            debug(group);
            debug(relations);
            groupRelations.set(group, relations);
            debug('groupRelations is ', groupRelations);
          }).catch(function(err) {
            debug('Error on find all relations', err);
            return res.json(ApiResponse.error('Error'));
          });
        });
      }
      return res.render('admin/user-groups', {
        userGroups: userGroups,
        userGroupRelations: groupRelations,
        pager: pager
      });
    });
  };

  // グループ詳細
  actions.userGroup.detail = function (req, res) {
    var name = req.params.name;
    UserGroup.findUserGroupByName(name)
    .then( function(data) {
      var userGroup = data
      var groupRelations = [];
      if (userGroup) {
        UserGroupRelation.findAllRelationForUserGroup(userGroup)
        .then(function (data) {
          debug('user-group-detail succeed', data);
          return res.render('admin/user-group-detail', {
            userGroup: userGroup,
            userGroupRelations: data
          });
        }).catch(function (err) {
          debug('Error on find all relations', err);
          return res.json(ApiResponse.error('Error'));
        });
      }
    })
    .catch(function(err) {
      debug('Error on get userGroupDetail', err);
      return res.json(ApiResponse.error('Error'));
    });
  }

  //グループの生成
  actions.userGroup.create = function (req, res) {
    var form = req.form.createGroupForm;
    if (req.form.isValid) {
      UserGroup.isRegisterableName(form.userGroupName, function (registerable){
        if (registerable) {
          UserGroup.createGroupByName(form.userGroupName, function (err, newUserGroup) {
            if (err) {
              req.flash('errorMessage', req.form.errors.join('\n'));
            } else {
              req.flash('successMessage', newUserGroup.name)
              req.flash('createdUserGroup', newUserGroup);
            }
            return res.redirect('/admin/user-groups');
          });
        }
        else {
          req.flash('errorMessage', '同じグループ名が既に存在します。');
          debug('userGroupName', form.userGroupName);
          return res.redirect('/admin/user-groups');
        }
      });
    } else {
      req.flash('errorMessage', req.form.errors.join('\n'));
      return res.redirect('/admin/user-groups');
    }
  };

  actions.userGroup.uploadGroupPicture = function (req, res) {
    var fileUploader = require('../util/fileUploader')(crowi, app);
    //var storagePlugin = new pluginService('storage');
    //var storage = require('../service/storage').StorageService(config);

    var tmpFile = req.file || null;
    if (!tmpFile) {
      return res.json({
        'status': false,
        'message': 'File type error.'
      });
    }

    var tmpPath = tmpFile.path;
    var filePath = User.createUserPictureFilePath(req.user, tmpFile.filename + tmpFile.originalname);
    var acceptableFileType = /image\/.+/;

    if (!tmpFile.mimetype.match(acceptableFileType)) {
      return res.json({
        'status': false,
        'message': 'File type error. Only image files is allowed to set as user picture.',
      });
    }

    var tmpFileStream = fs.createReadStream(tmpPath, { flags: 'r', encoding: null, fd: null, mode: '0666', autoClose: true });

    fileUploader.uploadFile(filePath, tmpFile.mimetype, tmpFileStream, {})
      .then(function (data) {
        var imageUrl = fileUploader.generateUrl(filePath);
        req.userGroup.updateImage(imageUrl, function (err, data) {
          fs.unlink(tmpPath, function (err) {
            if (err) {
              debug('Error while deleting tmp file.', err);
            }

            return res.json({
              'status': true,
              'url': imageUrl,
              'message': '',
            });
          });
        });
      }).catch(function (err) {
        debug('Uploading error', err);

        return res.json({
          'status': false,
          'message': 'Error while uploading to ',
        });
      });
  };

  // app.post('/_api/admin/user-group/delete' , admin.userGroup.removeCompletely);
  actions.userGroup.removeCompletely = function (req, res) {
    const id = req.body.user_group_id;

    UserGroup.removeCompletelyById(id, function (err, removed) {
      if (err) {
        debug('Error while removing userGroup.', err, id);
        req.flash('errorMessage', '完全な削除に失敗しました。');
      } else {
        req.flash('successMessage', '削除しました');
      }
      return res.redirect('/admin/user-groups');
    });
  }

  actions.userGroupRelation = {};
  actions.userGroupRelation.index = function(req, res) {

  }

  actions.userGroupRelation.create = function(req, res) {
    const User = crowi.model('User');
    const UserGroup = crowi.model('UserGroup');
    const UserGroupRelation = crowi.model('UserGroupRelation');

    // ユーザを名前で検索
    User.findUserByUsername(req.body.user_name)
      .then((user) => {
        // ユーザグループをIDで検索
        UserGroup.findById(req.body.user_group_id, function(err, userGroup) {
          if (err) {
            debug('Error on create user-group relation', err);
            return res.json(ApiResponse.error('Error'));
          }
          // Relation を作成
          UserGroupRelation.createRelation(userGroup, user, function (err, data) {
            if (err) {
              debug('Error on create user-group relation', err);
              return res.json(ApiResponse.error('Error'));
            }
            return res.json(ApiResponse.success(data));
          });

        });

      }).catch((err) => {
        debug('Error on create user-group relation', err);
        return res.json(ApiResponse.error('Error'));
      });
  }

  actions.userGroupRelation.remove = function (req, res) {
    const UserGroupRelation = crowi.model('UserGroupRelation');
    var name = req.params.name;
    var relationId = req.params.relationId;

    debug(name, relationId);
    UserGroupRelation.removeById(relationId, function(err) {
      if (err) {
        debug('Error on remove user-group-relation', err);
        req.flash('errorMessage', 'グループのユーザ削除に失敗しました。');
      }
      return res.redirect('/admin/user-group-detail/' + name);
    });

  }

  actions.api = {};
  actions.api.appSetting = function(req, res) {
    var form = req.form.settingForm;

    if (req.form.isValid) {
      debug('form content', form);

      // mail setting ならここで validation
      if (form['mail:from']) {
        validateMailSetting(req, form, function(err, data) {
          debug('Error validate mail setting: ', err, data);
          if (err) {
            req.form.errors.push('SMTPを利用したテストメール送信に失敗しました。設定をみなおしてください。');
            return res.json({status: false, message: req.form.errors.join('\n')});
          }

          return saveSetting(req, res, form);
        });
      } else {
        return saveSetting(req, res, form);
      }
    } else {
      return res.json({status: false, message: req.form.errors.join('\n')});
    }
  };

  actions.api.securitySetting = function(req, res) {
    var form = req.form.settingForm;

    if (req.form.isValid) {
      debug('form content', form);
      return saveSetting(req, res, form);
    } else {
      return res.json({status: false, message: req.form.errors.join('\n')});
    }
  };

  actions.api.customizeSetting = function(req, res) {
    var form = req.form.settingForm;

    if (req.form.isValid) {
      debug('form content', form);
      return saveSetting(req, res, form);
    } else {
      return res.json({status: false, message: req.form.errors.join('\n')});
    }
  }

  // app.post('/_api/admin/notifications.add'    , admin.api.notificationAdd);
  actions.api.notificationAdd = function(req, res) {
    var UpdatePost = crowi.model('UpdatePost');
    var pathPattern = req.body.pathPattern;
    var channel = req.body.channel;

    debug('notification.add', pathPattern, channel);
    UpdatePost.create(pathPattern, channel, req.user)
    .then(function(doc) {
      debug('Successfully save updatePost', doc);

      // fixme: うーん
      doc.creator = doc.creator._id.toString();
      return res.json(ApiResponse.success({updatePost: doc}));
    }).catch(function(err) {
      debug('Failed to save updatePost', err);
      return res.json(ApiResponse.error());
    });
  };

  // app.post('/_api/admin/notifications.remove' , admin.api.notificationRemove);
  actions.api.notificationRemove = function(req, res) {
    var UpdatePost = crowi.model('UpdatePost');
    var id = req.body.id;

    UpdatePost.remove(id)
    .then(function() {
      debug('Successfully remove updatePost');

      return res.json(ApiResponse.success({}));
    }).catch(function(err) {
      debug('Failed to remove updatePost', err);
      return res.json(ApiResponse.error());
    });
  };

  // app.get('/_api/admin/users.search' , admin.api.userSearch);
  actions.api.usersSearch = function(req, res) {
    const User = crowi.model('User');
    const email =req.query.email;

    User.findUsersByPartOfEmail(email, {})
    .then(users => {
      const result = {
        data: users
      };
      return res.json(ApiResponse.success(result));
    }).catch(err => {
      return res.json(ApiResponse.error());
    });
  };

  function saveSetting(req, res, form)
  {
    Config.updateNamespaceByArray('crowi', form, function(err, config) {
      Config.updateConfigCache('crowi', config);
      return res.json({status: true});
    });
  }

  function validateMailSetting(req, form, callback)
  {
    var mailer = crowi.mailer;
    var option = {
      host: form['mail:smtpHost'],
      port: form['mail:smtpPort'],
    };
    if (form['mail:smtpUser'] && form['mail:smtpPassword']) {
      option.auth = {
        user: form['mail:smtpUser'],
        pass: form['mail:smtpPassword'],
      };
    }
    if (option.port === 465) {
      option.secure = true;
    }

    var smtpClient = mailer.createSMTPClient(option);
    debug('mailer setup for validate SMTP setting', smtpClient);

    smtpClient.sendMail({
      to: req.user.email,
      subject: 'Wiki管理設定のアップデートによるメール通知',
      text: 'このメールは、WikiのSMTP設定のアップデートにより送信されています。'
    }, callback);
  }


  return actions;
};

