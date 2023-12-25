"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronHelper = void 0;
const cron_1 = require("cron");
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const helpers_1 = require("../helpers");
const utilities_1 = require("../utilities");
// --------------------------------------------------------
class CronHelper {
    constructor(opts) {
        this.logger = helpers_1.LoggerFactory.getLogger([CronHelper.name]);
        const { cronTime, onTick, onCompleted, autoStart = false } = opts;
        this.cronTime = cronTime;
        this.onTick = onTick;
        this.onCompleted = onCompleted;
        this.autoStart = autoStart !== null && autoStart !== void 0 ? autoStart : false;
        this.configure();
    }
    configure() {
        if (!this.cronTime || (0, isEmpty_1.default)(this.cronTime)) {
            throw (0, utilities_1.getError)({
                message: '[CronHelper][configure] Invalid cronTime to configure application cron!',
            });
        }
        this.instance = new cron_1.CronJob(this.cronTime, () => {
            var _a;
            (_a = this.onTick) === null || _a === void 0 ? void 0 : _a.call(this);
        }, () => {
            var _a;
            (_a = this.onCompleted) === null || _a === void 0 ? void 0 : _a.call(this);
        }, this.autoStart);
    }
    start() {
        if (!this.instance) {
            this.logger.error('[CronHelper][start] Invalid cron instance to start cronjob!');
            return;
        }
        this.instance.start();
    }
}
exports.CronHelper = CronHelper;
//# sourceMappingURL=cron.helper.js.map