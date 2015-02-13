/* jshint browser: true, jquery: true */
/* global FB, marked */
/* Author: Sotaro KARASAWA <sotarok@crocos.co.jp>
*/

var Crowi = {};

Crowi.createErrorView = function(msg) {
  $('#main').prepend($('<p class="alert-message error">' + msg + '</p>'));
};

Crowi.linkPath = function(revisionPath) {
  var $revisionPath = revisionPath || '#revision-path';
  var $title = $($revisionPath);
  if (!$title.get(0)) {
    return;
  }

  var path = '';
  var pathHtml = '';
  var splittedPath = $title.html().split(/\//);
  splittedPath.shift();
  splittedPath.forEach(function(sub) {
    path += '/';
    pathHtml += ' <a href="' + path + '">/</a> ';
    if (sub) {
      path += sub;
      pathHtml += '<a href="' + path + '">' + sub + '</a>';
    }
  });
  if (path.substr(-1, 1) != '/') {
    path += '/';
    pathHtml += ' <a href="' + path + '" class="last-path">/</a>';
  }
  $title.html(pathHtml);
};

Crowi.correctHeaders = function(contentId) {
  // h1 ~ h6 の id 名を補正する
  var $content = $(contentId || '#revision-body-content');
  var i = 0;
  $('h1,h2,h3,h4,h5,h6', $content).each(function(idx, elm) {
    var id = 'head' + i++;
    $(this).attr('id', id);
    $(this).addClass('revision-head');
    $(this).append('<span class="revision-head-link"><a href="#' + id +'"><i class="fa fa-link"></i></a></span>');
  });
};

Crowi.revisionToc = function(contentId, tocId) {
  var $content = $(contentId || '#revision-body-content');
  var $tocId = $(tocId || '#revision-toc');

  var $tocContent = $('<div id="revision-toc-content" class="revision-toc-content collapse"></div>');
  $tocId.append($tocContent);

  $('h1', $content).each(function(idx, elm) {
    var id = $(this).attr('id');
    var title = $(this).text();
    var selector = '#' + id + ' ~ h2:not(#' + id + ' ~ h1 ~ h2)';

    var $toc = $('<ul></ul>');
    var $tocLi = $('<li><a href="#' + id +'">' + title + '</a></li>');


    $tocContent.append($toc);
    $toc.append($tocLi);

    $(selector).each(function()
    {
      var id2 = $(this).attr('id');
      var title2 = $(this).text();
      var selector2 = '#' + id2 + ' ~ h3:not(#' + id2 + ' ~ h2 ~ h3)';

      var $toc2 = $('<ul></ul>');
      var $tocLi2 = $('<li><a href="#' + id2 +'">' + title2 + '</a></li>');

      $tocLi.append($toc2);
      $toc2.append($tocLi2);

      $(selector2).each(function()
      {
        var id3 = $(this).attr('id');
        var title3 = $(this).text();

        var $toc3 = $('<ul></ul>');
        var $tocLi3 = $('<li><a href="#' + id3 +'">' + title3 + '</a></li>');

        $tocLi2.append($toc3);
        $toc3.append($tocLi3);
      });
    });
  });
};


Crowi.escape = function(s) {
  s = s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    ;
  return s;
};
Crowi.unescape = function(s) {
  s = s.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, '\'')
    .replace(/&quot;/g, '"')
    ;
  return s;
};

Crowi.getRendererType = function() {
  return new Crowi.rendererType.markdown();
};

Crowi.rendererType = {};
Crowi.rendererType.markdown = function(){};
Crowi.rendererType.markdown.prototype = {
  render: function(contentText) {
    marked.setOptions({
      gfm: true,
      highlight: function (code, lang, callback) {
        var result, hl;
        if (lang) {
          try {
            hl = hljs.highlight(lang, code);
            result = hl.value;
          } catch (e) {
            result = code;
          }
        } else {
          //result = hljs.highlightAuto(code);
          //callback(null, result.value);
          result = code;
        }
        return callback(null, result);
      },
      tables: true,
      breaks: true,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      langPrefix: 'lang-'
    });

    var contentHtml = Crowi.unescape(contentText);
    contentHtml = this.expandImage(contentHtml);
    contentHtml = this.link(contentHtml);

    var $body = this.$revisionBody;
    // Using async version of marked
    marked(contentHtml, {}, function (err, content) {
      if (err) {
        throw err;
      }
      $body.html(content);
    });
  },
  link: function (content) {
    return content
      //.replace(/\s(https?:\/\/[\S]+)/g, ' <a href="$1">$1</a>') // リンク
      .replace(/\s<((\/[^>]+?){2,})>/g, ' <a href="$1">$1</a>') // ページ間リンク: <> でかこまれてて / から始まり、 / が2個以上
      ;
  },
  expandImage: function (content) {
    return content.replace(/\s(https?:\/\/[\S]+\.(jpg|jpeg|gif|png))/g, ' <a href="$1"><img src="$1" class="auto-expanded-image"></a>');
  }
};

Crowi.renderer = function (contentText, revisionBody) {
  var $revisionBody = revisionBody || $('#revision-body-content');

  this.contentText = contentText;
  this.$revisionBody = $revisionBody;
  this.format = 'markdown'; // とりあえず
  this.renderer = Crowi.getRendererType();
  this.renderer.$revisionBody = this.$revisionBody;
};
Crowi.renderer.prototype = {
  render: function() {
    this.renderer.render(this.contentText);
  }
};

$(function() {
  Crowi.linkPath();

  $('[data-toggle="tooltip"]').tooltip();
  $('[data-tooltip-stay]').tooltip('show');

  $('.copy-link').on('click', function () {
    $(this).select();
  });

  $('#createMemo').on('shown.bs.modal', function (e) {
    $('#memoName').focus();
  });
  $('#createMemoForm').submit(function(e)
  {
    var prefix = $('[name=memoNamePrefix]', this).val();
    var name = $('[name=memoName]', this).val();
    if (name === '') {
      prefix = prefix.slice(0, -1);
    }
    top.location.href = prefix + name;

    return false;
  });

  $('#renamePage').on('shown.bs.modal', function (e) {
    $('#newPageName').focus();
  });
  $('#renamePageForm').submit(function(e) {
    var path = $('#pagePath').html();
    $.ajax({
      type: 'POST',
      url: '/_api/page_rename' + path,
      data: $('#renamePageForm').serialize(),
      dataType: 'json'
    }).done(function(data) {
      if (!data.status) {
        $('#newPageNameCheck').html('<i class="fa fa-times-circle"></i> ' + data.message);
        $('#newPageNameCheck').addClass('alert-danger');
      } else {
        $('#newPageNameCheck').removeClass('alert-danger');

        $('#newPageNameCheck').html('<img src="/images/loading_s.gif"> 移動しました。移動先にジャンプします。');

        setTimeout(function() {
          top.location.href = data.page.path + '?renamed=' + path;
        }, 1000);
      }
    });

    return false;
  });

});

