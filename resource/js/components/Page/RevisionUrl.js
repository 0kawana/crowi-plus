import React from 'react';
import CopyButton from '../CopyButton';

export default class RevisionUrl extends React.Component {

  showToolTip() {
    $('#btnCopy').tooltip('show');
    setTimeout(() => {
      $('#btnCopy').tooltip('hide');
    }, 1000);
  }

  render() {
    const buttonStyle = {
      fontSize: "1em"
    }

    const text = this.props.pagePath + '\n' + this.props.url;
    return (
      <span>
        {this.props.url}
        <CopyButton buttonId="btnCopyRevisionUrl" text={text}
            buttonClassName="btn btn-default" buttonStyle={buttonStyle} iconClassName="fa fa-link text-muted" />
      </span>
    );
  }
}

RevisionUrl.propTypes = {
  pagePath: React.PropTypes.string.isRequired,
  url: React.PropTypes.string.isRequired,
};
