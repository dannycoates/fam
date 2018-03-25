console.log('hello background');

const installed = new Set()
let port = null;
let borked = false;

function handleMessage(message, sender, response) {
  console.log(message.type, message.id)
  if (message.type === 'installed') {
    return Promise.resolve(installed)
  }
  if (!borked) {
    switch (message.type) {
      case 'install':
        install(message.id)
        return Promise.resolve(true)
      case 'uninstall':
        uninstall(message.id)
        return Promise.resolve(true)
    }
  }
  borked = false;
  return Promise.reject()
}

function handleConnect(p) {
  port = p
}

function install(id) {
  installed.add(id)
  sendEvent('onInstalled', { id })
  sendEvent('onEnabled', { id })
}

function uninstall(id) {
  installed.delete(id)
  sendEvent('onUninstalled', { id })
}

function isEnabled(id) {
  return installed.has(id)
}

function bork() {
  borked = true
}

function sendEvent(type, data) {
  if (port) {
    port.postMessage({type, data})
  }
}

browser.runtime.onMessage.addListener(handleMessage)

browser.runtime.onConnect.addListener(handleConnect)