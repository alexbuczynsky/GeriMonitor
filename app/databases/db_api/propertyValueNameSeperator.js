module.exports = function propertyValueNameSeperator(object) {
    delete object.parentDevice
    let propertyNames = Object.keys(object);
    let propertyVals = [];
    //propertyNames.forEach((name,i) => propertyVals.push(object[name]))
    propertyNames.forEach((name, i) => {
        if (name != "parentDevice") {
            propertyVals.push(object[name])
        }
    })
    return {
        'propertyNames': propertyNames,
        'propertyValues': propertyVals
    }
}