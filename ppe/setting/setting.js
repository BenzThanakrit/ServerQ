(function () {

var appFact = angular.module('tree.factory', []);
appFact.factory("URLConfig", [function () {
  return {
    tree: "/setting/menu.json"
  }
}]);

var appServ = angular.module('tree.service', ['tree.factory']);
appServ.service("TreeService", ["$http", "URLConfig", function ($http, URLConfig) {
  this.getTree = function () {
    return $http.get(URLConfig.tree);
  };
}]);

var appDirect = angular.module('tree.directives', []);
appDirect.directive('nodeTree', function () {
  return {
    template: '<node ng-repeat="node in tree track by $index"></node>',
    replace: true,
    restrict: 'E',
    scope: {
      tree: '=children'
    }
  };
});
appDirect.directive('node', function ($compile) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/setting/node.html', // HTML for a single node.
    link: function (scope, element) {
    if (scope.node && scope.node.children && scope.node.children.length > 0) {
      scope.node.childrenVisibility = true;
      var childNode = $compile('<ul class="tree" ng-if="!node.childrenVisibility"><node-tree children="node.children"></node-tree></ul>')(scope);
        element.append(childNode);
      } 
      else {
        scope.node.childrenVisibility = false;
      }
    },
    controller: ["$scope", function ($scope) {
      // This function is for just toggle the visibility of children
      $scope.toggleVisibility = function (node) {
        if (node.children) {
          node.childrenVisibility = !node.childrenVisibility;
        }
      };
      // Here We are marking check/un-check all the nodes.
      $scope.checkNode = function (node) {
        node.checked = !node.checked;
        function checkChildren(c) {
          angular.forEach(c.children, function (c) {
            c.checked = node.checked;
            checkChildren(c);
          });
        }
        checkChildren(node);
      };
    }]
  };
});

/* 
// config controller 
*/
angular.module('myApp')
.controller('roleCtrl', function($scope, TreeService, $timeout, $mdDialog, appService) {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Setting';


  var roleList = [];
  var employeeList = [];
  var success = false;

  var tc = this;
  buildTree();
  function buildTree() {
    TreeService.getTree().then(function (result) {
      
      // console.log(result.data);
      // tc.tree = result.data;         


      socket.emit('web-setting-get-data', { base: 'serverRole', query: {}}, function(err, ret)  {
        roleList = ret[0].role;     
        $scope.roleList = roleList;

        console.log(roleList);

        // ret[0].roleLevel[0].checked = true;
        // tc.tree = ret[0].roleLevel;
        socket.emit('web-setting-get-data', { base: 'employee', query: {_id: '0000'} }, function(err, ret)  {
          // $timeout(function() {
            console.log(ret);

            if (!ret.length)  {
              return;
            }


            employeeList = ret[0].employee;


            employeeList.sort(function(a, b){
              return a.userName-b.userName;
            });
            for (var i in employeeList)  {
              employeeList[i]['passTemp'] = '';
              employeeList[i]['passConfirm'] = '';
            }
            $scope.employeeList = employeeList;
          // }, 100);
        });

      });

    }, function (result) {
      alert("Tree no available, Error: " + result);
    });
  }

  $scope.saveEmployee = function(ev)  {

    var confirm = $mdDialog.confirm()
      .title('Save employee')
      .textContent('Would you like to save change ?')
      .targetEvent(ev)
      .ok('Confirm!')
      .cancel('Cancel');
    $mdDialog.show(confirm).then(function() {
      // console.log(counterList);    
      success = false;
      var count = 0;
      var temp = 0;
      for (var i in employeeList)  {
        if (employeeList[i].passTemp != '' && employeeList[i].passConfirm != '')  {      
          if (employeeList[i].passTemp == employeeList[i].passConfirm)  {
            count++;
            (function() {
              var j = i;
              socket.emit('web-setting-encryp-data', { userName: employeeList[j].userName, passWord: employeeList[j].passTemp }, 
              function(err, ret)  {
                employeeList[j].passWord[0].passWord = ret.passWord;
              // $timeout(function() {
                if (++temp >= count)  success = 1;
              // }, 1000*5);
              });
            })();
          }
          else  {
            $mdDialog.show(
              $mdDialog.alert()
              .title('Alert')
              .textContent('Password and confirm not equal, please try again.')
              .targetEvent(ev)
              .clickOutsideToClose(false)
              .ok('OK!')
            );
            return;
          }          
        }        
      }
      if (count == 0)  success = true;
      // alert(count+'/'+success);    
      retrySaveEmployee(200, ev);

    }, function() {
    });

  }

  var retrySaveEmployee = function (retryInMilliseconds, ev) {
    $timeout(function(){
      // alert('Sucess = '+success);
      if (!success) {
        retrySaveEmployee(200);
      }
      else  {
        for (var i in employeeList)  {
          employeeList[i].passTemp = '';
          employeeList[i].passConfirm = '';
        }
        var obj = { employee: employeeList };
        socket.emit('web-setting-write-data', { base: 'employee', data: obj, flag: 0 }, function(err, ret)  {

          $mdDialog.show(
            $mdDialog.alert()
            .title('Alert')
            .textContent(ret.text)
            .targetEvent(ev)
            .clickOutsideToClose(false)
            .ok('OK!')
          );
          
        });
      }
    }, retryInMilliseconds);
  }

  $scope.addEmployee = function()  {
    var obj =  {
      userName: "",
      fullName: "",
      roleLevel: "BR User",
      lastLogon: [
        new Date(),
        new Date(),
      ],
      wrongLogon: 0,
      userState: "Enable",
      firstLogon: false,
      createDate: new Date(),
      startDate: new Date(),
      expireDate: "",
      activeDate: new Date(),
      passPolicy: false,
      passWord: [
        {
            passWord: "458175b8cea5d1ce393c18994c1de70b",  // '1234'
            dateCreate: new Date(),
            dateExpiry:  new Date(),
        },
      ],
      login: {name: '', id: ''},
      passTemp: '',
      passConfirm: '',
    };
    employeeList.push(obj);
  }

  $scope.removeEmployee = function(index)  {
    employeeList.splice(index, 1);
  }

  $scope.gotoSaveRole = function(ev, role)  {
    // console.log(role);
    // alert(role);    
    var obj = { role: role };
    socket.emit('web-setting-write-data', { base: 'serverRole', data: obj, flag: 0 }, function(err, ret)  {
      $mdDialog.show(
        $mdDialog.alert()
        .title('Alert')
        .textContent(ret.text)
        .targetEvent(ev)
        .clickOutsideToClose(false)
        .ok('OK!')
      );
    });
  }

});

