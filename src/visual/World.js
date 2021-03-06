/**
 * 2D space, where all organisms are live. In reality this is
 * just a peace of memory, where all organisms are located. It
 * doesn't contain organisms codes, only rectangular with points.
 * It's possible to run our application only in memory. In this
 * case only this 2D world will be used (without visual
 * presentation)
 *
 * Usage:
 *   import World from '.../World';
 *   let world = new World(100, 100);
 *   world.setDot(50, 50, 0xFF00AA);
 *   world.getDot(50, 50); // 0xFF00AA
 *
 * Events:
 *   dot(x,y,color) Fires if one dot in a worlds field changed it's color
 *
 * @author DeadbraiN
 */
import Observer       from './../global/Observer';
import Helper         from './../global/Helper';
import {EVENTS}       from './../global/Events';
import {EVENT_AMOUNT} from './../global/Events';

/**
 * {Number} Amount of attempts for finding free place in a world.
 * The same like this.getDot(x, y) === 0
 */
const FREE_DOT_ATTEMPTS = 300;

export default class World extends Observer {
    static version() {
        return '1.0';
    }

    constructor (width, height) {
        super(EVENT_AMOUNT);
        this._data   = [];
        this._width  = width;
        this._height = height;

        for (let x = 0; x < width; x++) {
            this._data[x] = (new Array(height)).fill(0);
        }
    }

    destroy() {
        this.clear();
        this._data   = null;
        this._width  = 0;
        this._height = 0;
    }

    get data() {return this._data;}

    setDot(x, y, color) {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {return false;}
        this._data[x][y] = color;
        this.fire(EVENTS.DOT, x, y, color);

        return true;
    }

    getDot(x, y) {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {return false;}
        return this._data[x][y];
    }

    grabDot(x, y, amount) {
        let dot = Math.min(this.getDot(x, y), amount);

        if (dot > 0) {
            this.fire(EVENTS.DOT, x, y, (this._data[x][y] -= dot));
        }

        return dot;
    }

    getFreePos() {
        const rand   = Helper.rand;
        const width  = this._width;
        const height = this._height;
        let   i      = FREE_DOT_ATTEMPTS;
        let   x;
        let   y;

        while (this.getDot(x = rand(width), y = rand(height)) > 0 && i-- > 0) {}

        return i > 0 ? {x: x, y: y} : false
    }

    getNearFreePos(x, y) {
        const positions = [
            x + 1, y,     // right
            x + 1, y + 1, // right down
            x    , y + 1, // down
            x - 1, y + 1, // down left
            x - 1, y,     // left
            x - 1, y - 1, // left up
            x    , y - 1, // up
            x + 1, y - 1  // up right
        ];

        for (let i = 0, j = 0; i < 8; i++) {
            if (this.getDot(positions[j], positions[j + 1]) === 0) {
                return {x: positions[j], y: positions[j + 1]};
            }
            j += 2;
        }

        return false;
    }
}