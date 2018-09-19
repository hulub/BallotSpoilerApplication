$(function () {
  app.initialize()
})

var app = {
  // Application Constructor
  initialize: function () {
    app.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    $(document).bind('deviceready', app.onDeviceReady);
    $(document).on('click', '#scan', app.startScanning)
    $(document).on('click', '#rescan', app.startScanning)
    $(document).on('submit', 'form#decrytpion-form', app.decrypt)
  },

  onDeviceReady: function () {
    $('body').pagecontainer('change', '#front-page');
  },

  startScanning: function () {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        if (result.cancelled) {
          $('body').pagecontainer('change', '#front-page');
        } else {
          var text_hex = result.text.split(',');
          var cryptogram_randomness_hex = text_hex[0]
          var cryptogram_ciphertext_hex = text_hex[1]
          var public_key_hex = text_hex[2]
          var randomness_hex = text_hex[3]

          $('#cryptogram').val(cryptogram_randomness_hex + ',' + cryptogram_ciphertext_hex)
          $('#public-key').val(public_key_hex)
          $('#randomness').val(randomness_hex)

          app.hideDecryptedVote()
          $('body').pagecontainer('change', '#data-page');
        }

      },
      function (error) {
        alert("Scanning failed!");
        $('body').pagecontainer('change', '#front-page');
      },
      {
        preferFrontCamera : false, // iOS and Android
        showFlipCameraButton : true, // iOS and Android
        showTorchButton : true, // iOS and Android
        torchOn: false, // Android, launch with the torch switched on (if available)
        saveHistory: false, // Android, save scan history (default false)
        prompt : "Place the vote QR code inside the scan area", // Android
        resultDisplayDuration: 1500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
        formats : "QR_CODE", // default: all but PDF_417 and RSS_EXPANDED
        orientation : "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
        disableAnimations : false, // iOS
        disableSuccessBeep : false // iOS and Android
      }
    );
  },

  checkPermissionCallback: function (status) {
    if (!status.hasPermission) {
      var errorCallback = function () {
        alert('Camera permission is not turned on');
      }

      permissions.requestPermission(
        permissions.CAMERA,
        function (status) {
          if (!status.hasPermission) errorCallback();
        },
        errorCallback);
    } else {
      alert('Camera permission allowed');
    }
  },

  decrypt: function () {
    app.hideDecryptedVote()

    var cryptogram_hex = $(this).find('#cryptogram').val().replace('\n', ',')
    var public_key_hex = $(this).find('#public-key').val()
    var randomness_hex = $(this).find('#randomness').val()

    var cryptogram = ElGamalPointCryptogram.fromString(cryptogram_hex)
    var public_key = pointFromBits(sjcl.codec.hex.toBits(public_key_hex))
    var randomness = sjcl.bn.fromBits(sjcl.codec.hex.toBits(randomness_hex));

    // invert cryptogram so you can decrypt with the randomness
    cryptogram = new ElGamalPointCryptogram(public_key, cryptogram.ciphertext_point)
    var vote = cryptogram.decrypt(randomness)
    var vote_hex = sjcl.codec.hex.fromBits(pointToBits(vote, true))

    $('#vote-point').val(vote_hex)

    try {
      var vote_decoding = pointToVote(vote)
      switch (vote_decoding.vote_encoding_type) {
        case vote_encoding_types.TEXT:
          $('#vote-text-span').text(vote_decoding.vote)
          $('#vote-text').show()
          $('#decrypted-success').show()
          break;
        case vote_encoding_types.IDS:
          var $vote_ids_list = $('#vote-ids-list').empty()
          vote_decoding.vote.filter(function (id) {
              return id != 0
            }
          ).forEach(function (id) {
            $vote_ids_list.append('<li>' + '<span>' + id + '</span>' + '</li>')
          })
          $('#vote-ids').show()
          $('#decrypted-success').show()
          break;
        case vote_encoding_types.BLANK:
          $('#vote-text-span').text('BLANK')
          $('#vote-text').show()
          $('#decrypted-success').show()
          break;
      }
    }
    catch(err) {
      $('#decrypted-error').show()
    }

    $('#decrypted-vote-header').show()
    $('#decrypted-vote-content').show()

    return false
  },

  hideDecryptedVote: function() {
    $('#decrypted-vote-header').hide()
    $('#decrypted-vote-content').hide()
    $('#vote-text').hide()
    $('#vote-ids').hide()
    $('#decrypted-success').hide()
    $('#decrypted-error').hide()
  }
}