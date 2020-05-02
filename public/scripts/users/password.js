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

    if (policy && pw.length < policy.minlength) {
      errors.push('Passwords must be ' + policy.minlength + ' characters long.');
    }

    if (policy && !pw.match(new RegExp(policy.expression))) {
      errors.push(policy.message);
    }

    if ($('#password').val() != $('#confirm').val()) {
      errors.push('Passwords do not match.')
    }

    for (var i=0; i<errors.length; i++) {
      util.addError(errors[i]);
    }
    return errors.length == 0;
  });

});
