var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Page = require('./assets/components').Page
var env = typeof window == 'undefined' ? 'server' : 'client'

app.use('/assets', express.static('assets'));

app.get('/', function (req, res) {
  Page.renderPage(function(page) {
    res.send(page)
  })
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});


var PagesController = {
  all: function() {
    if (env == 'server') {

    } else {

    }
  },

  create: function() {

  }

}

server.listen(3000);
