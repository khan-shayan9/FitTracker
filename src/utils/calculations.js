/**
 * Calculate the total weight change (current - starting)
 * @param {number} current - Current weight in kg
 * @param {number} starting - Starting weight in kg
 * @returns {number} Weight change (positive = gained, negative = lost)
 */
export function calcWeightChange(current, starting) {
  return parseFloat((current - starting).toFixed(1))
}

/**
 * Calculate weight change as a percentage
 * @param {number} current - Current weight in kg
 * @param {number} starting - Starting weight in kg
 * @returns {number} Percentage change
 */
export function calcWeightChangePercent(current, starting) {
  if (!starting || starting === 0) return 0
  return parseFloat((((current - starting) / starting) * 100).toFixed(1))
}

/**
 * Get the color for weight change based on goal
 * Fat Loss: green if lost weight (negative change), red if gained
 * Muscle Gain: green if gained weight (positive change), red if lost
 * @param {number} change - Weight change value
 * @param {string} goal - 'fat_loss' or 'muscle_gain'
 * @returns {string} CSS color variable name
 */
export function getWeightColor(change, goal) {
  if (change === 0) return 'var(--color-gray)'

  if (goal === 'fat_loss') {
    return change < 0 ? 'var(--color-green)' : 'var(--color-red)'
  } else {
    // muscle_gain
    return change > 0 ? 'var(--color-green)' : 'var(--color-red)'
  }
}

/**
 * Determine if progress is "positive" for the progress bar
 * (green direction based on goal)
 * @param {number} change - Weight change value
 * @param {string} goal - 'fat_loss' or 'muscle_gain'
 * @returns {boolean}
 */
export function isPositiveProgress(change, goal) {
  if (goal === 'fat_loss') return change <= 0
  return change >= 0
}

/**
 * Calculate days active since joining
 * @param {string} joinDate - Join date string (YYYY-MM-DD)
 * @returns {number} Number of days
 */
export function calcDaysActive(joinDate) {
  if (!joinDate) return 0
  const join = new Date(joinDate)
  const today = new Date()
  const diff = today - join
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Calculate the change between two measurement values
 * @param {number} current - Current measurement
 * @param {number} previous - Previous measurement
 * @returns {string} Formatted change string like "+2.0" or "-1.5"
 */
export function calcMeasurementChange(current, previous) {
  if (previous === null || previous === undefined) return null
  const change = parseFloat((current - previous).toFixed(1))
  if (change > 0) return `+${change}`
  if (change < 0) return `${change}`
  return '0'
}

/**
 * Get color for measurement change
 * Green for positive, Red for negative, Gray for zero
 * @param {number} current
 * @param {number} previous
 * @returns {string}
 */
export function getMeasurementColor(current, previous) {
  if (previous === null || previous === undefined) return 'var(--color-gray)'
  const change = current - previous
  if (change > 0) return 'var(--color-green)'
  if (change < 0) return 'var(--color-red)'
  return 'var(--color-gray)'
}

/**
 * Format a goal enum into display text
 * @param {string} goal - 'fat_loss' or 'muscle_gain'
 * @returns {string} 'Fat Loss' or 'Muscle Gain'
 */
export function formatGoal(goal) {
  if (goal === 'fat_loss') return 'Fat Loss'
  if (goal === 'muscle_gain') return 'Muscle Gain'
  return goal
}

/**
 * Format a date string for display
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date like "Jan 15, 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Generate a random password of given length
 * @param {number} length - Password length (default 8)
 * @returns {string} Random password
 */
export function generatePassword(length = 8) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Generate a username from a full name (firstname.lastname)
 * @param {string} name - Full name
 * @returns {string} Username like "john.doe"
 */
export function generateUsername(name) {
  const parts = name.trim().toLowerCase().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]}.${parts[parts.length - 1]}`
}
