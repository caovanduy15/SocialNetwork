// @desc check user password
// @desc password valid: 6-10 chars
var checkUserPassword = (password) => {
    var regex = /^[A-Za-z\d@$!%*#?&]{6,10}$/;
    return regex.test(password);
}

// @desc check phone number
// @desc password valid: 10 digits, begin with '0'
var checkPhoneNumber = (phoneNumber) => {
    var regex = /^0[0-9]{9}$/;
    return regex.test(phoneNumber);
}

module.exports = { checkUserPassword, checkPhoneNumber};