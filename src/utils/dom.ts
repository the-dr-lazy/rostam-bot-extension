import { head, last } from 'rambda'
import { getIconURL, Icon } from '.'

const selectors = {
  tweet: '[data-testid="tweet"]',
}

const classes = {
  suspicious: 'o-suspicious',
  suspiciousIcon: 'o-suspicious__icon',
}

export function getCommonAncestorFromNodes(nodes: Node[]) {
  if (nodes.length < 2) {
    throw new Error('should be at least 2 nodes')
  }

  const range = document.createRange()
  range.setStart(head(nodes)!, 0)
  range.setEnd(last(nodes)!, 0)

  return range.commonAncestorContainer
}

export function getAllTweetNodes(parentNode: ParentNode = document) {
  return Array.from(parentNode.querySelectorAll(selectors.tweet))
}

export function getTweetNode(parentNode: ParentNode) {
  return parentNode.querySelector(selectors.tweet)
}

export function createSuspiciousIconElement() {
  const img = document.createElement('img')

  img.src = getIconURL(Icon.Poison)
  img.classList.add(classes.suspiciousIcon)

  return img
}

export function makeAvatarSuspicous(avatarNode: Element) {
  const parentNode = avatarNode.parentNode

  if (!parentNode) {
    return new Error(
      'Invalid avatar node: avatar node does not contain parent node'
    )
  }

  avatarNode.classList.add(classes.suspicious)
  parentNode.appendChild(createSuspiciousIconElement())
}
