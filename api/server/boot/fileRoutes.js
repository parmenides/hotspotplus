/**
 * Created by payamyousefi on 5/11/15.
 */
const config = require('../modules/config');
const logger = require('../modules/logger');
const log = logger.createLogger();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  storage: function(req, file, cb) {
    cb(null, './uploads');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({storage: storage});

module.exports = function(app) {
  const router = app.loopback.Router();

  router.get('/api/file/download/:fileId', function(req, res) {
    const File = app.models.FileStorage;
    const fileId = req.params.fileId;
    File.readFile(fileId)
      .then(function(result) {
        const fileName = result.name;
        const fileData = result.contentBuffer;
        /* var size = result.size; */
        const mimeType = result.mimeType;
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': fileData.length,
          'Content-Disposition': 'attachment; filename=' + fileName,
        });
        res.write(fileData);
        res.end();
      })
      .fail(function(error) {
        return res.status(500).json({error: error});
      });
  });

  router.post('/api/file/upload', upload.any(), function(req, res) {
    const File = app.models.FileStorage;
    const file = req.files[0];
    const mimetype = file.mimetype;
    const filename = file.filename;
    const size = file.size;
    const businessId = req.body.businessId;

    File.addFile(businessId, file.path, mimetype, filename, size)
      .then(function(fileId) {
        return res.status(200).json({fileId: fileId});
      })
      .fail(function(error) {
        return res.status(500).json({error: error});
      });
  });

  app.use(router);
};
