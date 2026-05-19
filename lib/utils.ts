export function containsSpecialChars(str: string) {
    if (str.length == 0) {
        return false
    }


    return !/^[a-zA-Z0-9_]+$/.test(str) 
}

