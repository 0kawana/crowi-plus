import React from 'react';
import md5 from 'md5';

// TODO UserComponent?
export default class UserPicture extends React.Component {

  getUserPicture(user) {
    // gravatar
    if (user.isGravatarEnabled === true) {
      return this.generateGravatarSrc(user);
    }
    // uploaded image
    else if (user.image && user.image != '/images/userpicture.png') {
      return user.image;
    }
    else {
      return '/images/userpicture.png';
    }
  }

  generateGravatarSrc(user) {
    const hash = md5(user.email.trim().toLowerCase());
    return `https://gravatar.com/avatar/${hash}`;
  }

  getClassName() {
    let className = ['picture', 'picture-rounded'];
    if (this.props.size) {
      className.push('picture-' + this.props.size);
    }

    return className.join(' ');
  }

  render() {
    const user = this.props.user;

    return (
      <img
        src={this.getUserPicture(user)}
        alt={user.username}
        className={this.getClassName()}
        />
    );
  }
}

UserPicture.propTypes = {
  user: React.PropTypes.object.isRequired,
  size: React.PropTypes.string,
};

UserPicture.defaultProps = {
  user: {},
  size: null,
};
