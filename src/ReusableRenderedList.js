/* globals React, ReactDOM */
const { Component, createElement, cloneElement } = React
const { findDOMNode } = ReactDOM

export default
class ReusableRenderedList extends Component {
  static defaultProps = {
    height: '100%',
    rows: 10,
    speed: 0.8,
    bounceFactor: 0.6,
    delta: 20,
  }

  constructor(props) {
    super(props)
    this.state = { offset: 0 }
    /* dirty offset */
    this._offset = 0
    this._bottom = 0
    this._heights = []
    this._painting = false
    this._bottomInvalidated = false

    this.onKeyDown = this.onKeyDown.bind(this)
    this.onWheel = this.onWheel.bind(this)
  }

  componentDidMount() {
    console.log('didMount')
    const node = findDOMNode(this)
    // enable keyboard input route to the node
    node.tabIndex = 0
    // since React SyntheticEvent handlers are attached to document, i.e. a passive target
    // which disables preventDefault in its wheel listeners, thus we turn to a native way
    // to directly add event listeners to the target node
    node.addEventListener('wheel', this.onWheel)
    node.addEventListener('keydown', this.onKeyDown)
    this._bottom -= node.getBoundingClientRect().height
  }

  componentWillReceiveProps(nextProps) {
    const { data, height } = this.props
    const dataSourceChanged = data !== nextProps.data
    if (dataSourceChanged) {
      this._offset = 0
      this._bottom = 0
      this._heights.length = 0
      this.setState({ offset: 0 })
    }
    const heightChanged = height !== nextProps.height
    this._bottomInvalidated = dataSourceChanged || heightChanged
  }

  componentDidUpdate() {
    if (this._bottomInvalidated) {
      const node = findDOMNode(this)
      this._bottom -= node.getBoundingClientRect().height
      this._bottomInvalidated = false
    }
  }

  componentWillUnmount() {
    const node = findDOMNode(this)
    node.removeEventListener('wheel', this.onWheel)
    node.removeEventListener('keydown', this.onKeyDown)
  }

  onWheel(event) {
    event.preventDefault()
    const { deltaY } = event
    this.scroll(deltaY)
  }

  onKeyDown(event) {
    const { delta } = this.props
    const { code } = event
    if (code === 'ArrowUp') {
      event.preventDefault()
      this.scroll(-delta, false)
    } else
    if (code === 'ArrowDown') {
      event.preventDefault()
      this.scroll(+delta, false)
    }
  }

  scroll(delta, bounce = true) {
    const { speed, bounceFactor } = this.props
    const top = 0
    const bottom = this._bottom
    let offset = this._offset
    offset += delta * speed

    const stickedToTop = bottom <= top
    const reachedTop = offset < top
    const stayTop = stickedToTop || reachedTop
    if (stayTop) {
      offset = top
      if (bounce) {
        // alignment
        delta += 1
        offset += delta * bounceFactor
      }
    }
    const reachedBottom = this.maybeReachedBottom && offset > bottom
    const stayBottom = !stayTop && reachedBottom
    if (stayBottom) {
      offset = bottom
      if (bounce) {
        // alignment
        delta -= 1
        offset += delta * bounceFactor
      }
    }
    this._offset = offset

    if (this._painting) {
      return
    }
    this._painting = true

    window.requestAnimationFrame(() => {
      const offset = this._offset
      this.setState({ offset }, () => {
        this._painting = false
      })
    })
  }

  get maybeReachedBottom() {
    const { data: { length } } = this.props
    const heights = this._heights
    const lastHeightResolved = heights[length - 1]
    return lastHeightResolved
  }

  computeOffset() {
    const { data: { length } } = this.props
    const { offset } = this.state
    const heights = this._heights
    let majorOffset = 0
    let minorOffset = offset
    for (let i = 0; i < length; i++) {
      const height = heights[i]
      if (!height || minorOffset < height) {
        majorOffset = i
        break
      }
      minorOffset -= height
    }

    console.log(majorOffset, minorOffset)
    return [ majorOffset, minorOffset ]
  }

  refCallback(i) {
    const { data: { length } } = this.props
    const heights = this._heights
    if (i >= length || heights[i]) {
      return null
    }

    const resolveHeight = node => {
      if (node) {
        const rect = node.getBoundingClientRect()
        heights[i] = rect.height
        this._bottom += rect.height
        console.log('height: ', i, heights[i])
      }
    }
    return resolveHeight
  }

  renderItem(i) {
    const { data } = this.props
    const className = i % 2 === 0 ? 'even' : 'odd'
    return createElement('p', { className }, data[i])
  }

  render() {
    const [ majorOffset, minorOffset ] = this.computeOffset()
    const { data: { length }, rows, height } = this.props
    const children = []
    for (let i = majorOffset; i < rows + majorOffset; i++) {
      let item = this.renderItem(i % length)
      const key = i % rows
      const ref = this.refCallback(i)
      const hidden = i >= length
      item = cloneElement(item, { key, ref, hidden, 'data-key': key })
      children.push(item)
    }
    const transform = `translateY(${-minorOffset}px)`
    const scrollable = createElement('div', { key: 'scrollable', style: { height, transform } }, children)
    return createElement('div', { style: { height } }, scrollable)
  }
}
