(function () {

// angular.module('myApp', ['ui.router', 'ngMaterial', 'ngMessages']);
angular.module('myApp', [ 'ngMaterial', 'ui.router',  // Main core
                          'ui.bootstrap', 'dataGrid', 'pagination',  // dataTable
                          'ngMessages',  'ngAnimate','ngAria', // login form
                          'tree.service', 'tree.directives',  // tree structure
                          // 'chart.js', // chart
                        ]);

/* 
// Theme control 
*/
angular.module('myApp')
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
  .primaryPalette('grey', {
  //   // 'default': '700', // by default use shade 400 from the pink palette for primary intentions
  })
  // .accentPalette('red', {
  //   'default': '100', // by default use shade 400 from the pink palette for primary intentions
  // })
  // .warnPalette('grey', {
    // 'default': '100', // by default use shade 400 from the pink palette for primary intentions
  // })
  // .backgroundPalette('grey', {
  //   'default': '900', // by default use shade 400 from the pink palette for primary intentions
  //   'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
  //   'hue-2': '500', // use shade 600 for the <code>md-hue-2</code> class
  //   'hue-3': '900' // use shade A100 for the <code>md-hue-3</code> class
  // })
  // .dark();

  $mdThemingProvider.theme('docs-dark')
  .dark();

});

/* 
// UI-router
*/
angular.module('myApp')
.config(function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
  // for handling trailing slashes
  $urlMatcherFactoryProvider.strictMode(false);
  // $urlRouterProvider.otherwise("/projects.login");  
  $stateProvider
  .state({
    name: "projects",
    // url: "/projects",
    url: "Qserver",
    template: '<ui-view></ui-view>'
    // template: '<h4 style="margin-left: 20px;">Smart-Q setting</h4><ui-view></ui-view>'
    // template: '<md-toolbar class="md-hue-3"><div class="md-toolbar-tools" style=""><h2>Smart-Q setting</h2></div></md-toolbar><ui-view></ui-view>'    
  })
  // .state('login', {
  //   url: "/login",
  //   templateUrl: "login.html",
  //   controller:"loginCtrl"
  // })
  .state({
    name: "projects.login",
    templateUrl: "login.html",
    controller:"loginCtrl"
  })
  .state({
    name: "projects.home",
    templateUrl: "/home/home.html",
    controller:"homeCtrl as hmCtrl"
  })
  .state({
    name: "projects.branch",
    templateUrl: "/home/branch.html",
    controller:"branchCtrl as brCtrl"
  })
  .state({
    name: "projects.realtime",
    templateUrl: "/realtime/realtime.html",
    controller:"realtimeCtrl"
  })
  .state({
    name: "projects.report",
    templateUrl: "/report/report.html",
    controller:"reportCtrl"
  })  
  .state({
    name: "projects.setuser",
    templateUrl: "/setting/setuser.html",
    controller:"roleCtrl as tc"
  })  
  .state({
    name: "projects.setbranch",
    templateUrl: "/setting/setbranch.html",
    controller:"settingCtrl"
  })
});

