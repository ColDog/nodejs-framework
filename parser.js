var listTpl = `
<ul>
  {% for x in list %}
    <li>{{ x }}</li>
  {% endfor %}
</ul>
{% if name %}
  <h1>{{ name }}</h1>
{% endif %}
`

var page = `<h1>Hello There</h1>{% render list({name: name, list: list}) %}<p>Hi there {{ name }}</p>`

var components = {}

function Component(opts) {
  this.data = opts.data || {}
  this.tpl = opts.tpl
  this.components = opts.components
  this.compiled = null
  this.id = opts.id || 'comp-' + Math.random().toString(36).substring(2, 10)
  this.events = opts.events
  components[this.id] = this

  this.render = function(data) {
    var self = this;
    if (data) {
      Object.keys(data).forEach(function(key) {
        self.data[key] = data[key]
      })
    }
    if (!this.compiled) {
      this.compiled = this.compile()
    }
    return this.compiled()
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
      code += 'r.push(' + line + ');\n'
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
          code += 'r.push("<span>")'
          code += 'r.push(this.components["'+ args[0] +'"].render('+ args[1] +'));'
          code += 'r.push("</span>")'
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
  tpl: listTpl,
  data: {}
})

var Page = new Component({
  tpl: page,
  data: {
    list: ['a', 'b'],
    name: 'Colin'
  },
  resources: {

  },
  components: {
    list: List
  }
})

console.log(Page.render())
