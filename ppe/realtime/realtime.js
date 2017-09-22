(function () {

/* 
// config controller 
*/
angular.module('myApp')
.controller('realtimeCtrl', function($scope, $state, $mdDialog, $timeout, $interval, appService) {
// $timeout(function() {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Home';

  $scope.gridCounter = {
    data: []
  };
  $scope.gridCnt = {};

  $scope.gridEmployee = {
    data: []
  };
  $scope.gridEmp = {};

  $scope.gridQtoday = {
    data: []
  };
  $scope.gridQtd = {};

  var branchList = [];
  var brSelect = '';
  $scope.brSelect = brSelect;

  var homeRefresh = function ()  {
    socket.emit('web-realtime-get-data', {}, function(err, ret)  { 
      if (!ret.online.length)  {
        brSelect = '';
        $scope.item.branchID = brSelect;
        $scope.branchList = [];
        rtComboData.labels = [];
        rtComboData.datasets[0].data = [];
        rtComboData.datasets[1].data = [];
        rtComboData.datasets[2].data = [];
        rtComboData.datasets[3].data = [];
        rtComboData.datasets[4].data = [];
        window.myRealtimeComboChart.update();
        $scope.gridCounter.data = [];
        $scope.gridEmployee.data = [];
        $scope.gridQtoday.data = [];          
        return;
      }

      branchList = [];
      for (var i in ret.online)  {
        var branchInfo = ret.online[i].branchInfo;
        branchList.push({ branchID: branchInfo.branchID, branchName: branchInfo.branchName });
      }
      $scope.branchList = branchList;

      if (brSelect == '')  {
        brSelect = branchList[0].branchID;
        $scope.brSelect = brSelect;
      }

      for (var i in ret.online)  {
        var branchInfo = ret.online[i].branchInfo;
        var realtime = ret.online[i].realtime;

        if (brSelect != branchInfo.branchID)  continue;

        var overall = realtime.overall;
        var name = [];
        var waiting = [];
        var complete = [];
        var cancel = [];
        var service = [];
        var total = [];
        for (var j in overall)  {
          var ovr = overall[j];
          name.push(ovr.name);
          waiting.push(ovr.waiting);
          complete.push(ovr.complete);
          cancel.push(ovr.cancel);
          service.push(ovr.service);
          total.push(ovr.total);
        }
        rtComboData.labels = name;
        rtComboData.datasets[0].data = total;
        rtComboData.datasets[1].data = waiting;
        rtComboData.datasets[2].data = service;
        rtComboData.datasets[3].data = complete;
        rtComboData.datasets[4].data = cancel;
        window.myRealtimeComboChart.update();
        
        var counter = realtime.counter;
        $scope.gridCounter.data = counter;

        var employee = realtime.employee;
        $scope.gridEmployee.data = employee;

        var qtdBuff = realtime.qtdBuff;
        for (var j in qtdBuff)  {
          var pt = new Date(qtdBuff[j].pressTime);
          var hh = pt.getHours();
          var mm = pt.getMinutes();
          var ss = pt.getSeconds();
          qtdBuff[j].pressTime = hh+':'+mm+':'+ss;
          var waitingTime = qtdBuff[j].waitingTime/1000;
          var ss = Math.floor(waitingTime % 60);
          waitingTime = waitingTime/60;
          var mm = Math.floor(waitingTime % 60);
          waitingTime = waitingTime/60;
          var hh = Math.floor(waitingTime % 24);
          qtdBuff[j].waitingTime = hh+':'+mm+':'+ss;

        }
        $scope.gridQtoday.data = qtdBuff;  
        break;
      } 

    });
  }

  $scope.gotoBranchOnline = function (name)  {
    // alert(name);
    brSelect = name;
  }

  homeRefresh(); 
  var intervalHome = $interval(function(){
    homeRefresh(); 
  },1000*3);
  $scope.$on('$destroy', function () { $interval.cancel(intervalHome); });


  var color = Chart.helpers.color;

  var rtComboData = {
    labels: [],
    datasets: [
      {
        type: 'line',
        label: 'Total',
        borderColor: window.chartColors.purple,
        borderWidth: 1,
        fill: false,
        backgroundColor: color(window.chartColors.purple).alpha(0.5).rgbString(),
        pointBackgroundColor: window.chartColors.purple,
        data: [],
      }, 
      {
        type: 'bar',
        label: 'Waiting',
        borderColor: window.chartColors.blue,
        fill: true,
        backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      },
      {
        type: 'bar',
        label: 'Service',
        borderColor: window.chartColors.orange,
        fill: true,
        backgroundColor: color(window.chartColors.orange).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
      {
        type: 'bar',
        label: 'Complete',
        borderColor: window.chartColors.red,
        fill: true,
        backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
      {
        type: 'bar',
        label: 'Cancel',
        borderColor: window.chartColors.green,
        fill: true,
        backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      },
    ]

  };

  var rtComboID = document.getElementById("canvasRealtimeCombo").getContext("2d");
  window.myRealtimeComboChart = new Chart(rtComboID, {
    type: 'bar',
    data: rtComboData,
    options: {
      responsive: true,
      legend: {
        position: 'top',
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Service'
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Queue'
          }
        }]
      },
      title: {
        display: true,
        text: 'Overall',
      }
    }
  });

});

})();