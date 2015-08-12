(function($) {
    $.QueryString = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'))
})(jQuery);

function cleanPhoneAUS(num) {
    // remove country code
    num = num.replace("+61", "");
    // remove spaces, parens
    num = num.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '');
    // remove plus, dash
    num = num.replace("+", "").replace(/\-/g, '');

    if (!parseInt(num) || (num.length != 10)) {
        return false;
    }

    return num;
}

function checkPhoneInputAUS(param) {
    // let this function be used for events and direct inputs
    input = param.target ? $(param.target): param;

    input.next('.input-icon')
        .removeClass('icon-mobile')
        .removeClass('icon-phone')
        .removeClass('icon-help-circled')
        .removeClass('error')
        .removeClass('valid');
    input.siblings('.help-text').text('');

    var val = cleanPhoneAUS(input.val());
    var isMobile = /^04[0-9, ]{1,10}$/.test(val);
    var isLandline = /^0[^4][0-9, ]{1,9}$/.test(val);

    if (isMobile) {
        input.next('.input-icon').addClass('icon-mobile').addClass('valid');
        return true;
    } else if (isLandline) {
        input.next('.input-icon').addClass('icon-phone').addClass('valid');
        return true;
    } else {
        input.next('.input-icon').addClass('icon-help-circled').addClass('error');
        input.siblings('.help-text').text('Please ensure this is a valid Australian phone number, with area code.');
        return false;
    }
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

var trackEvent = function(ev) {
    window['optimizely'] = window['optimizely'] || [];
    window.optimizely.push(["trackEvent", ev]);

    ga('send', 'event', ev);
};

$(document).ready(function() {
    // form prefill values from url params
    var prefill_fields = ['name', 'phone', 'email'];
    for (var i in prefill_fields) {
        var field_name = prefill_fields[i];
        var prefill_val = $.QueryString[field_name];
        if (prefill_val) {
            $('input[name='+field_name+']').val(prefill_val).trigger('blur');
        }
    }

    // use akid as signal for new user
    var akid = $.QueryString.akid;
    if (akid === undefined || akid === '') {
        $('input#id_name').show();
    }

    // setup faq toggle
    $('a#faq-toggle').click(function() {
        $('div.faq').slideToggle();
    });

    // live AUS phone formatter
    $('input#id_phone').formatter({
      'patterns': [
            { '^04[0-9, ]{1,9}$': '{{9999}} {{999}} {{999}}' },
            { '^0[^4][0-9, ]{1,9}$': '({{99}}) {{9999}} {{9999}}' },
            { '*': '{{**********}}' },
        ]
    });
    $('input#id_phone').blur(checkPhoneInputAUS);

    // call form submit
    $('#callForm').submit(function(e) {
        e.preventDefault();

        $('input#id_phone').trigger('blur');
        var phone = cleanPhoneAUS($('input#id_phone').val());

        if (!phone || !checkPhoneInputAUS($('input#id_phone'))) {
            return $('input#id_phone').siblings('.help-text').text('Please enter an Australian phone number');
        }

        // submit to actionkit
        $.ajax({
            url: 'https://act.sumofus.org/rest/v1/action/',
            type: 'post',
            dataType: 'json',
            data: $('#callForm').serialize(),
            success: function(response) {
                console.log(response);
                trackEvent('ak-signup');
            },
            error: function(xhr, status, message) {
                console.error(status, message);
            }
        });

        // submit to call power
        var callData = {
            campaignId: 2,
            userPhone: phone
        };
        /*
        $.ajax({
            url: 'http://sumofus.callpower.org/call/create',
            type: "get",
            dataType: "json",
            data: callData,
            success: function(response) {
                trackEvent('call-placed');
            }
        });
        */
        $('.overlay').css('display', 'table');
        setTimeout(function() {
            $('.overlay').addClass('visible');
            setTimeout(function() {
                $('.overlay .inner').addClass('visible');
            }, 10);
        }, 100);
    });

    $('.overlay .close').click(function() {
      $('.overlay').css('display','none');
    });
    
});