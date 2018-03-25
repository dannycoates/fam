console.log('hello background');

const installed = new Set()
let port = null;

function handleMessage(message, sender, response) {
  console.log(message.type, message.id)
  switch (message.type) {
    case 'installed':
      return Promise.resolve(installed)
    case 'install':
      install(message.id)
      return Promise.resolve(true)
    case 'uninstall':
      uninstall(message.id)
      return Promise.resolve(true)
  }
  return Promise.reject(new Error('unknown message'))
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

function sendEvent(type, data) {
  if (port) {
    port.postMessage({type, data})
  }
}

browser.runtime.onMessage.addListener(handleMessage)

browser.runtime.onConnect.addListener(handleConnect)