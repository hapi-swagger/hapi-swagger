var appName;
var popupMask;
var popupDialog;
var clientId;
var realm;
var redirect_uri;
var clientSecret;
var scopeSeparator;
var additionalQueryStringParams;

function groupScopeByOAuthScheme(scopes) {
  var scopeByOAuthScheme = [];
  scopes.forEach(function(scope) {
    var OAuthScheme = scopeByOAuthScheme.find(function(OAuthScheme) {
      return OAuthScheme.name === scope.OAuthSchemeKey
    });
    if(!OAuthScheme) {
      OAuthScheme = {
        name: scope.OAuthSchemeKey,
        scopes: []
      }
      scopeByOAuthScheme.push(OAuthScheme)
    }
    OAuthScheme.scopes.push(scope);
  });
  return scopeByOAuthScheme;
}

function handleLogin() {
  var scopes = [];

  var auths = window.swaggerUi.api.authSchemes || window.swaggerUi.api.securityDefinitions;
  if(auths) {
    var key;
    var defs = auths;
    for(key in defs) {
      var auth = defs[key];
      if(auth.type === 'oauth2' && auth.scopes) {
        var scope;
        if(Array.isArray(auth.scopes)) {
          // 1.2 support
          var i;
          for(i = 0; i < auth.scopes.length; i++) {
            scopes.push(auth.scopes[i]);
          }
        }
        else {
          // 2.0 support
          for(scope in auth.scopes) {
            scopes.push({scope: scope, description: auth.scopes[scope], OAuthSchemeKey: key});
          }
        }
      }
    }
  }

  if(window.swaggerUi.api
    && window.swaggerUi.api.info) {
    appName = window.swaggerUi.api.info.title;
  }

  $('.api-popup-dialog').remove(); 
  popupDialog = $(
    [
      '<div class="api-popup-dialog">',
      '<div class="api-popup-title">Select OAuth2.0 Scopes</div>',
      '<div class="api-popup-content">',
        '<p>Scopes are used to grant an application different levels of access to data on behalf of the end user. Each API may declare one or more scopes.',
          '<a href="#">Learn how to use</a>',
        '</p>',
        '<p><strong>' + appName + '</strong> API requires the following scopes. Select which ones you want to grant to Swagger UI.</p>',
        '<form id="form_authorization"><span>OpenId client_id to use in authentication, given by the ClubMed API team):</span>',
        '<input required class="input_client_id" type="text" id="input_client_id" />',
        '<ul class="api-popup-scopes">',
        '</ul></form>',
        '<p class="error-msg"></p>',
        '<div class="api-popup-actions"><button class="api-popup-authbtn api-button green" type="submit">Authorize</button><button class="api-popup-cancel api-button gray" type="button">Cancel</button></div>',
      '</div>',
      '</div>'].join(''));
  $(document.body).append(popupDialog);

  //TODO: only display applicable scopes (will need to pass them into handleLogin)
  popup = popupDialog.find('ul.api-popup-scopes').empty();

  var scopeByOAuthScheme = groupScopeByOAuthScheme(scopes)
  scopeByOAuthScheme.forEach(function(OAuthScheme) {
    var str = '<li><input type="radio" required name="OAuthScheme" class="schemeSelector" value="' + OAuthScheme.name + '" id="OAuthScheme_' + OAuthScheme.name + '"/>'
    str += '<label for="OAuthScheme_' + OAuthScheme.name + '">' + OAuthScheme.name + '</label><ul class="scope_list">';
    OAuthScheme.scopes.forEach(function(scope, index) {
      str += '<li><input type="checkbox" disabled="disabled" id="scope_' + index + '" scope="' + scope.scope + '" oauthtype="' + scope.OAuthSchemeKey + '"/><label for="scope_' + index + '">'+ scope.scope;
      str += '<br/><span class="api-scope-desc">' + scope.description + '</span>';
      str += '</label></li>';
    })
    str += '</ul></li>';
    popup.append(str);
  })

  $('.schemeSelector').on('click', function(){
    $('.api-popup-scopes :checkbox').prop('checked', false)
    $(this).parent().find(':checkbox').prop('checked', 'checked')
  })

  var $win = $(window),
    dw = $win.width(),
    dh = $win.height(),
    st = $win.scrollTop(),
    dlgWd = popupDialog.outerWidth(),
    dlgHt = popupDialog.outerHeight(),
    top = (dh -dlgHt)/2 + st,
    left = (dw - dlgWd)/2;

  popupDialog.css({
    top: (top < 0? 0 : top) + 'px',
    left: (left < 0? 0 : left) + 'px'
  });

  popupDialog.find('button.api-popup-cancel').click(function() {
    popupMask.hide();
    popupDialog.hide();
    popupDialog.empty();
    popupDialog = [];
  });

  $('#form_authorization input').on('change', function() {
    $('#form_authorization input').each(function() {
      if(this.checkValidity()) $(this).removeClass('invalid');
    });
  });

  $('button.api-popup-authbtn').unbind();
  popupDialog.find('button.api-popup-authbtn').click(function() {
    if(!$('#form_authorization')[0].checkValidity()) {
      $('#form_authorization input:invalid').addClass('invalid');
      return;
    }

    popupMask.hide();
    popupDialog.hide();

    var authSchemes = window.swaggerUi.api.authSchemes;
    var host = window.location;
    var defaultRedirectUrl = host.protocol + '//' + host.host + location.pathname + (location.pathname.endsWith('/') ? '' : '/') + 'o2c.html';
    var redirectUrl = window.oAuthRedirectUrl || defaultRedirectUrl;
    var url = null;
    var scopes = []
    var o = popup.find('input:checked'); 
    var OAuthSchemeKeys = [];
    var state;
    for(k =0; k < o.length; k++) {
      var scope = $(o[k]).attr('scope');
      if (scopes.indexOf(scope) === -1)
        scopes.push(scope);
      var OAuthSchemeKey = $(o[k]).attr('oauthtype');      
      if (OAuthSchemeKeys.indexOf(OAuthSchemeKey) === -1)
          OAuthSchemeKeys.push(OAuthSchemeKey);
    }
    
    //TODO: merge not replace if scheme is different from any existing 
    //(needs to be aware of schemes to do so correctly)
    window.enabledScopes=scopes;    
    
    for (var key in authSchemes) { 
      if (authSchemes.hasOwnProperty(key) && OAuthSchemeKeys.indexOf(key) != -1) { //only look at keys that match this scope.
        var flow = authSchemes[key].flow;

        if(authSchemes[key].type === 'oauth2' && flow && (flow === 'implicit' || flow === 'accessCode')) {
          var dets = authSchemes[key];
          url = dets.authorizationUrl + '?response_type=' + (flow === 'implicit' ? encodeURIComponent('id_token token') : 'code');
          window.swaggerUi.tokenName = dets.tokenName || 'access_token';
          window.swaggerUi.tokenUrl = (flow === 'accessCode' ? dets.tokenUrl : null);
          state = key;
        }
        else if(authSchemes[key].type === 'oauth2' && flow && (flow === 'application')) {
            var dets = authSchemes[key];
            window.swaggerUi.tokenName = dets.tokenName || 'access_token';
            clientCredentialsFlow(scopes, dets.tokenUrl, key);
            return;
        }        
        else if(authSchemes[key].grantTypes) {
          // 1.2 support
          var o = authSchemes[key].grantTypes;
          for(var t in o) {
            if(o.hasOwnProperty(t) && t === 'implicit') {
              var dets = o[t];
              var ep = dets.loginEndpoint.url;
              url = dets.loginEndpoint.url + '?response_type=token';
              window.swaggerUi.tokenName = dets.tokenName;
            }
            else if (o.hasOwnProperty(t) && t === 'accessCode') {
              var dets = o[t];
              var ep = dets.tokenRequestEndpoint.url;
              url = dets.tokenRequestEndpoint.url + '?response_type=code';
              window.swaggerUi.tokenName = dets.tokenName;
            }
          }
        }
      }
    }

    redirect_uri = redirectUrl;

    url += '&redirect_uri=' + encodeURIComponent(redirectUrl);
    url += '&realm=' + encodeURIComponent(realm);
    url += '&client_id=' + encodeURIComponent($('#input_client_id').val());
    url += '&scope=' + encodeURIComponent(scopes.join(scopeSeparator));
    url += '&state=' + encodeURIComponent(state);
    for (var key in additionalQueryStringParams) {
        url += '&' + key + '=' + encodeURIComponent(additionalQueryStringParams[key]);
    }

    window.open(url);
  });

  popupMask.show();
  popupDialog.show();
  return;
}


