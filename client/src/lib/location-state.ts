/** Navigation state of the gallery's card links: the previous history entry is the gallery. */
export const FROM_GALLERY_STATE = { fromGallery: true } as const;

/** Whether `location.state` says the user got here from the gallery (so Back returns to it). */
export function cameFromGallery(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    'fromGallery' in state &&
    state.fromGallery === true
  );
}
