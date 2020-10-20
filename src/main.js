import ReusableRenderedList from './ReusableRenderedList.js'

/* globals React, ReactDOM */
const { createElement } = React
const { render } = ReactDOM

const data = Array(100).fill(0).map((_, i) => `Row ${i}`)
const rows = 12
const list = createElement(ReusableRenderedList, { data, rows })
const container = document.getElementById('container')
render(list, container)
// setTimeout(() => {
//   const data_ = data.slice(0, 2)
//   const list = createElement(ReusableRenderedList, { data: data_, rows })
//   render(list, container)
// }, 3 * 1000)

const cleanPage = () => {
  // since document.scripts is a live HTMLCollection, thus better not
  // manipulate it during interation
  const { scripts } = document
  for (let i = scripts.length - 1; i >= 0; i--) {
    const script = scripts[i]
    console.log(script)
    script.remove()
  }
}
window.onload = cleanPage