function handleLogout() {
  var host = window.location;
  var defaultRedirectUrl = host.protocol + '//' + host.host + location.pathname;

  var logoutUrl = window.swaggerUi.api.authSchemes[window.swaggerUi.api.currentAccessToken.OAuthScheme].logoutUrl;
  logoutUrl += '?post_logout_redirect_uri=' + encodeURIComponent(defaultRedirectUrl);
  logoutUrl += '&id_token_hint=' + window.swaggerUi.api.currentAccessToken.token;

  // TODO dirty trick: the oidc logout url returns a 204 so nothing happens
  // We can't do it in ajax because the required coockie would not be send
  window.location = logoutUrl

  $('.api-ic.ic-on').addClass('ic-off').removeClass('ic-on')
}

function initOAuth(opts) {
  var o = (opts||{});
  var errors = [];

  appName = (o.appName||errors.push('missing appName'));
  popupMask = (o.popupMask||$('#api-common-mask'));
  popupDialog = (o.popupDialog||$('.api-popup-dialog'));
//  clientId = (o.clientId||errors.push('missing client id'));
  clientSecret = (o.clientSecret||null);
  realm = (o.realm||errors.push('missing realm'));
  scopeSeparator = (o.scopeSeparator||' ');
  additionalQueryStringParams = (o.additionalQueryStringParams||{});

  if(errors.length > 0){
    log('auth unable initialize oauth: ' + errors);
    return;
  }

  $('pre code').each(function(i, e) {hljs.highlightBlock(e)});
  $('.api-ic').unbind();
  $('.api-ic').click(function(s) {
    if($(s.target).hasClass('ic-off'))
      handleLogin();
    else {
      handleLogout();
    }
    false;
  });
}

