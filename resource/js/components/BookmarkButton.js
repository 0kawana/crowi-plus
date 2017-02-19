import React from 'react';

import Icon from './Common/Icon'

export default class BookmarkButton extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      bookmarked: false,
      token: null,
    };

    this.handleClick = this.handleClick.bind(this);
  }

  componentWillMount() {
    // FIXME(property?)
    this.setState({
      token: $('#bookmark-button').data('csrftoken'),
    });
  }

  componentDidMount() {
    this.props.crowi.apiGet('/bookmarks.get', {page_id: this.props.pageId})
    .then(res => {
      if (res.bookmark) {
        this.markBookmarked();
      }
    });
  }

  handleClick(event) {
    event.preventDefault();

    const token = this.state.token;
    const pageId = this.props.pageId;

    if (!this.state.bookmarked) {
      $.post('/_api/bookmarks.add', {_csrf: token, page_id: pageId}, (res) => {
        if (res.ok && res.bookmark) {
          this.markBookmarked();
        }
      });
    } else {
      $.post('/_api/bookmarks.remove', {_csrf: token, page_id: pageId}, (res) => {
        if (res.ok) {
          this.markUnBookmarked();
        }
      });
    }
  }

  markBookmarked() {
    this.setState({bookmarked: true});
  }

  markUnBookmarked() {
    this.setState({bookmarked: false});
  }

  render() {
    const iconName = this.state.bookmarked ? 'star' : 'star-o';

    return (
      <a href="#" title="Bookmark" className="bookmark-link" onClick={this.handleClick}>
        <Icon name={iconName} />
      </a>
    );
  }
}

BookmarkButton.propTypes = {
  pageId: React.PropTypes.string,
  crowi: React.PropTypes.object.isRequired,
};
