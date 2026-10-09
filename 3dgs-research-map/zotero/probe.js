JSON.stringify({
  library: Zotero.Libraries.userLibraryID,
  getAll: typeof Zotero.Items.getAll,
  getByLibrary: typeof Zotero.Collections.getByLibrary,
  addToCollection: typeof Zotero.Items.getByLibraryAndKey(1, 'FTSPHPBH').addToCollection,
  setCollections: typeof Zotero.Items.getByLibraryAndKey(1, 'FTSPHPBH').setCollections,
  fileRead: typeof Zotero.File.getContentsAsync
});
