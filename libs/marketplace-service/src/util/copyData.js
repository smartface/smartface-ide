function isFunction(value) {
    return typeof value === 'function';
}

function isObject(value) {
    return value !== null && typeof value === 'object';
}

function isArray(value) {
    return value instanceof Array;
}

function getPrototypeOf(value) {
    return value.__proto__ || value.constructor.prototype;
}

function isBlankObject(value) {
    return value !== null && typeof value === 'object' && !getPrototypeOf(value);
}

function copy(source, destination) {
    var stackSource = [];
    var stackDest = [];

    if (destination) {
        // Empty the destination object
        if (isArray(destination)) {
            destination.length = 0;
        }

        stackSource.push(source);
        stackDest.push(destination);
        return copyRecurse(source, destination);
    }

    return copyElement(source);

    function copyRecurse(source, destination) {
        var key;
        if (isArray(source)) {
            for (var i = 0, ii = source.length; i < ii; i++) {
                destination.push(copyElement(source[i]));
            }
        }
        else if (isBlankObject(source)) {
            // createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
            for (key in source) {
                destination[key] = copyElement(source[key]);
            }
        }
        else if (source && typeof source.hasOwnProperty === 'function') {
            // Slow path, which must rely on hasOwnProperty
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    destination[key] = copyElement(source[key]);
                }
            }
        }
        else {
            // Slowest path --- hasOwnProperty can't be called as a method
            for (key in source) {
                if (hasOwnProperty.call(source, key)) {
                    destination[key] = copyElement(source[key]);
                }
            }
        }
        // setHashKey(destination, h);
        return destination;
    }

    function copyElement(source) {
        // Simple values
        if (!isObject(source)) {
            return source;
        }

        // Already copied values
        var index = stackSource.indexOf(source);
        if (index !== -1) {
            return stackDest[index];
        }

        // if (isWindow(source) || isScope(source)) {
        //     throw ngMinErr('cpws',
        //         'Can\'t copy! Making copies of Window or Scope instances is not supported.');
        // }

        var needsRecurse = false;
        var destination = copyType(source);

        if (destination === undefined) {
            destination = isArray(source) ? [] : Object.create(getPrototypeOf(source));
            needsRecurse = true;
        }

        stackSource.push(source);
        stackDest.push(destination);

        return needsRecurse ?
            copyRecurse(source, destination) :
            destination;
    }

    function copyType(source) {
        switch (toString.call(source)) {
            case '[object Int8Array]':
            case '[object Int16Array]':
            case '[object Int32Array]':
            case '[object Float32Array]':
            case '[object Float64Array]':
            case '[object Uint8Array]':
            case '[object Uint8ClampedArray]':
            case '[object Uint16Array]':
            case '[object Uint32Array]':
                return new source.constructor(copyElement(source.buffer), source.byteOffset, source.length);

            case '[object ArrayBuffer]':
                // Support: IE10
                if (!source.slice) {
                    // If we're in this case we know the environment supports ArrayBuffer
                    /* eslint-disable no-undef */
                    var copied = new ArrayBuffer(source.byteLength);
                    new Uint8Array(copied).set(new Uint8Array(source));
                    /* eslint-enable */
                    return copied;
                }
                return source.slice(0);

            case '[object Boolean]':
            case '[object Number]':
            case '[object String]':
            case '[object Date]':
                return new source.constructor(source.valueOf());

            case '[object RegExp]':
                var re = new RegExp(source.source, source.toString().match(/[^/]*$/)[0]);
                re.lastIndex = source.lastIndex;
                return re;

            case '[object Blob]':
                return new source.constructor([source], {
                    type: source.type
                });
        }

        if (isFunction(source.cloneNode)) {
            return source.cloneNode(true);
        }
    }
}

module.exports = copy;
