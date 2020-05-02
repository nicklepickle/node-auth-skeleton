$(document).ready(function() {
  util.displayStatus();

  $('form').submit(function(){
    $('.errors').html('');
    $('.confirm').html('');
    var errors = [];

    if ($('#nameLast').val().length < 1) {
      errors.push('Last name is required.');
    }

    if (!util.validateEmail($('#email').val())) {
      errors.push('A valid email is required.');
    }

    var path = $('#avatarPath').val();
    if (path.length > 0 && !util.validateImage(path)) {
      errors.push('Images must be gif, jpg or png.');
    }

    for (var i=0; i<errors.length; i++) {
      util.addError(errors[i]);
    }
    return errors.length == 0;
  });

});