function clientCredentialsFlow(scopes, tokenUrl, OAuthSchemeKey) {
    var params = {
      'client_id': clientId,
      'client_secret': clientSecret,
      'scope': scopes.join(' '),
      'grant_type': 'client_credentials'
    }
    $.ajax(
    {
      url : tokenUrl,
      type: "POST",
      data: params,
      success:function(data, textStatus, jqXHR)
      {
        onOAuthComplete(data,OAuthSchemeKey);
      },
      error: function(jqXHR, textStatus, errorThrown)
      {
        onOAuthComplete("");
      }
    });

  }

window.processOAuthCode = function processOAuthCode(data) {
  var OAuthSchemeKey = data.state;
  var params = {
    'client_id': clientId,
    'code': data.code,
    'grant_type': 'authorization_code',
    'redirect_uri': redirect_uri
  };

  if (clientSecret) {
    params.client_secret = clientSecret;
  }

  $.ajax(
  {
    url : window.swaggerUi.tokenUrl,
    type: "POST",
    data: params,
    success:function(data, textStatus, jqXHR)
    {
      onOAuthComplete(data, OAuthSchemeKey);
    },
    error: function(jqXHR, textStatus, errorThrown)
    {
      onOAuthComplete("");
    }
  });
};

window.onOAuthComplete = function onOAuthComplete(token,OAuthSchemeKey) {
  if(token) {
    if(token.error) {
      var checkbox = $('input[type=checkbox],.secured')
      checkbox.each(function(pos){
        checkbox[pos].checked = false;
      });
      alert(token.error);
    }
    else {
      var b = token[window.swaggerUi.tokenName];
      if (!OAuthSchemeKey){
          OAuthSchemeKey = token.state;
      }
      if(b){
        // if all roles are satisfied
        var o = null;
        $.each($('.auth .api-ic .api_information_panel'), function(k, v) {
          var children = v;
          if(children && children.childNodes) {
            var requiredScopes = [];
            $.each((children.childNodes), function (k1, v1){
              var inner = v1.innerHTML;
              if(inner)
                requiredScopes.push(inner);
            });
            var diff = [];
            for(var i=0; i < requiredScopes.length; i++) {
              var s = requiredScopes[i];
              if(window.enabledScopes && window.enabledScopes.indexOf(s) == -1) {
                diff.push(s);
              }
            }
            if(diff.length > 0){
              o = v.parentNode.parentNode;
              $(o.parentNode).find('.api-ic.ic-on').addClass('ic-off');
              $(o.parentNode).find('.api-ic.ic-on').removeClass('ic-on');

              // sorry, not all scopes are satisfied
              $(o).find('.api-ic').addClass('ic-warning');
              $(o).find('.api-ic').removeClass('ic-error');
            }
            else {
              o = v.parentNode.parentNode;
              $(o.parentNode).find('.api-ic.ic-off').addClass('ic-on');
              $(o.parentNode).find('.api-ic.ic-off').removeClass('ic-off');

              // all scopes are satisfied
              $(o).find('.api-ic').addClass('ic-info');
              $(o).find('.api-ic').removeClass('ic-warning');
              $(o).find('.api-ic').removeClass('ic-error');
            }
          }
        });

        //window.swaggerUi.api.clientAuthorizations.add(OAuthSchemeKey, new SwaggerClient.ApiKeyAuthorization('Authorization', 'Bearer ' + b, 'header'));
        window.swaggerUi.api.currentAccessToken = {
          OAuthScheme: OAuthSchemeKey,
          token: b
        };

        // add the token in the form
        $('input[name="authorization"]').val('Bearer ' + b);
      }
    }
  }
};
