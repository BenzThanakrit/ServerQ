(function () {

/* 
// Report controller 
*/
angular.module('myApp')
.controller('reportCtrl', function($scope, $mdDialog, $timeout, appService) {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Report';

  $scope.rpProgressBar = true;

  $scope.reportGridTemplate = {
    data: []
  };
  $scope.reportGridActions = {};

  var cond = {
    startDate: new Date(),
    stopDate: new Date(),
    branchList: []
  }

  cond.startDate = new Date(2017, 8, 1);
  cond.startDate.setHours(0, 0, 0);
  cond.stopDate.setHours(23, 59, 0);

  $scope.rpStartDate = cond.startDate;
  $scope.rpStopDate = cond.stopDate;

  $scope.reportName = [
    {name: 'Template1-แยกตามช่วงเวลา', disable: false},
    {name: 'Template2-แยกตาม Segment', disable: true},
    {name: 'Template3-แยกตาม Counter', disable: false},
    {name: 'Template4-แยกตามประเภทบริการ', disable: false},
    {name: 'Template5-แยกตามรายพนักงาน ', disable: false},
    {name: 'Template6-แยกตามช่วงเวลา / แยกตาม Segment / แยกตาม Counter / แยกตามประเภทบริการ', disable: true},
    {name: 'Template7-แยกตามช่วงเวลา / แยกตาม Segment / แยกตาม Counter', disable: true},
    {name: 'Template8-แยกตามช่วงเวลา / แยกตาม Segment / แยกตามประเภทบริการ', disable: true},
    {name: 'Template9-แยกตามช่วงเวลา / แยกตาม Counter / แยกตามประเภทบริการ', disable: true},
    {name: 'Template10-แยกตาม Segment / แยกตาม Counter / แยกตามประเภทบริการ', disable: true},
    {name: 'Template11-แยกตามช่วงเวลา / แยกตาม Segment', disable: true},
    {name: 'Template12-แยกตามช่วงเวลา / แยกตาม Counter', disable: true},
    {name: 'Template13-แยกตามช่วงเวลา / แยกตามประเภทบริการ', disable: false},
    {name: 'Template14-แยกตาม Segment / แยกตาม Counter', disable: true},
    {name: 'Template15-แยกตาม Segment / แยกตามประเภทบริการ', disable: true},
    {name: 'Template16-แยกตาม Counter / แยกตามประเภทบริการ', disable: true},
    {name: 'Template17-แยกตามประเภทบริการ / แยกตามรายพนักงาน', disable: false},
    {name: 'Template18-แยกตาม Counter / แยกตามรายพนักงาน',disable: true},
    {name: 'Template19-แยกตามความพึงพอใจ / แยกตามประเภทบริการ',disable: false},
    {name: 'Template20-แยกตามความพึงพอใจ / แยกตามรายพนักงาน',disable: false},
    {name: 'Template21-แยกตามช่วงเวลา / แยกตามรายพนักงาน',disable: false},
  ];

  $scope.gotoReport = function(startDate, stopDate, tempName)  {
    $scope.rpProgressBar = false;
    cond.startDate = $scope.rpStartDate;
    cond.stopDate = $scope.rpStopDate;
    cond.startDate.setHours(0, 0, 0);
    cond.stopDate.setHours(23, 59, 0);
    if (tempName == undefined)  {
      $scope.rpProgressBar = true;
      // alert(cond.startDate+' / '+cond.stopDate+' / '+tempName);    
      $mdDialog.show(
        $mdDialog.alert()
        .title('Alert')
        .textContent('Please select template')
        .ok('OK!')
      );
      return;
    }

    socket.emit('web-report-get-data', cond, function(err, ret)  {
      // $scope.selectedType = {url: 'report/template.html',text: 'template'};
      var template = renderQueue(tempName, ret.report);
      $timeout(function() {
        $scope.reportGridTemplate.data = template;
        $scope.rpProgressBar = true;
        $scope.showTable = true;
        $scope.showGraph = false;
        $scope.item.branchID = '';
        if (template.length)  {
          var item = template[0];
          $scope.reportBranch = item.branchID;
          graphRender(item.branchID, tempName, template);
        }
      }, 100);
    });
  }

  var jobName = [];
  function renderQueue(tempName, mapResult)  {

    var header = [];
    var l1 =  [ { headText: tempName, colSpan: '', rowSpan: '', align: 'center'} ];
    var l2 = [
      { headText: 'ID', colSpan: '', rowSpan: '', align: 'left'},
      { headText: 'Branch', colSpan: '', rowSpan: '', align: 'left'},
    ];
    var l3 = [];

    // find job name
    for (var i = 0; i < mapResult.length; i++)  {
      for (var j in mapResult[i].value.jobName)  {
         var k = jobName.indexOf(mapResult[i].value.jobName[j].jobName);
         if (k < 0) {
          jobName.push(mapResult[i].value.jobName[j].jobName);
          l3.push({headText: mapResult[i].value.jobName[j].jobName, colSpan: '', rowSpan: ''});
        }
      }
    }

    var cond = tempName.split('-')[0];
    var template = [];
    var hour = ['8.00', '9.00', '10.00', '11.00', '12.00', '13.00', '14.00', '15.00', '16.00', '17.00', '18.00', '19.00'];
    for (var i in mapResult)  {
      var item = mapResult[i].value;

      var tp = { 
        branchID: item.branchID, idSpan: '10%', idColor: 'green',
        branchName: item.branchName, nameSpan: '40%', nameColor: 'green',
        // firstLine: [],  // [0,1,2,3]
        data: [],  //  { text: '', value: [0,1,2,3], dColor: 'red' }
      };

      switch(cond)  {

        case 'Template1':
        l1[0].colSpan = '5';
        // l2.push({headText: 'Time', colSpan: '', rowSpan: ''});
        l2.push({headText: 'Complete', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Cancel', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});
        header = [ l1, l2 ];  
        $scope.tableHeader = header;     

        var colSum = [0,0,0];
        for (var j in hour)  {
          var dat = [0,0,0];
          dat[0] = item.period.Qcomplete[j];
          dat[1] = item.period.Qcancel[j];
          dat[2] = item.period.Qtotal[j];
          colSum[0] += item.period.Qcomplete[j];
          colSum[1] += item.period.Qcancel[j];
          colSum[2] += item.period.Qtotal[j];
          tp.data.push({ text: hour[j], value: dat, dColor: '', align: 'center'});
        }
        tp.data.push({ text: 'Sum', value: colSum, dColor: 'red', align: 'center'});
        template.push(tp);
        break;

        case 'Template3':
        l1[0].colSpan = '5';
        l2.push({headText: 'Complete', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Cancel', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});
        header = [ l1, l2 ];  
        $scope.tableHeader = header;     

        var colSum = [0,0,0];
        item.counter.sort(function(a, b){
          return a.counter-b.counter;
        });            
        for (var j in item.counter)  {
          var dat = [0,0,0];
          dat[0] = item.counter[j].Qcomplete;
          dat[1] = item.counter[j].Qcancel;
          dat[2] = item.counter[j].Qtotal;
          colSum[0] += item.counter[j].Qcomplete;
          colSum[1] += item.counter[j].Qcancel;
          colSum[2] += item.counter[j].Qtotal;
          tp.data.push({ text: 'Counter-'+item.counter[j].counter, value: dat,  dColor: '', align: 'left'});
        }        
        tp.data.push({ text: 'Sum', value: colSum,  dColor: 'red', align: 'left'});
        template.push(tp);
        break;

        case 'Template4':
        l1[0].colSpan = '5';
        l2.push({headText: 'Complete', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Cancel', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});
        header = [ l1, l2 ];  
        $scope.tableHeader = header;     

        var colSum = [0,0,0];
        for (var j in item.jobName)  {
          var dat = [0,0,0];
          dat[0] = item.jobName[j].Qcomplete;
          dat[1] = item.jobName[j].Qcancel;
          dat[2] = item.jobName[j].Qtotal;
          colSum[0] += item.jobName[j].Qcomplete;
          colSum[1] += item.jobName[j].Qcancel;
          colSum[2] += item.jobName[j].Qtotal;
          tp.data.push({ text: item.jobName[j].jobName+'-jb'+j, value: dat, dColor: '', align: ''});
        }
        tp.data.push({ text: 'Sum', value: colSum, dColor: 'red', align: ''});
        template.push(tp);
        break;

        case 'Template5':
        l1[0].colSpan = '5';
        l2.push({headText: 'Complete', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Cancel', colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});
        header = [ l1, l2 ];  
        $scope.tableHeader = header;     

        var colSum = [0,0,0];
        for (var j in item.employee)  {
          var dat = [0,0,0];
          dat[0] = item.employee[j].Qcomplete;
          dat[1] = item.employee[j].Qcancel;
          dat[2] = item.employee[j].Qtotal;
          colSum[0] += item.employee[j].Qcomplete;
          colSum[1] += item.employee[j].Qcancel;
          colSum[2] += item.employee[j].Qtotal;
          tp.data.push({ text: item.employee[j].userName+'-'+item.employee[j].fullName, value: dat, dColor: '', align: ''});
        }
        tp.data.push({ text: 'Sum', value: colSum, dColor: 'red', align: ''});
        template.push(tp);
        break;

        case 'Template13':
        l1[0].colSpan = '15';
        for (var j in hour)  l2.push({headText: hour[j], colSpan: '', rowSpan: '', align: 'center'});  
        l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});  
        header = [ l1, l2 ];
        $scope.tableHeader = header;
        tp.idSpan = '10%';
        tp.nameSpan = '20%';

        var colSum = new Array(hour.length+1).fill(0);
        for (var j in item.jobName)  {
          var dat = [];
          var rowSum = 0;
          for (var k = 0; k < item.jobName[j].period.length; k++)  {
            dat.push(item.jobName[j].period[k]);
            colSum[k] += item.jobName[j].period[k];
            rowSum += item.jobName[j].period[k];
          }
          dat.push(rowSum);
          colSum[k] += rowSum;
          tp.data.push({ text: item.jobName[j].jobName, value: dat,  dColor: '', align: ''});
        }
        tp.data.push({ text: 'Sum', value: colSum,  dColor: 'red', align: ''});
        template.push(tp);
        break;

        case 'Template17':
        l1[0].colSpan = jobName.length+2;
        for (var j in jobName)  l2.push({headText: jobName[j], colSpan: '', rowSpan: '', align: 'center'});
        l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});  
        header = [ l1, l2 ];
        $scope.tableHeader = header;
        tp.idSpan = '10%';
        tp.nameSpan = '20%';

        var colSum = new Array(jobName.length+1).fill(0);
        for (var j in item.employee)  {
          var emp = item.employee[j];
          var dat = new Array(jobName.length).fill(0);
          var rowSum = 0;
          for (var k = 0; k < jobName.length; k++)  {
            for (var l in emp.jobName)
            if (jobName[k] == emp.jobName[l].jobName)  {
              dat[k] = emp.jobName[l].Qtotal;
              rowSum += emp.jobName[l].Qtotal;
              colSum[k] += emp.jobName[l].Qtotal;
            }
          }          
          dat.push(rowSum);
          colSum[k] += rowSum;
          tp.data.push({ text: emp.userName+'-'+emp.userName, value: dat, dColor: '', align: ''});
        }
        tp.data.push({ text: 'Sum', value: colSum, dColor: 'red', align: ''});
        template.push(tp);
        break;

        case 'Template19':
        var satHead = ['คิวทั้งหมด',  'คิวที่กดประเมิน', 'คิวที่ไม่กดประเมิน', 'คิวยกเลิก', 'ไม่พอใจมาก', 'ไม่พอใจ', 'ปานกลาง', 
                       'พอใจ', 'พอใจมาก', 'เฉลี่ย(%)',];
        l1[0].colSpan = satHead.length+2;
        for (var j in satHead)  l2.push({headText: satHead[j], colSpan: '', rowSpan: '', align: 'center'});
        header = [ l1, l2 ];
        $scope.tableHeader = header;
        tp.idSpan = '10%';
        tp.nameSpan = '20%';
        for (var j in item.jobName)  {
          var dat = [];
          dat.push(item.jobName[j].Qtotal);
          var satPress = 0;
          for (var k = 1; k < item.jobName[j].satValue.length; k++) satPress += item.jobName[j].satValue[k];
          dat.push(satPress);
          var satNoPress = item.jobName[j].satValue[0];
          dat.push(satNoPress);
          dat.push(item.jobName[j].Qcancel);
          var avg = 0;
          for (var k = 1; k < item.jobName[j].satValue.length; k++) {
            dat.push(item.jobName[j].satValue[k]);
            avg += item.jobName[j].satValue[k]*k;
          }
          if (avg != 0)  avg = avg / (satPress*5) * 100;
          avg = avg.toFixed(2);          
          dat.push(avg);
          tp.data.push({ text: item.jobName[j].jobName+'-jb'+j, value: dat,  dColor: '', align: ''});
        }
        template.push(tp);
        break;

        case 'Template20':
        var satHead = ['คิวทั้งหมด',  'คิวที่กดประเมิน', 'คิวที่ไม่กดประเมิน', 'คิวยกเลิก', 'ไม่พอใจมาก', 'ไม่พอใจ', 'ปานกลาง', 
                       'พอใจ', 'พอใจมาก', 'เฉลี่ย(%)',];
        l1[0].colSpan = satHead.length+2;
        for (var j in satHead)  l2.push({headText: satHead[j], colSpan: '', rowSpan: '', align: 'center'});
        header = [ l1, l2 ];
        $scope.tableHeader = header;
        tp.idSpan = '10%';
        tp.nameSpan = '20%';
        for (var j in item.employee)  {
          var dat = [];
          dat.push(item.employee[j].Qtotal);
          var satPress = 0;
          for (var k = 1; k < item.employee[j].satValue.length; k++) satPress += item.employee[j].satValue[k];
          dat.push(satPress);
          var satNoPress = item.employee[j].satValue[0];
          dat.push(satNoPress);
          dat.push(item.employee[j].Qcancel);
          var avg = 0;
          for (var k = 1; k < item.employee[j].satValue.length; k++) {
            dat.push(item.employee[j].satValue[k]);
            avg += item.employee[j].satValue[k]*k;
          }
          if (avg != 0)  avg = avg / (satPress*5) * 100;
          avg = avg.toFixed(2);          
          dat.push(avg);
          tp.data.push({ text:  item.employee[j].userName+'-'+item.employee[j].userName, value: dat,  dColor: '', align: ''});
        }
        template.push(tp);
        break;

        case 'Template21':
        l1[0].colSpan = '15';
        for (var j in hour)  l2.push({headText: hour[j], colSpan: '', rowSpan: '', align: 'center'});  
        l2.push({headText: 'Total', colSpan: '', rowSpan: '', align: 'center'});  
        header = [ l1, l2 ];
        $scope.tableHeader = header;
        tp.idSpan = '10%';
        tp.nameSpan = '20%';

        var colSum = new Array(hour.length+1).fill(0);
        for (var j in item.employee)  {
          var dat = [];
          var rowSum = 0;
          for (var k = 0; k < item.employee[j].period.length; k++)  {
            dat.push(item.employee[j].period[k]);
            rowSum += item.employee[j].period[k];
            colSum[k] += item.employee[j].period[k];
          }
          dat.push(rowSum);
          colSum[k] += rowSum;
          tp.data.push({ text: item.employee[j].userName+'-'+item.employee[j].userName, value: dat,  dColor: '', align: ''});
        }
        tp.data.push({ text: 'Sum', value: colSum,  dColor: 'red', align: ''});
        template.push(tp);
        break;

        default:
        break;
      }

    }
    // $scope.reportGridTemplate.data = template;
    return template;
  }

/*
// plot graph
*/
  $scope.plotGraph = function(branchID, template, filtered)  { 
    // alert(branchID);
    graphRender(branchID, template, filtered);
  }
  function graphRender(branchID, template, filtered)  {  
    // console.log(filtered);    
    var tmpl = template.split('-')[0];
    var brData = null;
    if (filtered.length)  {
      for (var i in filtered)  {
        if (filtered[i].branchID == branchID)  {
          brData = filtered[i];
          break;
        }
      }
    }
    else  return;

    var labels = [];
    var gName = [];
    var data = [];
    var title = '';
    var xScale = '';
    var yScale = '';
    var gtype = [];
    var fill = [];

    switch(tmpl)  {
      case 'Template1':      
      case 'Template3':      
      case 'Template4':      
      case 'Template5':
      data = [[], [], []];
      gName =  ['Complete', 'Cancel', 'Total'];
      gtype =  ['bar', 'bar', 'line'];
      fill = [false, false, false];
      for (var i = 0; i < brData.data.length-1; i++)  {
        if (tmpl == 'Template1')  {
          labels.push(brData.data[i].text);
          title = 'Q.in.each.hour';
          xScale = 'Time';
        }
        if (tmpl == 'Template3') {
          labels.push(brData.data[i].text.split('-')[1]); 
          title = 'Q.in.counter';
          xScale = 'Counter';
        }  
        if (tmpl == 'Template4') {
          labels.push(brData.data[i].text.split('-')[1]); 
          title = 'Q.in.service';
          xScale = 'Service';
        }  
        if (tmpl == 'Template5')  {
          labels.push(brData.data[i].text.split('-')[0]);
          title = 'Q.in.employee';
          xScale = 'Employee';
        }
        var value = brData.data[i].value;
        data[0].push(value[0]);
        data[1].push(value[1]);
        data[2].push(value[2]);
      }
      // if (tmpl == 'Template1' || tmpl == 'Template4')   plotReportCombo(title, xScale, labels, gName, data, gtype, fill);
      // if (tmpl == 'Template3' || tmpl == 'Template5')   plotReportStack(title, xScale, labels, gName, data, gtype, fill);      
      plotReportCombo(title, xScale, labels, gName, data, gtype, fill);
      break;

      case 'Template13':      
      labels = ["8.00", "9.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00", "16.00", "17.00", "18.00", "19.00"];
      title = 'Q.in.time/service';
      xScale = 'Time';
      data = [];
      for (var i = 0; i < brData.data.length-1; i++)  {
        gtype.push('bar');
        fill.push(false);
        gName.push(brData.data[i].text);
        var value = brData.data[i].value;
        var dat = [];        
        for (var j = 0; j < value.length-1; j++)  {
          dat.push(value[j]);
        }
        data.push(dat);
      }
      plotReportStack(title, xScale, labels, gName, data, gtype, fill);
      break;

      case 'Template17':
      title = 'Q.in.employee/service';
      xScale = 'Time';
      gName = jobName;
      for (var i in gName)  data.push([]);
      for (var i = 0; i < brData.data.length-1; i++)  {
        gtype.push('line');
        fill.push(false);
        labels.push(brData.data[i].text.split('-')[0]);
        var value = brData.data[i].value;
        for (var j = 0; j < value.length-1; j++)  {
          data[j].push(value[j]);
        }
      }
      plotReportStack(title, xScale, labels, gName, data, gtype, fill);
      break;

      case 'Template19':
      data = [[]];
      title = 'Satisfy/service';
      xScale = 'Service';
      gName.push('Satisfy(%)');
      gtype.push('bar');
      for (var i = 0; i < brData.data.length; i++)  {
        fill.push(false);
        labels.push(brData.data[i].text.split('-')[1]);
        var value = brData.data[i].value;
        data[0].push(value[value.length-1]);
      }
      plotReportCombo(title, xScale, labels, gName, data, gtype, fill);
      break;

      case 'Template20':
      data = [[]];
      title = 'Satisfy/service';
      xScale = 'Employee';
      gName.push('Satisfy(%)');
      gtype.push('bar');
      for (var i = 0; i < brData.data.length; i++)  {
        fill.push(false);
        labels.push(brData.data[i].text.split('-')[1]);
        var value = brData.data[i].value;
        data[0].push(value[value.length-1]);
      }
      plotReportCombo(title, xScale, labels, gName, data, gtype, fill);
      break;


      default:
      $scope.item.branchID = '';
      break;
    }

  }

/*
// Graph show
*/
  $scope.showGraph = true;
  var colorNames = Object.keys(window.chartColors);
  var color = Chart.helpers.color;
  var comboReportData = {      
    labels: [],
    datasets: [],
  };

  var options1 = {
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
      text: 'Graph from table',
    }
  };

  var options2 =  {
    title:{
      display:true,
      text:""
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
  };

  var comboReportID = document.getElementById("graphReportCombo").getContext("2d");  

  window.myComboReportChart = new Chart(comboReportID, {
    type: 'bar',
    data: comboReportData,
    options: options1,
  });

  window.myStackReportChart = new Chart(comboReportID, {
    type: 'bar',
    data: comboReportData,
    options: options2,
  });

  $timeout(function(){
    $scope.showGraph = false;
  },100); 

/*
// Show combo graph 
*/
  function plotReportCombo (title, xScale, labels, gName, dat, gtype, fill)  { 
    $scope.showGraph = true;
    comboReportData.datasets = [];
    for (var i in dat)  {
      var colorName = colorNames[comboReportData.datasets.length % colorNames.length];
      var newColor = window.chartColors[colorName];
      comboReportData.datasets.push({
        type: gtype[i],
        label: gName[i],
        fill: fill[i],
        backgroundColor: color(newColor).alpha(0.5).rgbString(),
        borderColor: newColor,
        borderWidth: 1,
        data: dat[i],
      });
    }
    comboReportData.labels = labels;
    window.myComboReportChart.options.title.text = title;
    window.myComboReportChart.options.scales.xAxes[0].scaleLabel.labelString = xScale;
    window.myComboReportChart.update();
  }

/*
// Show combo graph 
*/
  function plotReportStack (title, xScale, labels, gName, dat, gtype, fill)  { 
    $scope.showGraph = true;
    comboReportData.datasets = [];
    for (var i in dat)  {
      var colorName = colorNames[comboReportData.datasets.length % colorNames.length];
      var newColor = window.chartColors[colorName];
      comboReportData.datasets.push({
        // type: gtype[i],
        label: gName[i],
        fill: fill[i],
        backgroundColor: color(newColor).alpha(0.5).rgbString(),
        borderColor: newColor,
        borderWidth: 1,
        data: dat[i],
      });
    }
    comboReportData.labels = labels;
    window.myStackReportChart.options.title.text = title;
    // window.myComboReportChart.options.scales.xAxes[0].scaleLabel.labelString = xScale;
    window.myStackReportChart.update();
  }

});

})();


