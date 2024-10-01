'use strict';

const express = require('express');
const router = express.Router();

const handlers = require('../handlers/handler');

router.post('/labels/', handlers.registerlabel);
router.get ('/labels/', handlers.checklabel);
router.post('/projects/', handlers.registerproject);
router.get ('/projects/', handlers.checkproject);
router.post('/people/', handlers.registerperson);
router.get ('/people/', handlers.checkperson);
router.get('/doi/embeddingtext', handlers.embeddingtext);
router.post('/doi/embeddings/', handlers.registerembedding);
router.get ('/doi/embeddings/', handlers.checkembedding);
router.post('/doi/labels/', handlers.registerpaperlabel);
router.get ('/doi/labels/', handlers.checkpaperlabel);
router.post('/doi/', handlers.registerdoi);
router.get ('/doi/', handlers.checkdoi);
router.get('/modeldata', handlers.getdata);

module.exports = router;
