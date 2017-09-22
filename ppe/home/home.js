(function () {

/* 
// config controller 
*/
angular.module('myApp')
.controller('homeCtrl', function($scope, $state, $mdDialog, $timeout, $interval, appService) {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Home';

  $scope.gridBranch = {
    data: []
  };
  $scope.gridBrs = {};

  var branchList = [];
  $scope.gridBranch.data = branchList;
  var jobList = [];
  $scope.jobList = jobList;
  var jobSelect = '';
  $scope.jobSelect = jobSelect;

  var cond = {
    startDate: new Date(),
    stopDate: new Date(),
    branchList: []
  }

  cond.startDate = new Date(2017, 8, 1);
  $scope.hmStartDate = cond.startDate;

  cond.startDate.setHours(0, 0, 0);
  cond.stopDate.setHours(23, 59, 0);

  // var homeTimeout = null;
  var homeRefresh = function ()  {
    socket.emit('web-home-get-data', cond, function(err, ret)  {
      var online = ret.online;
      var dashboard = ret.dashboard;

      // Online table
      branchList = [];
      jobList = [];

      var header = [];
      var l1 = [
        { headText: 'ID', colSpan: '', rowSpan: '2', align: 'left'},
        { headText: 'Branch', colSpan: '', rowSpan: '2', align: 'left'},
        { headText: 'Queue in process', colSpan: '2', rowSpan: '', align: 'center'},
        {headText: 'Complete', colSpan: '', rowSpan: '2', align: 'center'},
        {headText: 'Cancel', colSpan: '', rowSpan: '2', align: 'center'},
        {headText: 'Total', colSpan: '', rowSpan: '2', align: 'center'},
      ];
      var l2 = [];
      l2.push({headText: 'Waiting', colSpan: '', rowSpan: '', align: 'center'});
      l2.push({headText: 'Service', colSpan: '', rowSpan: '', align: 'center'});
      header = [ l1, l2 ];
      $scope.tableHeader = header;

      for (var i in online)  {
        var item = online[i];
        var tp = { 
          branchID: item.branchInfo.branchID, idSpan: '10%', idColor: 'grey',
          branchName: item.branchInfo.branchName, nameSpan: '40%', nameColor: 'grey',
          data: [],  //  { text: '', value: [0,1,2,3], dColor: 'red' }
        };
        var colSum = [0,0,0,0,0];
        for (var j in item.realtime.overall)  {
          var dat = [0,0,0,0,0];
          dat[0] = item.realtime.overall[j].waiting;
          colSum[0] += item.realtime.overall[j].waiting;
          dat[1] = item.realtime.overall[j].service;
          colSum[1] += item.realtime.overall[j].service;
          dat[2] = item.realtime.overall[j].complete;
          colSum[2] += item.realtime.overall[j].complete;
          dat[3] = item.realtime.overall[j].cancel;
          colSum[3] += item.realtime.overall[j].cancel;
          dat[4] = item.realtime.overall[j].complete+item.realtime.overall[j].cancel;
          colSum[4] += item.realtime.overall[j].complete+item.realtime.overall[j].cancel;
          tp.data.push({ text: item.realtime.overall[j].name, value: dat, dColor: '', align: ''});
        }
        tp.data.push({ text: 'Sum', value: colSum, dColor: 'grey', align: ''});
        branchList.push(tp);
      }
      $scope.gridBranch.data = branchList;

      // Dashboard sum loop
      var Qtotal = [0,0,0,0,0,0,0,0,0,0,0,0];
      var Qcomplete = [0,0,0,0,0,0,0,0,0,0,0,0];
      var Qcancel = [0,0,0,0,0,0,0,0,0,0,0,0];
      var jobName = [];
      var branchTopFive = [];
      var jobTopFive = [];
      var totalTopFive = [];
      var satValue = [0,0,0,0,0,0];
      var satJobValue = [0,0,0,0,0,0];

      for (var i in dashboard)  {
        var item = dashboard[i].value;

        branchTopFive.push({ branchID: item.branchID+'-'+item.branchName, Qtotal: item.Qtotal, Qcomplete: item.Qcomplete, 
                             Qcancel: item.Qcancel });

        for (var j in Qtotal)  {
          Qcomplete[j] += item.completePeriod[j];
          Qcancel[j] += item.cancelPeriod[j];
          Qtotal[j] = item.completePeriod[j] + item.cancelPeriod[j];
        }

        for (var j in item.jobName)  {
          var k =  jobName.indexOf(item.jobName[j].jobName);
          if (k < 0)  {
            jobName.push(item.jobName[j].jobName);
            jobTopFive.push({jobName: item.jobName[j].jobName, Qtotal: item.jobName[j].Qtotal, 
                             Qcomplete: item.jobName[j].Qcomplete, Qcancel: item.jobName[j].Qcancel});
            jobList.push({name: item.jobName[j].jobName});
          }
          else  {
            jobTopFive[k].Qtotal += item.jobName[j].Qtotal;
            jobTopFive[k].Qcomplete += item.jobName[j].Qcomplete;
            jobTopFive[k].Qcancel += item.jobName[j].Qcancel;
          }
        }

        for (var j in satValue)  {
          satValue[j] += item.satValue[j];
        }
      }

      $scope.jobList = jobList;
      if (jobList.length && jobSelect == '')  {
        jobSelect = jobList[0].name;
        $scope.jobSelect = jobList[0].name;
      }

      for (var i in dashboard)  {
        var item = dashboard[i].value;
        for (var j in item.jobName)  {
          if (item.jobName[j].jobName == jobSelect)  {
            totalTopFive.push({ branchID: item.branchID+'-'+item.branchName, Qtotal: item.jobName[j].Qtotal });
            for (var k in satJobValue)  satJobValue[k] += item.jobName[j].satValue[k];
            break;
          }
        }
      }
      // console.log(totalTopFive);

      // Combo chart
      comboData.datasets[0].data = Qtotal;
      comboData.datasets[1].data = Qcomplete;
      comboData.datasets[2].data = Qcancel;
      window.myComboChart.update();

      // Branch top five chart
      if (branchTopFive.length < 5)  {
        for (var i = branchTopFive.length; i < 5; i++)  {
          branchTopFive.push({branchID: '', Qtotal: 0, Qcomplete: 0, Qcancel: 0});
        }
      }
      else {
        branchTopFive = branchTopFive.slice(0, 5);
      }
      branchTopFive.sort(function(a, b){
        return b.Qtotal-a.Qtotal;
      });
      topBranchData.labels = [];
      topBranchData.datasets[0].data = [];
      topBranchData.datasets[1].data = [];
      // topBranchData.datasets[2].data = [];
      for (var i in branchTopFive)  {
        topBranchData.labels.push(branchTopFive[i].branchID);
        // topBranchData.datasets[0].data.push(branchTopFive[i].Qtotal);
        topBranchData.datasets[0].data.push(branchTopFive[i].Qcomplete);
        topBranchData.datasets[1].data.push(branchTopFive[i].Qcancel);
      }      
      window.myBranchHorChart.update();

/*      // Job-name top five chart
      if (jobTopFive.length < 5)  {
        for (var i = jobTopFive.length; i < 5; i++)  {
          jobTopFive.push({jobName: '', Qtotal: 0, Qcomplete: 0, Qcancel: 0});
        }
      }
      else {
        jobTopFive = jobTopFive.slice(0, 5);
      }*/
      jobTopFive.sort(function(a, b){
        return b.Qtotal-a.Qtotal;
      });
      topJobData.labels = [];
      topJobData.datasets[0].data = [];
      topJobData.datasets[1].data = [];
      for (var i in jobTopFive)  {
        // topJobData.labels.push(jobTopFive[i].jobName.slice(0, 15));
        topJobData.labels.push(jobTopFive[i].jobName);
        topJobData.datasets[0].data.push(jobTopFive[i].Qcomplete);
        topJobData.datasets[1].data.push(jobTopFive[i].Qcancel);
      }      
      window.myJobHorChart.update();

      // Satisfy chart
      satisfyData.datasets[0].data = satValue;
      window.mySatChart.update();

      if (totalTopFive.length < 5)  {
        for (var i = totalTopFive.length; i < 5; i++)  {
          totalTopFive.push({branchID: '', Qtotal: 0 });
        }
      }
      else {
        totalTopFive = totalTopFive.slice(0, 5);
      }
      totalTopFive.sort(function(a, b){
        return b.Qtotal-a.Qtotal;
      });
      totalBranchData.labels = [];
      totalBranchData.datasets[0].data = [];
      for (var i in totalTopFive)  {
        totalBranchData.labels.push(totalTopFive[i].branchID);
        totalBranchData.datasets[0].data.push(totalTopFive[i].Qtotal);
      }      
      window.myTotalBranchHorChart.update();

      satisfyJobData.datasets[0].data = satJobValue;
      window.myJobSatChart.update();

    });
  }

  // $scope.$on('$destroy', function () { $timeout.cancel(homeTimeout); });

  homeRefresh(); 
  var intervalHome = $interval(function(){
    homeRefresh(); 
  },1000*3);
  $scope.$on('$destroy', function () { $interval.cancel(intervalHome); });

  $scope.dateChange = function (sd)  {
    cond.startDate = $scope.hmStartDate; //new Date(2017, 0, 1);
    cond.startDate.setHours(0, 0, 0);
    cond.stopDate.setHours(23, 59, 0);
    homeRefresh(); 
  }

  $scope.branchDetail = function(item)  {
    // alert(item);
    appService.subMenu = item;
    $scope.ctrl.gotoMenu('branch');
  }

  $scope.gotoJobSelect = function (name)  {
    jobSelect = name;
    homeRefresh(); 
  }

  var color = Chart.helpers.color;

  var topJobData =  {
    labels: [],
    datasets: [
      {
        label: 'Complete',
        borderColor: window.chartColors.red,
        backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
      {
        label: 'Cancel',
        borderColor: window.chartColors.green,
        backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
    ],
  };

  var horJobID = document.getElementById("canvasHorBarJob").getContext("2d");
  window.myJobHorChart = new Chart(horJobID, {
    type: 'horizontalBar',
    data: topJobData,
    options: {
      title:{
        display:true,
        text: 'Service type'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }

  });

  var topBranchData =  {
    labels: [],
    datasets: [
      {
        label: 'Complete',
        borderColor: window.chartColors.red,
        backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
      {
        label: 'Cancel',
        borderColor: window.chartColors.green,
        backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
    ],
  };

  var horBranchID = document.getElementById("canvasHorBar").getContext("2d");
  window.myBranchHorChart = new Chart(horBranchID, {
    type: 'horizontalBar',
    data: topBranchData,
    options: {
      title:{
        display:true,
        text: 'Top total queue'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }

  });

  var comboData = {
    labels: ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
    datasets: [
      {
        type: 'line',
        label: 'Total',
        borderWidth: 1,
        fill: false,
        borderColor: window.chartColors.blue,
        pointBackgroundColor: window.chartColors.blue,
        backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }, 
      {
        type: 'bar',
        label: 'Complete',
        fill: true,
        borderColor: window.chartColors.red,
        backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }, 
      {
        type: 'bar',
        label: 'Cancel',
        fill: true,
        borderColor: window.chartColors.green,
        backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }
    ]

  };

  var comboID = document.getElementById("canvasCombo").getContext("2d");
  window.myComboChart = new Chart(comboID, {
    type: 'bar',
    data: comboData,
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
              labelString: 'Time'
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
          text: 'Compare between complete cancel queue by time',
        }
      }
  });

  var satisfyData = {
    labels: ["None", "level-1", "level-2", "level-3", "level-4", "level-5"],
    datasets: [
      {
        type: 'bar',
        label: 'Satisfy',
        fill: true,
        borderColor: window.chartColors.blue,
        backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0],
      }, 
    ]
  };

  var verBarID = document.getElementById("canvasVerBar").getContext("2d");
  window.mySatChart = new Chart(verBarID, {
    type: 'bar',
    data: satisfyData,
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
              labelString: 'score'
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'total'
            }
          }]
        },
        title: {
          display: true,
          text: 'Total satisfaction assessment',
        }
      }
  });

  var totalBranchData =  {
    labels: [],
    datasets: [
      {
        label: 'Qtotal',
        borderColor: window.chartColors.green,
        backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }
    ],
  };

  var horJobBranchID = document.getElementById("canvasHorBarJobDetail").getContext("2d");
  window.myTotalBranchHorChart = new Chart(horJobBranchID, {
    type: 'horizontalBar',
    data: totalBranchData,
    options: {
      title:{
        display:true,
        text: 'Top service queue'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }

  });

  var satisfyJobData = {
    labels: ["None", "level-1", "level-2", "level-3", "level-4", "level-5"],
    datasets: [
      {
        type: 'bar',
        label: 'Satisfy',
        fill: true,
        borderColor: window.chartColors.blue,
        backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0],
      }, 
    ]
  };

  var verJobBarID = document.getElementById("canvasVerBarSatDetail").getContext("2d");
  window.myJobSatChart = new Chart(verJobBarID, {
    type: 'bar',
    data: satisfyJobData,
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
              labelString: 'score'
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'total'
            }
          }]
        },
        title: {
          display: true,
          text: 'Service satisfaction assessment',
        }
      }
  });

});


