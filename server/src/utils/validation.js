const VALID_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

/**
 * Validates glucose reading payload format & value range
 */
function validateReadingInput(body) {
  const { reading_date, slot, value } = body;

  // 1. Date presence & format
  if (!reading_date || !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
    return 'Please select a valid date (YYYY-MM-DD).';
  }

  // 2. Future date check
  // Compare date strings in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  if (reading_date > today) {
    return 'Date cannot be in the future.';
  }

  // 3. Slot validation
  if (!slot || !VALID_SLOTS.includes(slot)) {
    return `Please select a valid slot: ${VALID_SLOTS.join(', ')}.`;
  }

  // 4. Value required check
  if (value === undefined || value === null || value === '') {
    return 'Please enter a glucose value.';
  }

  // 5. Value whole number and range 40 - 600
  const numValue = Number(value);
  const isWholeNumber = Number.isInteger(numValue) && !String(value).includes('.');

  if (!isWholeNumber || numValue < 40 || numValue > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }

  return null;
}

function getSlotArticle(slot) {
  return /^[aeiou]/i.test(slot) ? 'an' : 'a';
}

module.exports = {
  VALID_SLOTS,
  validateReadingInput,
  getSlotArticle
};
