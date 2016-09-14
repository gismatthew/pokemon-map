if(!global.$) {
  global.$ = global.jQuery = require('jquery');
}

global.data_broker = (function(){
  var _routes;
  var _flags = { total: 1, checked: 0};

  function _checkoutFlag(){
    if(_flags.checked >= _flags.total){
      init_ui();
    }
  }

  $.ajax({
    method: 'GET',
    dataType: 'json',
    url: 'data/routes.js'
  }).done(function(data){
    _routes = data;
    _flags.checked ++;
    _checkoutFlag();
  }).fail(function(err){
    console.log('err:', err);
  });

  return {
    getRoutes: function(){
      return _routes;
    }
  };
})();