/* 
// config controller 
*/
angular.module('myApp')
.controller('settingCtrl', function($scope, $state, $mdDialog, $timeout, $interval, $window, $sce, $http, appService) {
// $timeout(function() {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Setting';

  $scope.griSettBranch = {
    data: []
  };
  $scope.gridSettBrs = {};

  var branchList = [];

  var setBranchRefresh = function ()  {
    socket.emit('web-setting-get-online', function(err, ret)  {
      // Table Online branch
      branchList = [];
      if (!ret.online.length)  return;
      for (var i in ret.online)  {
        var item = ret.online[i];
        var obj = { branchID: item.branchInfo.branchID, branchName: item.branchInfo.branchName, clientIP: item.branchInfo.clientIP};        
        branchList.push(obj);
      }
      $scope.griSettBranch.data = branchList;
    });
  }

  setBranchRefresh(); 
  var intervalSetting = $interval(function()  {
    setBranchRefresh(); 
  },1000*3);
  $scope.$on('$destroy', function () { $interval.cancel(intervalSetting); });

  $scope.gotoBranchConfig = function(ip)  {
    // $window.open('http://'+ip+':8001/setting/websetting.html', 'C-Sharpcorner');
    // alert('http://'+ip+':8001/setting/websetting.html');
    $scope.detailFrame = $sce.trustAsResourceUrl('http://'+ip+':8001/setting/websetting.html?logon=auto');
  }

  window.uploadDone=function(){
    // alert('onLoad');
    // var req = {
    //   method: 'POST',
    //   url: 'http://192.168.1.103:8001',
    //   headers: {
    //     'Content-Type': undefined,
    //   },
    //   data: { test: 'test' }
    // }
    // $http(req).then(function(ret){
    //   alert(ret+'1');
    // }, function(ret){
    //   alert(ret+'2');
    // });
  }

});

})();


