/**
 * Determines whether the user's guess is valid,
 * based on any of the rules programmed here.
 * 
 * Rules are in two parts. For each, ensure the rule applied to the original code (q),
 * AND ensure the user's attempt (a) satisfies the augmentation requirements of the rule.
 * 
 * @param {String} q the code displayed to the user
 * @param {String} a the user's attempt at the answer
 * @returns 
 */
function check(q, a)
  {
    // First and last digit are equal, swap the middle two
    if (q.charAt(0) === q.charAt(3) && a.charAt(0) === a.charAt(3)
    &&  a.charAt(0) === q.charAt(0) && a.charAt(3) === q.charAt(3)
    && a.charAt(1) === q.charAt(2) && a.charAt(2) === q.charAt(1)) return true;

    // All numbers are even, reverse the code
    if (areAllDigitsEven(q) && q === a.split('').reverse().join('') === q) return true;

    // If all but one numbers are odd, the code is 1234
    if (countOddDigits(q) === 3 && a === "1234") return true





    /**
     * Add all rules above this line. 
     * Add the default case below
     */


    // If no rules apply, the code is 0000
    if (a === "0000") return true
    return false
        
        
  }


  /**
   * Create helper functions below this line to simplify check function
   */


  function countOddDigits(str) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      // Check if the character is a digit and if it's odd
      if (!isNaN(parseInt(char)) && parseInt(char) % 2 !== 0) {
        count++; // Increment count if the digit is odd
      }
    }
    return count;
  }

  function areAllDigitsEven(str) {
    // Loop through each character in the string
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      // Check if the character is a digit and if it's even
      if (!isNaN(parseInt(char)) && parseInt(char) % 2 !== 0) {
        return false; // Return false if any digit is not even
      }
    }
    return true; // Return true if all digits are even
  }

  module.exports = check;