import React, { Component, PropTypes } from 'react'
import { Motion, spring } from 'react-motion'
import { stratify, tree } from 'd3-hierarchy'
import { path } from 'd3-path'

const sum = (...vals) => vals.reduce((total, curr) => total + curr)
const avg = (...vals) => sum(...vals) / vals.length

function curvyLine(x1, y1, x2, y2) {
  const line = path()
  line.moveTo(x1, y1)
  line.bezierCurveTo(
    avg(x1, x2), y1,
    avg(x1, x2), y2,
    x2, y2,
  )
  return line
}

export default class SimpleTree extends Component {

  static displayName = 'SimpleTree'

  static defaultProps = {
    name: 'ROOT',
    data: [],
    id: 'id',
    parentId: 'parentId',
    label: 'name',
    defaultLabel: '(No Value)',
    width: 800,
    height: 500,
    padding: [ 20, 120, 20, 120 ]
  }

  static propTypes = {
    name: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.object),
    id: PropTypes.string,
    parentId: PropTypes.string,
    label: PropTypes.string,
    defaultLabel: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    padding: PropTypes.arrayOf(PropTypes.number)
  }

  renderLinks(dataTree) {
    return dataTree.links().map(({ source, target }) => (
      <Motion
        key={`${target.id}-link`}
        defaultStyle={{
          x1: dataTree.y,
          y1: dataTree.x,
          x2: dataTree.y,
          y2: dataTree.x,
        }}
        style={{
          x1: spring(source.y),
          y1: spring(source.x),
          x2: spring(target.y),
          y2: spring(target.x),
        }}
        children={({ x1, y1, x2, y2 }) => {
          const linkPath = curvyLine(x1, y1, x2, y2)
          return (
            <path
              d={linkPath.toString()}
              style={{
                fill: 'none',
                stroke: '#999',
                strokeOpacity: 0.4,
                strokeWidth: '1.5px',
              }}
            />
          )
        }}
      />
    ))
  }

  renderNodes(root) {
    return root.descendants().map((node) => (
      <Motion
        key={`${node.id}-node`}
        defaultStyle={{ x: root.y, y: root.x }}
        style={{ x: spring(node.y), y: spring(node.x) }}
        children={({ x, y }) => (
          <g transform={`translate(${x},${y})`}>
            <circle r={3} style={{ fill: '#555' }} />
            <text
              style={{
                font: '12px sans-serif',
                textShadow: '0 3px 0 #fff, 0 -3px 0 #fff, 3px 0 0 #fff, -3px 0 0 #fff',
                textAnchor: node.children ? 'end' : 'start',
              }}
              dy={3.5}
              x={node.children ? -8 : 8}
            >
              {node.data[this.props.label] || this.props.defaultLabel}
            </text>
          </g>
        )}
      />
    ))
  }

  getRoot() {
    const { data, id, label, parentId, name } = this.props
    if (!data.length) return null
    const newData = [
      {
        [id]: 'null',
        [label]: name,
        [parentId]: null
      },
      ...data.map((node) => {
        if (!node[parentId]) return { ...node, parentId: 'null' }
        return node
      })
    ]
    console.log(newData)
    return stratify()
      .id((node) => node[id])
      .parentId((node) => node[parentId])(newData)
      .sort((a, b) => a.height - b.height)
  }

  getTree(root) {
    const { width, height, padding: p } = this.props
    return tree().size([
      height - p[0] - p[2],
      width - p[1] - p[3],
    ])(root)
  }

  render() {
    const { width, height, padding: p } = this.props
    const root = this.getRoot()
    if (!root) return null
    const dataTree = this.getTree(root)
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
        width={width}
        height={height}
      >
        <g transform={`translate(${p[3]},${p[0]})`}>
          {this.renderLinks(dataTree)}
          {this.renderNodes(root)}
        </g>
      </svg>
    )
  }

}
