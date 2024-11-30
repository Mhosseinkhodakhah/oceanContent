"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = __importDefault(require("./services"));
const responseService_1 = require("./service/responseService");
const content_1 = __importDefault(require("./DB/models/content"));
const connection_1 = __importDefault(require("./interservice/connection"));
const services = new services_1.default();
const connection = new connection_1.default();
class contentController {
    seenContent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield content_1.default.findByIdAndUpdate(req.params.contentId, { $addToSet: { seen: req.user.id } });
            yield services.checkSeen(content === null || content === void 0 ? void 0 : content.subLesson, req.user.id);
            yield connection.resetCache();
            return next(new responseService_1.response(req, res, 'seen content', 200, null, 'content seen by user!'));
        });
    }
}
exports.default = contentController;
