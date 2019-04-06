"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_promise_router_1 = __importDefault(require("express-promise-router"));
const controllers_1 = __importDefault(require("../controllers"));
const router = express_promise_router_1.default();
router.get('/health', controllers_1.default.health);
exports.default = router;
//# sourceMappingURL=index.js.map