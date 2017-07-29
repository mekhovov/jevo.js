/**
 * TODO: add description:
 * TODO:   - events
 * TODO:   -
 * @author DeadbraiN
 */
import Config    from './../global/Config';
import Observer  from './../global/Observer';
import Events    from './../global/Events';
import Helper    from './../global/Helper';
import Code      from './Code';

const IS_NUM = $.isNumeric;

export default class Organism extends Observer {
    /**
     * Creates organism instance. If parent parameter is set, then
     * a clone of parent organism will be created.
     * @param {String} id Unique identifier of organism
     * @param {Number} x Unique X coordinate
     * @param {Number} y Unique Y coordinate
     * @param {Boolean} alive true if organism is alive
     * @param {Object} item Reference to the Queue item, where
     * this organism is located
     * @param {Function} codeEndCb Callback, which is called at the
     * end of every code iteration.
     * @param {Object} classMap Available classes map. Maps class names into
     * classe functions
     * @param {Organism} parent Parent organism if cloning is needed
     */
    constructor(id, x, y, alive, item, codeEndCb, classMap, parent = null) {
        super();

        this._codeEndCb             = codeEndCb;
        this._classMap              = classMap;

        if (parent === null) {this._create();}
        else {this._clone(parent);}

        this._id                    = id;
        this._x                     = x;
        this._y                     = y;

        this._alive                 = alive;
        this._item                  = item;
        this._mutationProbs         = Config.orgMutationProbs;
        this._mutationClonePercent  = Config.orgCloneMutation;
        this._mutationPeriod        = Config.orgRainMutationPeriod;
        this._mutationPercent       = Config.orgRainMutationPercent;
        this._color                 = Config.orgStartColor;
        this._iterations            = 0;
        this._cloneEnergyPercent    = Config.orgCloneEnergyPercent;
        this._fnId                  = 0;
    }

    get id()                    {return this._id;}
    get x()                     {return this._x;}
    get y()                     {return this._y;}
    get alive()                 {return this._alive;}
    get item()                  {return this._item;}
    get mutationProbs()         {return this._mutationProbs;}
    get mutationPeriod()        {return this._mutationPeriod;}
    get mutationPercent()       {return this._mutationPercent;}
    get mutationClonePercent()  {return this._mutationClonePercent;}
    get adds()                  {return this._adds;}
    get changes()               {return this._changes;}
    get energy()                {return this._energy;}
    get color()                 {return this._color;}
    get mem()                   {return this._mem;}
    get cloneEnergyPercent()    {return this._cloneEnergyPercent;}
    get code()                  {return this._code;}
    get posId()                 {return Helper.posId(this._x, this._y);}
    get iterations()            {return this._iterations;}

    set x(newX)                 {this._x = newX;}
    set y(newY)                 {this._y = newY;}
    set mutationClonePercent(m) {this._mutationClonePercent = m;}
    set mutationPeriod(m)       {this._mutationPeriod = m;}
    set mutationPercent(p)      {this._mutationPercent = p;}
    set cloneEnergyPercent(p)   {this._cloneEnergyPercent = p;}
    set energy(e)               {this._energy = e;}
    set adds(a) {
        this._adds = a;
        this._updateColor();
    }
    set changes(c) {
        this._changes = c;
        this._updateColor();
    }

    /**
     * Runs one code iteration and returns
     * @return {Boolean} false means that organism was destroyed
     */
    run() {
        const fitnessCls = Config.codeFitnessCls && this._classMap[Config.codeFitnessCls];

        this._iterations++;
        if (fitnessCls) {
            if (fitnessCls.run(this)) {this.fire(Events.STOP, this)}
        } else {
            this._code.run(this);
        }

        return this._updateDestroy() && this._updateEnergy();
    }

    grabEnergy(amount) {
        if (!IS_NUM(amount)) {return true;}
        const noEnergy = (this._energy -= amount) < 1;
        noEnergy && this.destroy();
        return !noEnergy;
    }

    destroy() {
        this.fire(Events.DESTROY, this);
        this._alive     = false;
        this._energy    = 0;
        this._item      = null;
        this._mem       = null;
        this._code.destroy();
        this._code      = null;
        this._codeEndCb = null;
        this.clear();
    }

    _updateColor() {
        if ((this._color += this._adds * this._changes) > Config.ORG_MAX_COLOR) {
            this._color = Config.ORG_FIRST_COLOR;
        }
    }

    _create() {
        this._code    = new Code(this._codeEndCb.bind(this, this), this, this._classMap);
        this._energy  = Config.orgStartEnergy;
        this._mem     = [];
        this._adds    = 1;
        this._changes = 1;
    }

    _clone(parent) {
        this._code    = new Code(this._codeEndCb.bind(this, this), this, this._classMap, parent.code.vars);
        this._energy  = parent.energy;
        this._mem     = parent.mem.slice();
        this._adds    = parent.adds;
        this._changes = parent.changes;
        this._code.clone(parent.code);
    }

    /**
     * Checks if organism need to be killed/destroyed, because of age or zero energy
     * @return {Boolean} false means that organism was destroyed.
     * @private
     */
    _updateDestroy() {
        const alivePeriod = Config.orgAlivePeriod;
        const needDestroy = this._energy < 1 || alivePeriod > 0 && this._iterations >= alivePeriod;

        needDestroy && this.destroy();

        return !needDestroy;
    }

    /**
     * This is how our system grabs an energy from organism if it's age is
     * divided into Config.orgEnergySpendPeriod.
     * @return {Boolean} false means that organism was destroyed.
     * @private
     */
    _updateEnergy() {
        if (Config.orgEnergySpendPeriod === 0 || this._iterations % Config.orgEnergySpendPeriod !== 0) {return true;}
        const codeSize = this._code.size;
        let   grabSize = (((codeSize / Config.orgGarbagePeriod) + 0.5) << 1) >>> 1; // analog of Math.round(), but faster

        if (codeSize > Config.codeMaxSize) {grabSize = codeSize * Config.codeSizeCoef;}
        if (grabSize < 1) {grabSize = 1;}
        grabSize = Math.min(this._energy, grabSize);
        this.fire(Events.GRAB_ENERGY, grabSize);

        return this.grabEnergy(grabSize);
    }
}