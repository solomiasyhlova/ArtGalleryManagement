# Gallery - Add, Edit & Delete Artworks (admin)

## Overview

Give admins, from the gallery, the "Add New Artwork" modal, editing in the same form, and deletion with confirmation. Regular users never see these controls.

## Requirements

### `ArtworkFormDialog` (create and edit modes)

- shadcn `Dialog`, titled "Add New Artwork" / "Edit Artwork"
- Fields:
  - Title, Artist
  - Type (`Select`)
  - Price (number input with a `$` prefix, step 0.01)
  - Availability (`Switch` with the helper text "For sale" / "Exhibition only")
  - Image URL (optional, with a live thumbnail preview once the URL is valid)
- React Hook Form + `zodResolver(artworkInputSchema)`. Validates on blur and on submit, with errors under each field
- Edit mode is pre-filled. The form resets every time the dialog opens
- While pending, the submit button is disabled and shows a spinner. The dialog closes on success
- 400 `details` → `setError` per field. Other errors → a toast

### `DeleteArtworkDialog`

- shadcn `AlertDialog`: `Delete "{title}"? This cannot be undone.`
- Destructive confirm button with a pending state

### Mutations (`useArtworkMutations`)

- `createArtwork`, `updateArtwork`, `deleteArtwork`
- On success: invalidate `['artworks']` (and `['artwork', id]`), then toast "Artwork added" / "Artwork updated" / "Artwork deleted"
- 403 → toast "You don't have permission"
- 404 on edit or delete → toast "This artwork no longer exists", then invalidate the list

### Gallery integration (admin only, `isAdmin`)

- "Add New Artwork" primary button in the toolbar slot
- Kebab menu (Edit / Delete) at the top right of each card's image

## Files to Create

1. `client/src/components/artworks/ArtworkForm.tsx` - fields only, reused by the dialog
2. `client/src/components/artworks/ArtworkFormDialog.tsx`
3. `client/src/components/artworks/DeleteArtworkDialog.tsx`
4. `client/src/components/artworks/ArtworkCardMenu.tsx`
5. `client/src/hooks/useArtworkMutations.ts`
6. `client/src/lib/apply-server-errors.ts` + test - 400 `details` → `setError`

## Files to Modify

- `client/src/components/artworks/ArtworkToolbar.tsx` - Add button
- `client/src/components/artworks/ArtworkCard.tsx` - menu
- `client/src/pages/GalleryPage.tsx` - dialog state

## Key Gotchas

Use Context7 to verify the newest config and conventions.

- Register price with `valueAsNumber: true`. An empty field becomes `NaN`, so set the schema message to read "Price is required" instead of a raw type error
- Schemas with `.default()` or transforms have different input and output types. Type the form as `useForm<z.input<typeof artworkInputSchema>, unknown, z.output<typeof artworkInputSchema>>`
- Don't nest the kebab menu inside the card's `<Link>`: interactive elements inside `<a>` are invalid HTML, and clicking would navigate. Render the menu as an absolutely positioned sibling
- Opening a Dialog from a DropdownMenu item can leave `pointer-events: none` on `body`. Keep the dialog state outside the menu and open it from `onSelect`, after the menu has closed
- `isAdmin` only hides the UI; the API returns 403 regardless

## Testing

1. As a user: no Add button and no card menus
2. As admin, click Add New Artwork and submit it empty → errors under Title, Artist, Type and Price
3. A 100-character title → error. A price of `0` or `-5` → error
4. A valid artwork with an image URL → the preview shows, the dialog closes, a toast appears, and the new card shows without a reload
5. Edit from the card menu → the fields are pre-filled. Change the price → the card updates
6. Open Add after Edit → the form is empty, so reset works
7. Delete → the confirmation shows the title → the card disappears and a toast appears
8. Reload → all changes persisted
9. Keyboard only: open the menu, edit, submit and delete. Focus returns sensibly and Esc closes dialogs
10. `npm test` passes

## References

- shadcn Dialog: https://ui.shadcn.com/docs/components/dialog
- shadcn Alert Dialog: https://ui.shadcn.com/docs/components/alert-dialog
- React Hook Form `setError`: https://react-hook-form.com/docs/useform/seterror
- TanStack Query invalidation from mutations: https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations
