const TESTPILOT_ADDON_ID = "@testpilot-addon";
console.log('hello testpilot!')

function getExperiments() {
  return window.wrappedJSObject.fetch('http://localhost:8000/api/experiments.json')
    .then(exportFunction(function (res) {
      return res.json()
    }, window))
}

const P = window.wrappedJSObject.Promise;

const listeners = {}

const fam = {
  createInstall(options) {
    const url = options.url
    if (/\/static\/addon\/addon\.xpi$/.test(url)) {
      return P.resolve(cloneInto(fakeAddon(TESTPILOT_ADDON_ID), window, {cloneFunctions: true}))
    }
    return getExperiments()
      .then(
        exportFunction(
          function (xs) {
            const x = xs.results.filter(x => x.xpi_url === url)[0]
            if (x) {
              return cloneInto(fakeAddon(x.addon_id), window, {cloneFunctions: true})
            }
            throw new Error(`unknown experiment url (${url})`)
          },
          window
        )
      )
  },

  getAddonByID(id) {
    return new P(exportFunction(
      function (resolve, reject) {
        browser.runtime.sendMessage({ type: 'installed' })
        .then(
          function (installed) {
            if (installed.has(id)) {
              return resolve(cloneInto(fakeAddon(id), window, {cloneFunctions: true}))
            }
            return resolve(null);
          },
          reject
        )
      },
      window
    ))
  },

  addEventListener(name, fn) {
    listeners[name] = fn
  }
}

function fakeAddon(id) {
  return {
    install: function () {
      return new P(exportFunction(
        function (resolve, reject) {
          return browser.runtime.sendMessage({type: 'install', id})
            .then(resolve, reject)
        },
        window
      ))
    },
    uninstall: function () {
      return new P(exportFunction(
        function (resolve, reject) {
          return browser.runtime.sendMessage({type: 'uninstall', id})
            .then(resolve, reject)
        },
        window
      ))
    },
    isEnabled: true,
    id
  }
}

function handleMessage(message, sender, response) {
  const fn = listeners[message.type]
  if (fn) {
    fn(cloneInto(message.data, window))
  }
}

const port = browser.runtime.connect()
port.onMessage.addListener(handleMessage)

if (typeof navigator.mozAddonManager === 'undefined') {
  navigator.wrappedJSObject.mozAddonManager = cloneInto(fam, navigator, {cloneFunctions: true})
}