/* 
// config controller 
*/
angular.module('myApp')
.controller('branchCtrl', function($scope, $state, $mdDialog, $timeout, $interval, appService) {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Home';

  $scope.gridOneBranch = {
    data: []
  };
  $scope.gridOneBrs = {};

  var oneBranch = [];

  var cond = {
    startDate: new Date(),
    stopDate: new Date(),
    branchList: []
  }

  cond.startDate = new Date(2017, 8, 1);
  $scope.brStartDate = cond.startDate;

  cond.startDate.setHours(0, 0, 0);
  cond.stopDate.setHours(23, 59, 0);

  var branchSelected = appService.subMenu;

  // var homeTimeout = null;
  var branchRefresh = function ()  {
    socket.emit('web-home-get-data', cond, function(err, ret)  {
      // console.log(ret);
      var online = ret.online;
      var dashboard = ret.dashboard;
      oneBranch = [];

      // Dashboard sum loop
      var item = null;
      for (var i in dashboard)  {
        item = dashboard[i].value;
        if (branchSelected == item.branchID)  break;;
      }
      if (item == null)  {
        // $scope.brID = item.branchID+' / '+item.branchName;
        $scope.brComplete = '';
        $scope.brCancel = '';
        $scope.brNoservice = '';
        $scope.brTotal = '';
        $scope.gridOneBranch.data = oneBranch;

        topJobData.datasets[0].data = [];
        topJobData.datasets[1].data = [];
        window.myJobHorChartBr.update();

        topBranchData.datasets[0].data = [];
        topBranchData.datasets[1].data = [];
        window.myVerCounterStcak.update();

        lineData.datasets[0].data = [];
        lineData.datasets[1].data = [];
        window.myLineChart.update();

        satisfyData.datasets[0].data = [];
        window.mySatChart.update();


        return;
      }

      var jobTopToDown = [];
      for (var i in item.jobName)  {
        jobTopToDown.push({jobName: item.jobName[i].jobName, Qtotal: item.jobName[i].Qtotal, 
                         Qcomplete: item.jobName[i].Qcomplete, Qcancel: item.jobName[i].Qcancel});
      }
      jobTopToDown.sort(function(a, b){
        return b.Qtotal-a.Qtotal;
      });
      topJobData.labels = [];
      topJobData.datasets[0].data = [];
      topJobData.datasets[1].data = [];
      for (var i in jobTopToDown)  {
        // topJobData.labels.push(jobTopToDown[i].jobName.slice(0, 15));
        topJobData.labels.push(jobTopToDown[i].jobName);
        topJobData.datasets[0].data.push(jobTopToDown[i].Qcomplete);
        topJobData.datasets[1].data.push(jobTopToDown[i].Qcancel);
      }      
      window.myJobHorChartBr.update();

      var counter = [];
      for (var i in item.counter)  counter.push(item.counter[i]);
      counter.sort(function(a, b){
        return a.counter-b.counter;
      });
      topBranchData.labels = [];
      topBranchData.datasets[0].data = [];
      topBranchData.datasets[1].data = [];
      for (var i in counter)  {
        topBranchData.labels.push(counter[i].counter);
        topBranchData.datasets[0].data.push(counter[i].Qcomplete);
        topBranchData.datasets[1].data.push(counter[i].Qcancel);
      }      
      window.myVerCounterStcak.update();


      // Combo chart
      var Qtotal = [0,0,0,0,0,0,0,0,0,0,0,0];
      var Qcomplete = [0,0,0,0,0,0,0,0,0,0,0,0];
      var Qcancel = [0,0,0,0,0,0,0,0,0,0,0,0];
      for (var i in Qtotal)  {
        Qcomplete[i] += item.completePeriod[i];
        Qcancel[i] += item.cancelPeriod[i];
        Qtotal[i] = item.completePeriod[i] + item.cancelPeriod[i];
      }
      lineData.datasets[0].data = Qcomplete;
      lineData.datasets[1].data = Qcancel;
      window.myLineChart.update();

      // Satisfy chart
      satisfyData.datasets[0].data = item.satValue;
      window.mySatChart.update();
      // alert('test')

      $scope.brID = item.branchID+' / '+item.branchName;
      $scope.brComplete = item.Qcomplete;
      $scope.brCancel = item.Qcancel;
      $scope.brNoservice = item.Qundefine;
      $scope.brTotal = item.Qtotal;

      var header = [];
      var l1 =  [ { headText: 'Employee satisfaction assessment', colSpan: '', rowSpan: '', align: 'left'} ];
      var l2 = [
        { headText: 'ID', colSpan: '', rowSpan: '', align: 'left'},
        { headText: 'Branch', colSpan: '', rowSpan: '', align: 'left'},
      ];
      var l3 = [];
      l1[0].colSpan = '6';
      l2.push({headText: 'Complate', colSpan: '', rowSpan: '', align: 'center'});
      l2.push({headText: 'Cancle', colSpan: '', rowSpan: '', align: 'center'});
      l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});
      l2.push({headText: 'Average', colSpan: '', rowSpan: '', align: 'center'});
      header = [ l1, l2 ];
      $scope.branchTableHeader = header;

      var tp = { 
        branchID: item.branchID, idSpan: '10%', idColor: 'green',
        branchName: item.branchName, nameSpan: '40%', nameColor: 'green',
        data: [],  //  { text: '', value: [0,1,2,3], dColor: 'red' }
      };
      var employee = item.employee;
      employee.sort(function(a, b){
        return a.userName-b.userName;
      });       
      for (var i in employee)  {
        var dat = [0, 0, 0, 0];
        dat[0] = employee[i].Qcomplete;
        dat[1] = employee[i].Qcancel;
        dat[2] = employee[i].Qtotal;
        var satPress = 0;
        for (var j = 1; j < employee[i].satValue.length; j++) satPress += employee[i].satValue[j];
        var avg = 0;
        for (var j = 1; j < employee[i].satValue.length; j++) avg += employee[i].satValue[j]*j;
        if (avg != 0)  avg = avg / (satPress*5) * 100;
        avg = avg.toFixed(2);
        dat[3] = avg; 
        tp.data.push({ text: employee[i].userName+' / '+employee[i].fullName, value: dat, dColor: '', align: ''});
      }
      oneBranch.push(tp);
      $scope.gridOneBranch.data = oneBranch;

    });
  }

  // if (homeTimeout == null)  branchRefresh(); 

  branchRefresh(); 
  var intervalBranch = $interval(function(){
    branchRefresh(); 
  },1000*3);
  $scope.$on('$destroy', function () { $interval.cancel(intervalBranch); });

  $scope.brDateChange = function (sd)  {
    cond.startDate = $scope.brStartDate; //new Date(2017, 0, 1);
    cond.startDate.setHours(0, 0, 0);
    cond.stopDate.setHours(23, 59, 0);
    branchRefresh(); 
  }

  var color = Chart.helpers.color;

  var topJobData =  {
    labels: [],
    datasets: [
      {
        label: 'Complete',
        borderColor: window.chartColors.red,
        backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
      {
        label: 'Cancel',
        borderColor: window.chartColors.green,
        backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
    ],
  };

  var horBrJobID = document.getElementById("canvasHorBarJobBr").getContext("2d");
  window.myJobHorChartBr = new Chart(horBrJobID, {
    type: 'horizontalBar',
    data: topJobData,
    options: {
      title:{
        display:true,
        text: 'Service type'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }

  });

  var topBranchData =  {
    labels: [],
    datasets: [
      {
        label: 'Complete',
        borderColor: window.chartColors.red,
        backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
      {
        label: 'Cancel',
        borderColor: window.chartColors.green,
        backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [],
      }, 
    ],
  };

  var verBrCntStack = document.getElementById("canvasVerCounterStack").getContext("2d");
  window.myVerCounterStcak = new Chart(verBrCntStack, {
    type: 'bar',
    data: topBranchData,

    options: {
      title:{
        display:true,
        text: 'Quantity of service queue by counter'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }

  });

  var lineData = {
    labels: ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
    datasets: [
      // {
      //   type: 'line',
      //   label: 'Total',
      //   borderColor: window.chartColors.blue,
      //   borderWidth: 1,
      //   fill: false,
      //   // backgroundColor: color(window.chartColors.blue).alpha(0.2).rgbString(),
      //   // pointBackgroundColor: window.chartColors.red,
      //   data: [0,0,0,0,0,0,0,0,0,0,0,0],
      // }, 
      {
        type: 'line',
        label: 'Complete',
        borderColor: window.chartColors.red,
        fill: true,
        backgroundColor: color(window.chartColors.red).alpha(0.2).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }, 
      {
        type: 'line',
        label: 'Cancel',
        borderColor: window.chartColors.green,
        fill: true,
        backgroundColor: color(window.chartColors.green).alpha(0.2).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }
    ]

  };

  var lineID = document.getElementById("canvasLineCmp").getContext("2d");
  window.myLineChart = new Chart(lineID, {
    type: 'line',
    data: lineData,
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
              labelString: 'Time'
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
          text: 'Compare between complete and cancel queue by time',
        }
      }
  });

  var satisfyData = {
    labels: ["None", "level-1", "level-2", "level-3", "level-4", "level-5"],
    datasets: [
      {
        type: 'bar',
        label: 'Satisfy',
        borderColor: window.chartColors.blue,
        fill: true,
        backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0],
      }, 
    ]
  };

  var verBarID = document.getElementById("canvasVerBar").getContext("2d");
  window.mySatChart = new Chart(verBarID, {
    type: 'bar',
    data: satisfyData,
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
              labelString: 'score'
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'total'
            }
          }]
        },
        title: {
          display: true,
          text: 'Satisfaction assessment result',
        }
      }
  });


});

})();