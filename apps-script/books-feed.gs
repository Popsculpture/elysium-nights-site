// Elysium Nights books feed for playelysiumnights.com.
// Reads each PDF's last-updated date, edition and size from Drive, so the site's book lines stay current.
// Deploy: Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
// Then paste the /exec URL into BOOKS_FEED_URL in app.js.
// Upload new PDFs with Manage versions so these IDs never change.
// Edition comes from the file's Drive description (for example "2B"). Leave it blank and the site keeps its typed edition.
// The date is when the PDF itself last changed, read from its newest Drive version. Editing the description doesn't move it.
// That needs the Drive API advanced service: Services > Drive API > Add. Without it the date falls back to Drive's last-updated.

const BOOK_IDS = [
  '1WEcqaKJwGbDxiKOOQobW4b7CWUzFVkXg', // EN1001 Player's Handbook
  '15bD1eus9v84poy0Y7N4RXRUj8v3COMwo', // EN1002 Game Master's Toolkit
  '1DhPA6a_hmHvtRKBWhNzoESkb7RKO85FT', // EN1003 Quick-Start Rules
];
const TIME_ZONE = 'America/Phoenix';
const CACHE_SECONDS = 300;

function doGet() {
  const cache = CacheService.getScriptCache();
  let body = cache.get('books');
  if (!body) {
    body = JSON.stringify({books: BOOK_IDS.map(readBook)});
    cache.put('books', body, CACHE_SECONDS);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function readBook(id) {
  const file = DriveApp.getFileById(id);
  const updated = contentUpdated(id) || file.getLastUpdated();
  return {
    id: id,
    updated: updated.toISOString(),
    updatedLabel: Utilities.formatDate(updated, TIME_ZONE, 'MMMM d, yyyy'),
    edition: (file.getDescription() || '').trim(),
    bytes: file.getSize(),
  };
}

function contentUpdated(id) {
  try {
    const head = Drive.Files.get(id, {fields: 'headRevisionId'}).headRevisionId;
    const revision = Drive.Revisions.get(id, head);
    const date = new Date(revision.modifiedTime || revision.modifiedDate);
    return isNaN(date) ? null : date;
  } catch (error) {
    return null;
  }
}

// Run this once from the editor to check the output before deploying.
function testFeed() {
  Logger.log(JSON.stringify({books: BOOK_IDS.map(readBook)}, null, 2));
}
