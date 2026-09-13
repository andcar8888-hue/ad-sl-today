// Kept as a thin re-export so every existing
// `const isAdmin = require('../middleware/isAdmin')` import keeps working
// unchanged, and keeps meaning EXACTLY what it always meant — `role ===
// 'admin'`, i.e. the top of the role hierarchy, unaffected by the
// introduction of the `moderator`/`admin_assistant` tiers in
// `./roles.js`. New code should generally import `isAdmin`/`isManager`/
// `isModerator` directly from `./roles` instead.
module.exports = require('./roles').isAdmin;
