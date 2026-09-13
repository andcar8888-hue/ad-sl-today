/**
 * Computes the expiry timestamp for a durationDays-limited AdLevel, or null
 * if the level has no time-limited boost (durationDays unset/null).
 * Used by both `approveAd` and `updateAdAdmin` in adController.js so an
 * ad's boosted-visibility expiry is always computed the same way.
 *
 * @param {{ durationDays?: number|null }|null|undefined} adLevelDoc
 * @returns {Date|null}
 */
function computeExpiresAt(adLevelDoc) {
  if (!adLevelDoc?.durationDays) return null;
  return new Date(Date.now() + adLevelDoc.durationDays * 24 * 60 * 60 * 1000);
}

/**
 * Determines whether an ad's boost should currently be treated as "active"
 * for public sort/display purposes. An ad only counts as boosted if its
 * AdLevel has a positive `priority` AND, for time-limited levels, its
 * `expiresAt` has not yet passed. Never key this off a level's *name* —
 * AdLevels are fully admin-configurable.
 *
 * @param {{ adLevel?: { durationDays?: number|null, priority?: number }|null, expiresAt?: Date|string|null }} ad
 * @returns {boolean}
 */
function isBoostActive(ad) {
  if (!ad.adLevel) return false;
  if (ad.adLevel.durationDays && ad.expiresAt && new Date(ad.expiresAt) < new Date()) {
    return false; // time-limited boost has expired — demoted back to normal-tier sorting/display
  }
  return (ad.adLevel.priority || 0) > 0;
}

module.exports = { computeExpiresAt, isBoostActive };
