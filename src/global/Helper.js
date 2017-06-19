/**
 * Global helper class
 *
 * @author DeadbraiN
 */
export default class Helper {
    /**
     * Generates random Int number in range 0:n-1
     * @param {Number} n Right number value in a range
     * @return {Number}
     */
    static rand(n) {return Math.trunc(Math.random() * n);}
    /**
     * It calculates probability index from variable amount of components.
     * Let's imagine we have two actions: one and two. We want
     * these actions to be called randomly, but with different probabilities.
     * For example it may be [3,2]. It means that one should be called
     * in half cases, two in 1/3 cases. Probabilities should be greater then -1.
     * @param {Array} probs Probabilities array. e.g.: [3,2] or [1,3]
     * @return {Number} -1 Means that index is invalid
     */
    static probIndex(probs) {
        let len = probs.length;
        if (len < 1) {return -1;}
        let sum = probs.reduce((a, b) => a + b, 0);
        if (sum < 1) {return -1;}
        let num = Helper.rand(sum) + 1;
        let i;
        //
        // This is small optimization trick. if random number in
        // a left part of all numbers sum, the we have to go to it from
        // left to right, if not - then from right to left. Otherwise,
        // going every time from left to right will be a little bit
        // slower then this approach.
        //
        if (num < sum / 2) {
            sum = 0;
            for (i = 0; i < len; i++)  {if (num <= (sum += probs[i])) break;}
        } else {
            for (i = len-1; i>-1; i--) {if (num >  (sum -= probs[i])) break;}
        }

        return i;
    }
    /**
     * Checks if position is empty. x == y == 0 - this is empty
     * @param {Object} pos Position to check
     */
    static empty(pos) {return pos.x === pos.y === 0;}
    /**
     * Saves custom data into the file. If file exists, it will
     * be overrided. It's only rewrites existing file and not
     * append it. It also doesn't work with native types, in sense
     * that you can't save native values into the file without *
     * meta information. For example, you can't store ascii string
     * in a file without special prefic before it.
     * @param {Object} data Data to save
     * @param {String} file File name/Key name
     * TODO: FileApi should be used
     */
    static save(data, file = "backup.data") {
        localStorage[file] = JSON.stringify(data);
    }
   /**
    * Loads custom data from the file
    * @param file File name
    * @return {Object} loading result or nothing
    * TODO: FileApi should be used
    */
    static load(file = "backup.data") {
        return JSON.parse(localStorage[file]);
    }
}