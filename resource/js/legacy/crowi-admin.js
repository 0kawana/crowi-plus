$(function() {
  var UpdatePost = {};

  $('#slackNotificationForm').on('submit', function(e) {
    $.post('/_api/admin/notification.add', $(this).serialize(), function(res) {
      if (res.ok) {
        // TODO Fix
        location.reload();
      }
    });

    return false;
  });

  $('form.admin-remove-updatepost').on('submit', function(e) {
    $.post('/_api/admin/notification.remove', $(this).serialize(), function(res) {
      if (res.ok) {
        // TODO Fix
        location.reload();
      }
    });
    return false;
  });

  $('#createdUserModal').modal('show');

  $('#admin-password-reset-modal').on('show.bs.modal', function(button) {
    var data = $(button.relatedTarget);
    var userId = data.data('user-id');
    var email = data.data('user-email');

    $('#admin-password-reset-user').text(email);
    $('#admin-users-reset-password input[name=user_id]').val(userId);
  });

  $('form#admin-users-reset-password').on('submit', function(e) {
    $.post('/_api/admin/users.resetPassword', $(this).serialize(), function(res) {
      if (res.ok) {
        // TODO Fix
        //location.reload();
        $('#admin-password-reset-modal').modal('hide');
        $('#admin-password-reset-modal-done').modal('show');

        $("#admin-password-reset-done-user").text(res.user.email);
        $("#admin-password-reset-done-password").text(res.newPassword);
        return ;
      }

      // fixme
      alert('Failed to reset password');
    });

    return false;
  });

  $('#admin-delete-user-group-modal').on('show.bs.modal', function (button) {
    var data = $(button.relatedTarget);
    var userGroupId = data.data('user-group-id');
    var userGroupName = data.data('user-group-name');
    var relatedUsers = data.data('related-users');

    $('#admin-delete-user-group-name').text(userGroupName);
    $('#admin-user-groups-delete input[name=user-group_id]').val(userGroupId);
  });

  $('form#admin-user-groups-delete').on('submit', function (e) {
    $.post('/_api/admin/userGroups.delete', $(this).serialize(), function (res) {
      if (res.ok) {
        // TODO Fix
        //location.reload();
        $('#admin-delete-user-group-modal').modal('hide');
        return;
      }

      // fixme
      alert('Failed to reset password');
    });

    return false;
  });

});