/* 
// Main controller
*/
angular.module('myApp')
.controller("serverController", function ($scope, $location, $state, $timeout, $mdSidenav, appService) {
  // var w = window.innerWidth;
  // var h = window.innerHeight;

  // $scope.ctrl.selectedItem = 'login';
  // $location.url("/login");
  // $scope.screenHeight = (window.innerHeight*2/3)+'px;';

  $timeout(function() {
    $scope.ctrl.selectedItem = 'login';
    $state.go("projects.login");
    $scope.screenHeight = (window.innerHeight*2/3)+'px;';
  }, 100);


  var socket = io.connect();
  // retryConnectOnFailure(RETRY_INTERVAL);

  socket.on('connect', function() {
    appService.socketInit(socket);
    // alert('Sock.io-Connect')
  });

  socket.on('disconnect', function () {
    // $timeout(function() {
    // socket = io.connect({ 'force new connection': true, secure: true, rejectUnauthorized: null});
    $timeout(function() {
      $scope.ctrl.selectedItem = 'login';
      $state.go("projects.login");
      // $scope.ctrl.selectedItem = 'login';
      // $location.url("/login");
    }, 100);
    // }, 1000);
  });

  $scope.ctrl.gotoMenu = function(menu)  {
  $timeout(function()  {
    if (appService.getLogin() == 1)  {
      // $scope.ctrl.selectedItem = menu;
      // $state.go("projects."+menu);

      if ($scope.ctrl.menuHome && menu == 'home')  menu = '';
      if ($scope.ctrl.menuRealtime && menu == 'realtime')  menu = '';
        // return;
      if ($scope.ctrl.menuReport && menu == 'report') menu = '';

      $scope.ctrl.selectedItem = menu;
      $state.go("projects."+menu);
    }
    else  {
      $scope.ctrl.selectedItem = 'login';
      $state.go("projects.login");
      // $scope.ctrl.selectedItem = 'login';
      // $location.url("/login");
    }
  }, 100);
  }

  this.settButton = true;
  this.addRemoveUser = false;       
  this.branchConfig = false;

  this.toggleRight = buildToggler('right');
  this.toggleLeft = buildToggler('left');

  function buildToggler(componentId) {
    return function() {
      $mdSidenav(componentId).toggle();
    }
  }

// var retryConnectOnFailure = function(retryInMilliseconds) {
//   $timeout(function(){
//     if (!connected) {
//       $.get('/ping', function(data) {
//         connected = true;
//         window.location.href = unescape(window.location.pathname);
//       });
//       retryConnectOnFailure(retryInMilliseconds);
//     }
//   }, retryInMilliseconds);
// }

})

/* 
// Service control 
*/
angular.module('myApp')
.service('appService', function() {
  var socket = null;
  var login = 0;
  var sunMenu = '';
  var socketInit = function(newSock) {
      socket = newSock;
  };
  var getSocket = function(){
    return socket;
  };
  var loginInit = function (value) {
    login = value;
  };
  var getLogin = function(){
    return login;
  };
  return {
    socketInit: socketInit,
    getSocket: getSocket,
    loginInit: loginInit,
    getLogin: getLogin,
    sunMenu: sunMenu,
  };
});

/* 
// Login controller 
*/
angular.module('myApp')
.controller('loginCtrl',function($scope, $state, $mdDialog, $timeout, appService) {
// $timeout(function() {

  appService.loginInit(0);
  $scope.ctrl.loginText = 'login';
  $scope.ctrl.settButton = true;
  $scope.ctrl.menuText = 'Login';

  $scope.submit = function (ev) {
    var socket = appService.getSocket();
    var usrLogon = $scope.vm.formData.name;
    var pwdLogon = $scope.vm.formData.password;
    // socket.emit('websetting-get-data', { table: 'general' }, function(err, data)  {
    socket.emit('web-login-get-user', { userName: usrLogon,  passWord: pwdLogon}, function(err, ret)  {
      var success = ret.success;
      var roleName = ret.roleLevel;
      // console.log(roleLevel);
      if (success == true)  {
        socket.emit('web-setting-get-data', { base: 'serverRole', query: {}}, function(err, ret)  {        
          var roleList = ret[0].role;
          for (var i in roleList)  {
            if (roleList[i].roleName == roleName)  {             
              var list = roleList[i].roleLevel;
              // console.log(list);
              $scope.ctrl.menuHome =  !list[0].checked;
              $scope.ctrl.menuRealtime = !list[1].checked;
              $scope.ctrl.menuReport = !list[2].checked;
              $scope.ctrl.settButton = !list[3].checked;
              $scope.ctrl.addRemoveUser = !list[3].children[0].checked;
              $scope.ctrl.branchConfig = !list[3].children[1].checked;
              break;
            }
          }
          appService.loginInit(1);
          $scope.ctrl.loginText = 'logout';
          $scope.ctrl.selectedItem = 'home';
          // $scope.ctrl.settButton = false;
          $state.go("projects.home");
        });      
      }
      else  {
        $mdDialog.show(
          $mdDialog.alert()
          .title('Alert')
          .textContent('Password was wrong')
          .clickOutsideToClose(false)
          .ok('OK!')
        );
      }
    });
  };

// }, 1000);
});


})();
