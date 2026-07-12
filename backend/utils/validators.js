// Centralized validators. Every check returns a specific, human-readable
// message rather than a generic "invalid input" — per the team's judging notes.

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && re.test(email);
}

function validateSignupInput({ name, email, password }) {
  if (!name || name.trim().length < 2) {
    return 'Name must be at least 2 characters long.';
  }
  if (!isValidEmail(email)) {
    return 'Entered email is invalid.';
  }
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null; // no error
}

function validateBookingTimes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start) || isNaN(end)) {
    return 'Start and end time must be valid dates.';
  }
  if (start >= end) {
    return 'End time must be after start time.';
  }
  if (start < new Date()) {
    return 'You cannot book a slot in the past.';
  }
  return null;
}

module.exports = { isValidEmail, validateSignupInput, validateBookingTimes };
