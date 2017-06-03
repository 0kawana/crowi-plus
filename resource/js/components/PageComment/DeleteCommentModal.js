import React from 'react';
import PropTypes from 'prop-types';

import { Button, Modal } from 'react-bootstrap';
import moment from 'moment/src/moment';

import ReactUtils from '../ReactUtils';
import UserPicture from '../User/UserPicture';

export default class DeleteCommentModal extends React.Component {

  constructor(props) {
    super(props);
  }

  componentWillMount() {
  }

  render() {
    if (this.props.comment === undefined) {
      return <div></div>
    }

    const comment = this.props.comment;
    const commentDate = moment(comment.createdAt).format('YYYY/MM/DD HH:mm');
    let commentBody = comment.comment
    if (commentBody.length > 200) { // omit
      commentBody = commentBody.substr(0,200) + '...';
    }
    commentBody = ReactUtils.nl2br(commentBody);

    return (
      <Modal show={this.props.isShown} onHide={this.props.cancel} className="page-comment-delete-modal">
        <Modal.Header closeButton>
          <Modal.Title>Delete comment?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserPicture user={comment.creator} size="xs" /> <strong>{comment.creator.username}</strong> wrote on {commentDate}:
          <p className="comment-body">{commentBody}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.cancel}>Cancel</Button>
          <Button onClick={this.props.confirmedToDelete} className="btn-danger">Delete</Button>
        </Modal.Footer>
      </Modal>
    );
  }

}

DeleteCommentModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  comment: PropTypes.object,
  cancel: PropTypes.func.isRequired,            // for cancel evnet handling
  confirmedToDelete: PropTypes.func.isRequired, // for confirmed event handling
};
