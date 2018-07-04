
(() => {
  const cssTemplate = `
    .#{containerClass} {
      border: #{borderWidth} solid #{borderColor};
      color: #{textColor};
    }
    .#{containerClass} .container {
      width: 100%;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: repeat(4, 1fr) 1.5fr;
      grid-auto-rows: 30px;
      grid-auto-columns: 1fr;
    }

    .#{containerClass} .container div {
      height: 30px;
      border-width: #{borderWidth};
      border-style: solid;
      border-color: #{borderColor};
      display: flex;
      justify-content: center;
      align-items: center;
      background: #{defaultColor}
    }

    .#{containerClass} .container div.up {
      background: #{upColor};
    }
    .#{containerClass} .container div.down {
      background: #{downColor};
    }

    .#{containerClass} .container div.sign {
      font-weight: bold;
    }

    /* medium */
    .#{containerClass}.medium .container {
      grid-template-columns: repeat(3, 1fr);
    }
    .#{containerClass}.medium .container div.spread {
      order: 1;
    }
    .#{containerClass}.medium .container div.ask {
      order: 2;
    }
    .#{containerClass}.medium .container div.date {
      order: 3;
    }

    .#{containerClass}.medium .container div:first-child {
     grid-column-start: 1;
     grid-column-end: 1;
     grid-row-start: 1;
     grid-row-end: 3;
     height: 100%;
    }



    /* small */
    .#{containerClass}.small .container {
      grid-template-columns: 1fr;
    }
    .#{containerClass}.small .container div.spread {
      order: 1;
    }
    .#{containerClass}.small .container div.ask {
      order: 3;
    }
    .#{containerClass}.small .container div.bid {
      order: 2;
    }
    .#{containerClass}.small .container div.date {
      order: 0;
    }

  `

  class ForexWidget {
    constructor(config = {}) {
      this.init = this.init.bind(this)
      this.setConfig = this.setConfig.bind(this)
      this.updateCss = this.updateCss.bind(this)
      this.domElements = {}

      this.config = {
        containerClass: 'widget-container',
        upColor: 'rgba(0, 255, 0, .3)',
        downColor: 'rgba(255, 0, 0, .3)',
        borderColor: '#000',
        defaultColor: 'transparent',
        borderWidth: '1px',
        textColor: '#000',
      }
      this.setConfig(config)

      this.container = document.getElementsByClassName(this.config.containerClass)[0]

      setInterval(() => {
        this.init(this.config)
      }, 1000)
    }

    init(config) {
      // We passing it through heroku for avoiding CORS restrictions
      fetch('https://cors-anywhere.herokuapp.com/http://webrates.truefx.com/rates/connect.html?f=csv')
      .then(res => res.text())
      .then(res => {

        let addClass = ''
        if (this.container.clientWidth <= 400) {
          addClass = 'small'
        } else if (this.container.clientWidth <= 600) {
          addClass = 'medium'
        }
        this.container.className = [this.config.containerClass, addClass].join(' ')

        res.trim().split('\n').forEach(item => {
          let rate = item.split(',')
          ,   [ sign, date, bidB, bidS, askB, askS ] = rate

          rate = { sign, date, bidB, bidS, askB, askS }
          rate.date = (new Date(parseInt(rate.date))).toLocaleString()

          rate.bid = parseFloat(`${bidB}${bidS}`)
          rate.ask = parseFloat(`${askB}${askS}`)
          rate.spread = Math.round((rate.ask - rate.bid) / rate.ask * 100000) / 10

          let domElement = this.domElements[sign]
          let changableFields = ['bid', 'ask', 'spread', 'date' ]

          if (!this.domElements[sign]) {
            domElement = this.domElements[sign] = document.createElement('div', { class: 'container'})
            this.container.append(domElement)
            domElement.className = 'container'
            domElement.innerHTML = `
              <div class="sign">${rate.sign}</div>
            `
            changableFields.forEach(field => {
              let key = sign + field
              this.domElements[key] = document.createElement('div')
              this.domElements[key].className = field
              this.domElements[sign].append(this.domElements[key])
            })
          }

          changableFields.forEach(field => {
            let key = sign + field
            , old = this.domElements[key].innerHTML
            , value = rate[field]

            if (['bid', 'ask'].includes(field) && old) {
              old = parseFloat(old)
              value = parseFloat(value)
              let change
              if (!old || old == value)
                change = ''
              else
                change = old < value ? 'down' : 'up'

              this.domElements[key].className = `${field} ${change}`

            }

            if (old != value)
              this.domElements[key].innerHTML = rate[field]
          })

        })
      })
    }

    setConfig(config) {
      Object.assign(this.config, config)
      this.updateCss()
    }

    updateCss() {
      if (!this.cssContainer) {
        this.cssContainer = document.createElement('style')
        document.head.append(this.cssContainer)
      }

      this.cssContainer.innerHTML = cssTemplate.replace(/\#\{\w+\}/g, match => this.config[match.slice(2).slice(0, -1)] || '')
    }
  }

  window.ForexWidgetInstance = new ForexWidget(window.ForexWidgetConfig);
})()
