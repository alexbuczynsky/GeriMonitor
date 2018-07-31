module.exports = function requiredParamsRejection(message, error) {
    if(!error) error = 'missing key for input params'
    return {
        answer: null,
        body:  message,
        error: error
    };
}