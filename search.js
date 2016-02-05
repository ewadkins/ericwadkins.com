module.exports = search;

function search(string, strings, target, limit) {
    for (i = 0; i < strings.length; i++) {
        if (!strings[i].string) {
            throw new Error("All items must have a non-empty string field");
        }
    }
    
    var distances = [];
    for (i = 0; i < strings.length; i++) {
        var part = strings[i].string;
        if (part.length >= string.length) {
            part = part.slice(0, string.length);
        }
        var dist = editDistance(string, part) * 100 + Math.abs(string.length - strings[i].string.length);
        var obj = strings[i];
        obj.distance = dist;
        distances.push(obj);
    }
    distances.sort(function(a, b) {
        return a.distance < b.distance ? -1 : 1;
    });
    
    var resultSet = {};
    limit = limit || distances.length;
    
    var results = [];
    i = 0;
    while (results.length < limit && i < distances.length) {
        if (!resultSet[distances[i][target]]) {
            var obj = distances[i];
            delete obj.distance;
            results.push(obj);
            resultSet[distances[i][target]] = true;
        }
        i++;
    }
    return results;
}

function editDistance(string1, string2) {
    if (string1 === string2) {
        return 0;
    }
    var d = [];
    for (var i = 0; i < string1.length; i++) {
        d.push(new Array(string2.length));
    }

    for (i = 0; i < string1.length; i++) {
        d[i][0] = i;
    }
    for (i = 0; i < string2.length; i++) {
        d[0][i] = i;
    }

    for (i = 1; i < string1.length; i++) {
        for (var j = 1; j < string2.length; j++) {
            if (string1[i].toLowerCase() === string2[j].toLowerCase()) {
                d[i][j] = d[i-1][j-1];
            }
            else {
                d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + 1);
            }
        }
    }
    return d[string1.length - 1][string2.length - 1] + 1;
}