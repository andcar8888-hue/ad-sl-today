const fs = require('fs');
const path = require('path');
const { adsUploadDir } = require('../middleware/upload');

/**
 * Best-effort disk delete for an ad image path (e.g. "/uploads/ads/xxx.jpg").
 * The DB is always the source of truth — failures here are logged, never
 * thrown, so a disk hiccup never blocks the request that triggered cleanup.
 *
 * @param {string} imagePath - one of an ad's stored image path strings.
 */
function deleteAdImageFile(imagePath) {
  const filePath = path.join(adsUploadDir, path.basename(imagePath));
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('[deleteAdImageFile] Failed to delete file from disk:', err);
    }
  });
}

module.exports = { deleteAdImageFile };
