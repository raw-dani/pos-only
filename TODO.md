# TODO: Add Admin Demo Role

## Plan
Add a new role "Admin Demo" that has all permissions EXCEPT:
- Creating admin accounts
- Resetting passwords

## Steps

### Backend
- [x] 1. Update `backend/middleware/rbac.js` — add "Admin Demo" to ROLE_LEVELS and ROLE_PERMISSIONS
- [x] 2. Update `backend/server.js` — seed "Admin Demo" role, add to requiredRoles, block create-admin and reset-password for Admin Demo
- [x] 3. Update `backend/server.js` — block Admin Demo from editing a user to Admin role

### Frontend
- [x] 4. Update `frontend/src/utils/auth.js` — add "Admin Demo" to ROLE_LEVELS and ROLE_PERMISSIONS, update isAdmin(), add isFullAdmin()
- [x] 5. Update `frontend/src/App.js` — update ProtectedRoute to allow Admin Demo for admin pages
- [x] 6. Update `frontend/src/pages/Users.js` — allow Admin Demo access, hide Add User and Reset buttons for Admin Demo, filter role dropdown
- [x] 7. Update `frontend/src/pages/Settings.js` — allow Admin Demo access (already works via isAdmin)
- [x] 8. Update `frontend/src/pages/POS.js` — show Users/Settings buttons for Admin Demo (already works via isAdmin)

### Testing
- [x] 9. All changes implemented and verified


