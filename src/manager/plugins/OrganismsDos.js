/**
 * Plugin for Manager module, which handles organisms population in
 * nature simulation mode. It's related to DOS language.
 *
 * Events od Manager:
 *   TODO:
 *   ORGANISM(org) Fires after one organism has processed
 *
 * Depends on:
 *   manager/Manager
 *
 * @author DeadbraiN
 */
import Organisms from './../../manager/plugins/base/Organisms';
import {EVENTS}  from './../../global/Events';
import Helper    from './../../global/Helper';

const EMPTY     = 0;
const ENERGY    = 1;
const ORGANISM  = 2;

export default class OrganismsDos extends Organisms {
    static version() {
        return '1.0';
    }

    constructor(manager) {
        super(manager);

        this._positions     = {};
        this._onAfterMoveCb = this._onAfterMove.bind(this);

        Helper.override(manager, 'onAfterMove', this._onAfterMoveCb);
    }

    destroy() {
        super.destroy();
        Helper.unoverride(man, 'onAfterMove', this._onAfterMoveCb);
        this._positions     = null;
        this._onAfterMoveCb = null;
    }

    /**
     * Compares two organisms and returns more fit one
     * @param {Organism} org1
     * @param {Organism} org2
     * @return {Organism}
     * @override
     */
    compare(org1, org2) {
        return org1.fitness() > org2.fitness();
    }

    /**
     * Is called before cloning of organism
     * @param {Organism} org
     * @override
     */
    onBeforeClone(org) {
        return org.energy > 0;
    }

    /**
     * Is called after cloning of organism
     * @param {Organism} org Parent organism
     * @param {Organism} child Child organism
     * @override
     */
    onClone(org, child) {
        let energy = (((org.energy * org.cloneEnergyPercent) + 0.5) << 1) >>> 1; // analog of Math.round()
        org.grabEnergy(energy);
        child.grabEnergy(child.energy - energy);
    }

    addOrgHandlers(org) {
        super.addOrgHandlers(org);
        org.on(EVENTS.GET_ENERGY, this._onGetEnergy.bind(this));
        org.on(EVENTS.EAT, this._onEat.bind(this));
        org.on(EVENTS.STEP, this._onStep.bind(this));
        org.on(EVENTS.CHECK_AT, this._onCheckAt.bind(this));
    }

    /**
     * Is called after organism has created
     * @param {Organism} org
     * @override
     */
    onAfterCreateOrg(org) {
        this._positions[org.posId] = org;
    }

    /**
     * Is called after organism has killed
     * @param {Organism} org Killed organism
     * @override
     */
    onAfterKillOrg(org) {
        delete this._positions[org.posId];
    }

    _onAfterMove(x1, y1, x2, y2, org) {
        if (x1 !== x2 || y1 !== y2) {
            delete this._positions[Helper.posId(x1, y1)];
            this._positions[Helper.posId(x2, y2)] = org;
        }

        return true;
    }

    _onGetEnergy(org, x, y, ret) {
        if (x < 0 || y < 0 || !Number.isInteger(x) || !Number.isInteger(y)) {return;}
        const posId = Helper.posId(x, y);

        if (typeof(this._positions[posId]) === 'undefined') {
            ret.ret = this.manager.world.getDot(x, y)
        } else {
            ret.ret = this._positions[posId].energy;
        }
    }

    _onEat(org, x, y, ret) {
        const world = this.manager.world;
        const positions = this._positions;

        [x, y] = Helper.normalize(x, y);

        const posId = Helper.posId(x, y);
        if (typeof(positions[posId]) === 'undefined') {
            ret.ret = world.grabDot(x, y, ret.ret);
        } else {
            ret.ret = ret.ret < 0 ? 0 : (ret.ret > positions[posId].energy ? positions[posId].energy : ret.ret);
            positions[posId].grabEnergy(ret.ret);
        }
    }

    _onStep(org, x1, y1, x2, y2, ret) {
        if (org.alive) {
            ret.ret = +this.manager.move(x1, y1, x2, y2, org);
        }
    }

    _onCheckAt(x, y, ret) {
        [x, y] = Helper.normalize(x, y);
        if (typeof(this._positions[Helper.posId(x, y)]) === 'undefined') {
            ret.ret = this.manager.world.getDot(x, y) > 0 ? ENERGY : EMPTY;
        } else {
            ret.ret = ORGANISM;
        }
    }

}