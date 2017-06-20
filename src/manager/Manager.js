/**
 * Main manager class of application. Contains all parts of jevo.js app
 * like World, Connection, Console etc... Runs infinite loop inside run()
 * method.
 *
 * Usage:
 *   import Manager from '.../Manager';
 *   const manager = new Manager();
 *   manager.run();
 *
 * @author DeadbraiN
 */
import Config    from './../global/Config';
import World     from './../visual/World';
import Organisms from './plugins/Organisms';
/**
 * {Array} Plugins for Manager
 */
const PLUGINS = [
    Organisms
];

export default class Manager {
    /**
     * Is called on every iteration in main loop. May be overridden in plugins
     * @abstract
     */
    onIteration() {}

    constructor() {
        this._world     = new World(Config.worldWidth, Config.worldHeight);
        this._positions = {};
        this._ips       = 0;
        this._plugins   = new Array(PLUGINS.length);

        this._initLoop();
        this._initPlugins();
    }

    run () {
        let counter = 1;
        let stamp   = Date.now();
        let call    = this.zeroTimeout;
        let me      = this;
        //
        // Main loop of application
        //
        function loop () {
            me.onIteration();

            counter++;
            stamp = Date.now();
            call(loop);
        }
        call(loop);
    }


    /**
     * This hacky function is obtained from here: https://dbaron.org/log/20100309-faster-timeouts
     * It runs a setTimeout() based infinite loop, but faster, then simply using native setTimeout().
     * See this article for details.
     * @return {Boolean} Initialization status. false if function has already exist
     * @private
     * @hack
     */
    _initLoop() {
        if (this.zeroTimeout) {return false;}
        //
        // Only add zeroTimeout to the Manager object, and hide everything
        // else in a closure.
        //
        (() => {
            let   callbacks = [];
            const msgName   = 'zmsg';

            window.addEventListener('message', (event) => {
                if (event.source === window && event.data === msgName) {
                    event.stopPropagation();
                    if (callbacks.length > 0) {
                        callbacks.shift()();
                    }
                }
            }, true);
            //
            // Like setTimeout, but only takes a function argument. There's
            // no time argument (always zero) and no arguments (you have to
            // use a closure).
            //
            this.zeroTimeout = (fn) => {
                callbacks.push(fn);
                window.postMessage(msgName, '*');
            };
        })();

        return true;
    }

    _initPlugins() {
        for (let i = 0; i < PLUGINS.length; i++) {
            this._plugins[i] = new PLUGINS[i](this);
        }
    }
}