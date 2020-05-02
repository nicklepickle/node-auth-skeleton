$(document).ready(function() {
  var policy = null;
  $.ajax({
    dataType: "json",
    url: '/users/policy',
    success: function(data) {
      policy=data;
    }
  });
  util.displayStatus();

  $('form').submit(function(){

    $('.errors').html('');
    var errors = [];
    var pw = $('#password').val();
    var email = $('#username').val();

    if (policy && pw.length < policy.minlength) {
      errors.push('Invalid password.');
    }

    if (!util.validateEmail(email)) {
      errors.push('Invalid email.');
    }

    for (var i=0; i<errors.length; i++) {
      util.addError(errors[i]);
    }
    return errors.length == 0;
  });

});
