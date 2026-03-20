const STEP = 1000

export function getNewPosition(
  items: { position: number }[],
  destinationIndex: number
): number {
  if (items.length === 0) return STEP

  if (destinationIndex === 0) {
    return items[0].position / 2
  }

  if (destinationIndex >= items.length) {
    return items[items.length - 1].position + STEP
  }

  const before = items[destinationIndex - 1].position
  const after = items[destinationIndex].position
  return (before + after) / 2
}

export function rebalancePositions<T extends { position: number }>(items: T[]): T[] {
  return items.map((item, index) => ({
    ...item,
    position: (index + 1) * STEP,
  }))
}
