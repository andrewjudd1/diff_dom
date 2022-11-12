let debounceRender = function (instance) {
    if (instance.debounce) {
        console.log('cancelled')
        window.cancelAnimationFrame(instance.debounce)
    }
    instance.debounce = window.requestAnimationFrame(function () {
        instance.render()
    })
}


let handler = function (instance) {
    return {
        get: function (obj, prop) {
            console.log(obj[prop])
            console.log(prop)
            console.log(prop === '_isProxy')
            if (prop === '_isProxy') return true;
            console.log(obj[prop]?._isProxy)
            if (typeof obj[prop] === 'object' && !obj[prop]?._isProxy) {
                console.log('created as proxy')
                obj[prop] = new Proxy(obj[prop], handler(instance))
            }

            return obj[prop]
        },
        set: function (obj, prop, value) {
            console.log('set it')
            obj[prop] = value
            debounceRender(instance)
            return true
        },
        deleteProperty: function (obj, prop) {
            console.log('delete it')
            delete obj[prop]
            debounceRender(instance)
            return true
        }
    }
}

class Rue {
    constructor(options) {
        let _this = this
        _this.elem = document.querySelector(options.selector)
        let _data = new Proxy(options.data, handler(this))
        _this.template = options.template
        _this.debounce = null

        Object.defineProperty(this, 'data', {
            get: function () {
                return _data
            },
            set: function (data) {
                _data = new Proxy(data, handler(_this))
                debounceRender(_this)
                return true
            }
        })
    }
}

let stringToHTML = function (str) {
    let parser = new DOMParser()
    let doc = parser.parseFromString(str, 'text/html')
    return doc.body
}

let getNodetype = function (node) {
    if (node.nodeType === 3) return 'text'
    if (node.nodeType === 8) return 'comment'
    return node.tagName.toLowerCase()
}

let getNodeContent = function (node) {
    if (node.childNodes && node.childNodes.length > 0) return null
    return node.textContent
}

let diff = function (template, elem) {
    let domNodes = Array.from(elem.childNodes)
    let templateNodes = Array.from(template.childNodes)

    let count = domNodes.length - templateNodes.length
    if (count > 0) {
        for (; count > 0; count--) {
            domNodes[domNodes.length - count].parentNode.removeChild(domNodes[domNodes.length - count])
        }
    }

    templateNodes.forEach(function (node, index) {
        if (!domNodes[index]) {
            elem.appendChild(node.cloneNode(true))
            return
        }

        if (getNodetype(node) !== getNodetype(domNodes[index])) {
            domNodes[index].parentNode.replaceChild(node.cloneNode(true), domNodes[index])
            return
        }

        let templateContent = getNodeContent(node)
        if (templateContent && templateContent !== getNodeContent(domNodes[index])) {
            domNodes[index].textContent = templateContent
        }

        if (domNodes[index].childNodes.length > 0 && node.childNodes.length < 1) {
            domNodes[index].innerHTML = ''
            return
        }

        if (domNodes[index].childNodes.length < 1 && node.childNodes.length > 0) {
            let fragment = document.createDocumentFragment()
            diff(node, fragment)
            domNodes[index].appendChild(fragment)
            return;
        }

        if (node.childNodes.length > 0) {
            diff(node, domNodes[index])
        }
    })
}

Rue.prototype.render = function () {
    let templateHTML = stringToHTML(this.template(this.data))

    diff(templateHTML, this.elem)
    //this.elem.innerHTML = this.template(this.data)
}

const app = new Rue({
    selector: '#app',
    data: { heading: 'My Todos', todos: ['Swim', 'Jump', 'Run', 'Sleep'] },
    template: function (props) {
        if (Object.values(props).length > 1) {
            console.log(props.heading)
            return `
            <h1>${props?.heading}</h1>
            <ul>
                ${props?.todos?.map(todo => {
                return `<li>${todo}</li>`
            }).join('')}
            </ul>
        `
        } else {
            return `
        <h1>Please add a todo</h1>
        `
        }
    }
})

app.render()
//app.data.todos.push('new todo')
