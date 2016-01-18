var express = require('express');
var app = express();
var addTemplates = require('./assets/components').addTemplates
var Page = require('./assets/components')

app.use('/assets', express.static('assets'));

app.get('/', function (req, res) {
  var page = Page.render()
  page += addTemplates()
  res.send(page)
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});