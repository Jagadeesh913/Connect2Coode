import type { AppDispatch } from '../../../app/store';
import { logoutUser } from '../redux/authSlice';
import { tokenStorage, clearAllReadableCookies } from '../../../core/security/tokenStorage';

/**
 * Key stored in sessionStorage to signal the landing page to surface
 * a confirmed 'Logged out successfully' toast on fresh load.
 */
export const LOGOUT_NOTICE_KEY = 'c2c_logout_notice';

/**
 * Production-grade application logout executor:
 * 1. Sets a transient notification flag for the landing page.
 * 2. Unconditionally purges in-memory auth tokens and active user profile.
 * 3. Sweeps all readable browser cookies across all path/domain combinations.
 * 4. Cleans any stored post-auth redirect intents.
 * 5. Dispatches the Redux logout thunk (triggering rootReducer state reset).
 * 6. Hard-replaces the browser location to '/' so all mounted components,
 *    in-flight queries, Monaco workers, and route guards unmount cleanly
 *    without race conditions or latching error states.
 */
export async function executeAppLogout(dispatch?: AppDispatch): Promise<void> {
  try {
    sessionStorage.setItem(LOGOUT_NOTICE_KEY, '1');
    sessionStorage.removeItem('post_auth_redirect');
  } catch {}

  tokenStorage.clearTokens();
  clearAllReadableCookies();

  if (dispatch) {
    try {
      await dispatch(logoutUser());
    } catch {
      // Invariant: local logout succeeds unconditionally
    }
  }

  // A hard window navigation resets the entire React runtime, clears any error states,
  // and guarantees landing cleanly on the Home page.
  window.location.replace('/');
}
