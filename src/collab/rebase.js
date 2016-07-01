// : (Transform, [Step], [Step], [Step]) → number
// Undo a given set of steps, apply a set of other steps, and then
// redo them.
function rebaseSteps(transform, steps, inverted, inside) {
  for (let i = inverted.length - 1; i >= 0; i--) transform.step(inverted[i])
  for (let i = 0; i < inside.length; i++) transform.step(inside[i])
  for (let i = 0, mapFrom = inverted.length; i < steps.length; i++) {
    let mapped = steps[i].map(transform.mapping.slice(mapFrom))
    mapFrom--
    if (mapped && !transform.maybeStep(mapped).failed)
      transform.mapping.setMirror(mapFrom, transform.steps.length - 1)
  }
  return inverted.length + inside.length
}
exports.rebaseSteps = rebaseSteps
