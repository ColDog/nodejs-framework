var components = {}
var viewCache = {}
var templateCache = null


var Controller = {

}


function Component(opts) {
  this.mounts = opts.mounts
  this.source = opts.source
  this.data = opts.data || {}
  this.extends = opts.extends
  this.tpl = opts.tpl
  this.components = opts.components
  this.compiled = null
  this.id = opts.id || 'comp-' + Math.random().toString(36).substring(2, 10)
  this.events = opts.events
  components[this.id] = this

  this.set = function(k, v) {
    this.data[k] = v
    if (typeof window == 'undefined') {
      this.mount()
    }
  }

  this.addTemplates = function() {
    if (!templateCache) {
      templateCache = ''
      Object.keys(viewCache).forEach(function(name) {
        templateCache += '<script type="text/template" id="component-'+ name +'">' + viewCache[name] + '</script>'
      })
    }
    return templateCache
  }

  this.prepareAll = function(done) {
    var acts = []
    Object.keys(this.components).forEach(function(key) {
      acts.push(self.components[key].prepare)
    })
    acts.push(done.bind(this))
    (function next() {
      if(acts.length > 0) {
        var f = acts.shift();
        f.apply(self, [next]);
      }
    })();
  }

  this.renderPage = function(page) {
    this.prepareAll(function() {
      var html = this.render()
      html += this.addTemplates()
      page(html)
    })
  }

  this.prepare = function(done) {
    var self = this
    var data = this.data
    var counter = 0
    Object.keys(data).forEach(function(key) {
      if (data[key] instanceof Promise) {
        counter++
        Promise.resolve(data[key]).then(
          function(res) {
            self.set(key, res)
            counter--
            if (counter == 0) {
              done()
            }
          },
          function(err) {
            counter--
            console.warn(err)
          }
        )
      }
    })
  }

  this.render = function(data) {
    var self = this;
    if (data) {
      Object.keys(data).forEach(function(key) {
        self.data[key] = data[key]
      })
    }

    if (!this.tpl) {
      var tpl = this.load(this.source)
      if (this.extends) {
        var extension = this.load(this.extends)
        this.tpl = extension.replace(/\{%[ ]*yield[ ]*%}/i, tpl)
      } else {
        this.tpl = tpl
      }
    }

    if (!this.compiled) {
      this.compiled = this.compile()
    }

    return this.compiled()
  }

  this.load = function(name) {
    if (typeof window == 'undefined') {
      viewCache[name] = require('fs').readFileSync('./views/'+name+'.html', 'utf8')
    } else {
      viewCache[name] =  document.getElementById('component-'+name).innerHTML
    }
    return viewCache[name]
  }

  this.mount = function() {
    document.querySelector(this.mounts).innerHTML = this.render()
  }

  this.compile = function() {
    var tpl = this.tpl
    var re = /\{([\{%])(.+?)[}%]}/g
    var code = 'var r=[];\n'
    var cursor = 0
    var match

    Object.keys(this.data).forEach(function(key){
      code += 'var ' + key + '=this.data["'+ key +'"];\n'
    })

    var add = function(line) {
      code += 'r.push("' + line.replace(/"/g, '\\"').trim() + '");\n'
    }

    var scope = function(line) {
      code += 'r.push(" " +' + line + '+ " ");\n'
    }

    var directive = function(line) {
      var spl = line.trim().split(' ')
      switch (spl[0].trim()) {
        case 'for':
          code += spl[3] +'.forEach(function(' + spl[1] + '){\n'
          break
        case 'endfor':
          code += '});\n'
          break
        case 'if':
          code += 'if (' + line.replace('if', '').trim() + ') {'
          break
        case 'endif':
          code += '};'
          break
        case 'render':
          var args = line.replace('render', '').trim().split(/[()]/)
          code += 'r.push(this.components["'+ args[0] +'"].render('+ args[1] +'));'
          break
      }
    }

    while(match = re.exec(tpl)) {
      add(tpl.slice(cursor, match.index));
      if (match[1] == '%') {          // handle a block function
        directive(match[2])
      } else if (match[1] == '{') {   // handle a scope directive
        scope(match[2]);
      }
      cursor = match.index + match[0].length;
    }

    add(tpl.substr(cursor, tpl.length - cursor));
    code += 'return r.join("");'; // <-- return the result
    return new Function(code.replace(/[\r\t\n]/g, '')).bind(this)
  }
}


var List = new Component({
  source: 'list',
  data: {}
})

var Page = new Component({
  source: 'main',
  extends: 'app',
  mounts: 'body',
  data: {
    list: ['a', 'b'],
    name: 'Colin'
  },
  components: {
    list: List
  }
})

if (typeof window == 'undefined') {
  module.exports.Component = Component
  module.exports.viewCache = viewCache
  module.exports.addTemplates = addTemplates
  module.exports.Page = Page
}
