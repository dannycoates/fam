const TXP_ID = '@testpilot-addon'

function toggle(page, id) {
  if (page.isEnabled(id)) {
    page.uninstall(id)
    this.classList.remove('enabled')
  }
  else {
    page.install(id)
    this.classList.add('enabled')
  }
}

function createItem(page, x) {
  const li = document.createElement('li')
  li.textContent = x.title
  if (x.enabled) {
    li.classList.add('enabled')
  }
  li.addEventListener('click', toggle.bind(li, page, x.addon_id))
  return li
}

Promise.all([
  browser.runtime.getBackgroundPage(),
  fetch('http://localhost:8000/api/experiments.json')
    .then(res => res.json())
])
.then(([page, data]) => {
  const xs = data.results.sort((a, b) => {
    if (a.completed && b.completed) {
      return (new Date(b.completed) - new Date(a.completed)) || a.order - b.order
    }
    if (a.completed && new Date(a.completed) < new Date()) {
      return 1
    }
    if (b.completed && new Date(b.completed) < new Date()) {
      return -1
    }
    return a.order - b.order
  })
  const body = document.querySelector('body')
  const ul = document.createElement('ul')
  ul.appendChild(createItem(page, { title: 'Test Pilot', addon_id: TXP_ID, enabled: page.isEnabled(TXP_ID)}))
  for (const x of xs) {
    x.enabled = page.isEnabled(x.addon_id)
    ul.appendChild(createItem(page, x))
  }
  body.appendChild(ul)
})