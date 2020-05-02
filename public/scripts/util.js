// requires jquery

var util = {
  getQueryValue: function(key) {
    var pairs = location.search.substr(1).split('&');
    for(var i=0; i<pairs.length; i++) {
      var pair = pairs[i].split('=');
      if (pair.length > 1 && pair[0] == key) {
        //console.log(pair[1]);
        return pair[1];
      }
    }

    return null;
  },

  addConfirmation: function(confirm) {
    var block = $('.confirm');
    if (block.length) {
      block.append(confirm + '<br />');
    }
    else {
      $('#main').append('<div class="confirm">'+confirm+'<br /></div>');
    }
  },

  addError: function(error) {
    var block = $('.errors');
    if (block.length) {
      block.append(error + '<br />');
    }
    else {
      $('#main').append('<div class="errors">'+error+'<br /></div>');
    }
  },

  displayStatus: function() {
    var status = Number(util.getQueryValue('status'));
    if (!status) {
      return;
    }
    switch(status) {
      case 500:
      util.addError('Operation failed. An unexpected error occured.');
      break;
      case 422:
      util.addError('Invalid or incomplete information.');
      break;
      case 415:
      util.addError('Unsupported media type.');
      break;
      case 409:
      util.addError('This email belongs to another user.');
      break;
      case 401:
      util.addError('Login failed.');
      break;
      case 200:
      util.addConfirmation('Update successful.');
      break;
    }
  },

  bindData: function(path) {
    $.ajax({
      dataType: 'json',
      url: path,
      success: function(data) {
        $.each( data, function( key, val ) {
          var el = $('#'+key);
          if (el.is('input:checkbox')) {
            $('.myCheckbox').prop('checked', val);
          }
          else if (el.is('input')) {
            $('#'+key).val(val);
          }
          else {
            $('#'+key).html(val);
          }
        });
      }
    });
  },

  validateEmail: function(email) {
    // https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
    var rx = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return email.match(rx);
  },

  validateImage: function(path) {
    return path.match(/^(http:|https:).+\..+\.(gif|png|jpg)$/i);
  }
}
