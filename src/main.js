const api = require('./api.js');
const request = require('./request.js');

const { ApiResponse, DeleteResponse, ErrorResponse, FileDownloadResponse,
	FileUploadResponse, FileUrlResponse, MultiReadResponse, MultiWriteResponse, PretendResponse,
	RawApiResponse, SingleReadResponse, SingleWriteResponse } = require('./response.js');

module.exports = api;
module.exports.request = request;
module.exports.ApiResponse = ApiResponse;
module.exports.DeleteResponse = DeleteResponse;
module.exports.ErrorResponse = ErrorResponse;
module.exports.FileDownloadResponse = FileDownloadResponse;
module.exports.FileUploadResponse = FileUploadResponse;
module.exports.FileUrlResponse = FileUrlResponse;
module.exports.MultiReadResponse = MultiReadResponse;
module.exports.MultiWriteResponse = MultiWriteResponse;
module.exports.PretendResponse = PretendResponse;
module.exports.RawApiResponse = RawApiResponse;
module.exports.SingleReadResponse = SingleReadResponse;
module.exports.SingleWriteResponse = SingleWriteResponse;