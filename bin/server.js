var lib = require('./serverLib.js');

// var emitter = new lib.SimpleEE();
var emitter = lib.emitter;

/* 
// Global variable access here
*/
var globalValue = {
  value: {},
  read: function (name)  {
    // var val = globalValue[name];
    var val = globalValue.value[name];
    return val;
  },
  write: function (name, val)  {
    // globalValue[name] = val;
    globalValue.value[name] = val;
    return val;
  },
}

/* 
// Initialization
*/
function Initialization (server)  {
lib.firstInitialzation(function (net, dbx, mb, dbr, mr)  {
  // globalValue.write('net', net);
  // globalValue.write('base', { dbx: dbx, dbr: dbr});
  globalValue.value['net'] = net;
  globalValue.value['base'] = { dbx: dbx, dbr: dbr};

  var io = require('socket.io').listen(server);

  lib.loadTable(globalValue, function()  {

    emitter.emit('webpage-socket-start', io);
    emitter.emit('server-socket-start', io);

  })

})
}
// module.exports = Initialization;

/* 
// socket IO Web interface 
*/
emitter.on('webpage-socket-start', function(_io) {
  var io = _io;
  globalValue.value['webSocket'] = [];
  var webSocket = globalValue.value['webSocket'];
  io.on('connection', function (socket) {
    // var temp = socket.handshake.address.split(':');
    var temp = socket.request.connection.remoteAddress.split(':');
    var ip = temp[temp.length-1];
    webSocket.push({socket: socket, name: '', id:'', ip: ip});
    console.log('Web socket connecte / total connection ->', webSocket.length, ip);

    // Socket disconnect
    socket.on('disconnect', function () {
      for (var i in webSocket)  {
        if (webSocket[i].socket == socket)  {
          console.log('Web socket close', webSocket[i].name, webSocket[i].id, '/ remain connection ->',webSocket.length-1);
          webSocket.splice(i, 1);
        }
      }
    });

    // home get data
    socket.on('web-home-get-data', function (cond, callback) {
      console.log('web-home-get-data ->', cond);
      var clientSocket = globalValue.value['clientSocket'];
      for (var i = 0; i < webSocket.length; i++)  {
        if (webSocket[i].socket == socket)  {
          break;
        }
      }
      var tblName = 'tm'+i+'-'+webSocket[i].ip;
      cond.startDate = new Date(cond.startDate);
      cond.stopDate = new Date(cond.stopDate);
      cond['collOut'] = tblName;
      var dbr = globalValue.value['base'].dbr;
      lib.dashBoard(dbr, cond, function(err, data)  {
        var online = [];
        for (var i in clientSocket)  {
          var obj = { branchInfo: clientSocket[i].branchInfo, realtime: clientSocket[i].realtime };
          online.push(obj);
        }
        callback(0, { online: online, dashboard: data } );
      })
    });

    // realtime get data
    socket.on('web-realtime-get-data', function (cond, callback) {
      console.log('web-realtime-get-data ->', cond);
      var clientSocket = globalValue.value['clientSocket'];
      var online = [];
      for (var i in clientSocket)  {
        var obj = { branchInfo: clientSocket[i].branchInfo, realtime: clientSocket[i].realtime };
        online.push(obj);
      }
      callback(0, { online: online } );
    });

    // Setting get online
    socket.on('web-setting-get-online', function (callback) {
      console.log('web-setting-get-online ->');
      var clientSocket = globalValue.value['clientSocket'];
      var online = [];
      for (var i in clientSocket)  {
        // var obj = { branchInfo: clientSocket[i].branchInfo, realtime: clientSocket[i].realtime };
        var obj = { branchInfo: clientSocket[i].branchInfo };
        online.push(obj);
      }
      callback(0, { online: online } );
    });

    // Setting get data
    socket.on('web-report-get-data', function (cond, callback) {
      // console.log('web-home-get-data ->', cond);
      console.log('web-home-get-data ->');
      // var clientSocket = globalValue.read('clientSocket');
      var clientSocket = globalValue.value['clientSocket'];
      for (var i = 0; i < webSocket.length; i++)  {
        if (webSocket[i].socket == socket)  {
          break;
        }
      }
      var tblName = 'tm'+i+'-'+webSocket[i].ip;
      cond.startDate = new Date(cond.startDate);
      cond.stopDate = new Date(cond.stopDate);
      cond['collOut'] = tblName;
      // var dbr = globalValue.read('base').dbr;
      var dbr = globalValue.value['base'].dbr;

      lib.reportMapReduce(dbr, cond, function(err, data)  {
        callback(0, { report: data } );
      })

    });

    // Web get data
    socket.on('web-setting-get-data', function (data, callback) {
      lib.getData(globalValue, data, function(err, ret) {
        console.log('web-setting-get-data ->', data, ret);
        // console.log('web-setting-get-data ->', data);
        callback(0, ret);
      });
    });

    // login get user
    socket.on('web-login-get-user', function (data, callback) {
      console.log('web-login-get-user ->', data);
      lib.userAuthen(globalValue, data, function(err, ret) {
        callback(0, ret);
      });
    });

    // Setting write data
    socket.on('web-setting-write-data', function (data, callback) {      
      console.log('webs-etting-write-data ->', data.base);
      lib.writeData(globalValue, data, function(err, ret) {
        // console.log(obj);
        callback(err, ret);
      });      
    });

    //Encrypt data
    socket.on('web-setting-encryp-data', function (data, callback) { 
      console.log('websetting-encryp-data ->', data);
      var ret = lib.encrypData(data);
      console.log(ret);
      callback(0, ret);
    });      

  })

})

