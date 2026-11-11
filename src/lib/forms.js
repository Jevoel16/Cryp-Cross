// Props for an input whose form shows `message` in the FormMessage with this id.
export function describedBy(message, id) {
  if (!message) return {};
  return { 'aria-describedby': id, ...(message.type === 'error' ? { 'aria-invalid': true } : {}) };
}
