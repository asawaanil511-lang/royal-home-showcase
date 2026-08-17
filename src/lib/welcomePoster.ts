const WELCOME_POSTER_PENDING_KEY = "rs_welcome_poster_pending";

export const markWelcomePosterPending = () => {
  try {
    sessionStorage.setItem(WELCOME_POSTER_PENDING_KEY, "1");
  } catch {
    // Storage can be unavailable in private browsing; the login still succeeds.
  }
};

export const takeWelcomePosterPending = () => {
  try {
    const pending = sessionStorage.getItem(WELCOME_POSTER_PENDING_KEY) === "1";
    if (pending) sessionStorage.removeItem(WELCOME_POSTER_PENDING_KEY);
    return pending;
  } catch {
    return false;
  }
};