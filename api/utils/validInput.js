// @desc check user password
// @desc password valid: 6-10 chars
var checkUserPassword = (password) => {
    var regex = /^[A-Za-z\d]{6,10}$/;
    return regex.test(password);
}

// @desc check phone number
// @desc password valid: 10 digits, begin with '0'
var checkPhoneNumber = (phoneNumber) => {
    var regex = /^0[0-9]{9}$/;
    return regex.test(phoneNumber);
}

const checkNotNegativeInteger = x => {
  let parsed = parseInt(x, 10);
  if (!isNaN(parsed)) {
    if (Number.isInteger(parsed) && parsed >= 0) return true;
    return false;
  }
  return false;
}

const checkIsInteger = x => {
  let parsed = parseInt(x, 10);
  if (isNaN(parsed)) return false;
  if (Number.isInteger(parsed)) return true;
  else return false;
}

module.exports = { checkUserPassword, checkPhoneNumber, checkNotNegativeInteger, checkIsInteger};