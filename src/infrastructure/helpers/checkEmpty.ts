export function checkEmpty(string: string): boolean {
    if (string.trim().length === 0) {
        return false;
    } else {
        return true;
    }
}
