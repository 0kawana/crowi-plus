import React from 'react';
import ReactDOM from 'react-dom';

import Crowi from './util/Crowi';
import CrowiRenderer from './util/CrowiRenderer';

import HeaderSearchBox  from './components/HeaderSearchBox';
import SearchPage       from './components/SearchPage';
import PageListSearch   from './components/PageListSearch';
import PageHistory      from './components/PageHistory';
import PageAttachment   from './components/PageAttachment';
import SeenUserList     from './components/SeenUserList';
import RevisionPath     from './components/Page/RevisionPath';
import RevisionUrl      from './components/Page/RevisionUrl';
import BookmarkButton   from './components/BookmarkButton';
//import PageComment  from './components/PageComment';

if (!window) {
  window = {};
}

const mainContent = document.querySelector('#content-main');
let pageId = null;
let pagePath;
let pageContent = null;
if (mainContent !== null) {
  pageId = mainContent.attributes['data-page-id'].value;
  pagePath = mainContent.attributes['data-path'].value;
  const rawText = document.getElementById('raw-text-original');
  if (rawText) {
    pageContent = rawText.innerHTML;
  }
}

// FIXME
const crowi = new Crowi({
  me: $('#content-main').data('current-username'),
  csrfToken: $('#content-main').data('csrftoken'),
}, window);
window.crowi = crowi;
crowi.setConfig(JSON.parse(document.getElementById('crowi-context-hydrate').textContent || '{}'));
crowi.fetchUsers();

const crowiRenderer = new CrowiRenderer();
window.crowiRenderer = crowiRenderer;

// FIXME
var isEnabledPlugins = $('body').data('plugin-enabled');
if (isEnabledPlugins) {
  var crowiPlugin = window.crowiPlugin;
  crowiPlugin.installAll(crowi, crowiRenderer);
}

const componentMappings = {
  'search-top': <HeaderSearchBox crowi={crowi} />,
  'search-page': <SearchPage crowi={crowi} />,
  'page-list-search': <PageListSearch crowi={crowi} />,
  'page-attachment': <PageAttachment pageId={pageId} pageContent={pageContent} crowi={crowi} />,

  //'revision-history': <PageHistory pageId={pageId} />,
  //'page-comment': <PageComment />,
  'seen-user-list': <SeenUserList pageId={pageId} crowi={crowi} />,
  'bookmark-button': <BookmarkButton pageId={pageId} crowi={crowi} />,
};
if (pagePath) {
  componentMappings['revision-path'] = <RevisionPath pagePath={pagePath} />;
  componentMappings['revision-url'] = <RevisionUrl pageId={pageId} pagePath={pagePath} />;
}

Object.keys(componentMappings).forEach((key) => {
  const elem = document.getElementById(key);
  if (elem) {
    ReactDOM.render(componentMappings[key], elem);
  }
});

// うわーもうー
$('a[data-toggle="tab"][href="#revision-history"]').on('show.bs.tab', function() {
  ReactDOM.render(<PageHistory pageId={pageId} crowi={crowi} />, document.getElementById('revision-history'));
});