/* 
// socket IO server interface 
*/
emitter.on('server-socket-start', function(_io) {
  var ns = _io.of('/ns');
  // globalValue.write('clientSocket', []);
  // var clientSocket = globalValue.read('clientSocket');
  globalValue.value['clientSocket'] = [];
  var clientSocket = globalValue.value['clientSocket'];

  ns.on('connection', function (sockAPI) {
    var temp = sockAPI.client.conn.remoteAddress.split(':');
    var clientIP = temp[temp.length-1];
    // console.log('Client connect from IP->', clientIP);
    var dateTime = new Date();
    sockAPI.emit('client-get-information', dateTime, function(err, ret) {
      ret.branchInfo['clientIP'] = clientIP;
      var obj = { socket: sockAPI, branchInfo: ret.branchInfo};
      clientSocket.push(obj);
      console.log('Client connect from ->', ret.branchInfo, '(length) ->', clientSocket.length);

      if (ret.employee.length)  {
        lib.saveEmployee(globalValue, 'employee', ret.employee, ret.branchInfo, function(err)  {
          if (clientSocket.length == 1)  {
            setTimeout (function()  {
              emitter.emit('client-start-scan', clientSocket);
            }, 1000);
          }
        })
      }

    });  

    // Connection colse
    sockAPI.on('disconnect', function () {
      for (var i in clientSocket)  {
        if (sockAPI == clientSocket[i].socket)  {  
          clientSocket.splice(i, 1);
        }
      }
      console.log('Client disconnect (length) ->',clientSocket.length);
    });

  });

})

/*
// Scan to get BR info  
*/
emitter.on('client-start-scan', function(clientSocket) {
  var async = require('async');  
  var q = async.queue(function (item, callback) {
    var flg = 0;
    // console.log('*');
    var sockAPI = item.socket;
    sockAPI.emit('client-get-qtoday', {limit: 3}, function(err, ret) {
      if (flg == 0)  {
        flg = 1;
        // console.log('client-get-qtoday return length ->', ret.qtdEnd.length, ret.history);
        console.log('* ->', ret.qtdEnd.length, ret.history);
        item['realtime'] = ret.realtime;
        // if (ret.qtdEnd.length)  {
          lib.saveQtoday(globalValue, 'br-Qtoday', ret.qtdEnd, ret.branchInfo, function(err)  {
            lib.saveHistory(globalValue, 'br-History', ret.history, ret.branchInfo, function(err)  {
              callback(0);
            })
          })
        // }
        // else  callback(0);
      }
    });
    setTimeout(function()  {
      if (flg == 0)  {
        flg = 1;
        console.log('No response in 3 secs from branch ->', item.branchID);
        callback(1);
      }
    }, 1000*3);
  });
  q.drain = function() {
    setTimeout(function()  {
      emitter.emit('client-start-scan', clientSocket);
    }, 1000*3);
  }
  if (clientSocket.length)  {
    q.push(clientSocket, function (err) {
    });
  }
})

module.exports = {
  Initialization: Initialization,
};

