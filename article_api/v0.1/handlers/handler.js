'use strict';
module.exports = {
  registerdoi: function(req, res, next) {
    const dois = require('../helpers/dois/dois.js');
    dois.registerdoi(req, res, next);
  },
  checkdoi:
  function(req, res, next) {
    const papers = require('../helpers/dois/dois.js');
    papers.checkdoi(req, res, next);
  },
  doisummary:
  function(req, res, next) {
    const doisummary = require('../helpers/dois/dois.js');
    doisummary.getdois(req, res, next);
  },
  embeddingtext:
  function(req, res, next) {
    const embedders = require('../helpers/dois/dois.js');
    embedders.embeddingtext(req, res, next);
  },
  registerembedding:
    function(req, res, next) {
      const paperTasks = require('../helpers/papers/papertasks.js');
      paperTasks.registerembedding(req, res, next);
    },
  checkembedding:
    function(req, res, next) {
      const paperTasks = require('../helpers/papers/papertasks.js');
      paperTasks.checkembedding(req, res, next);
    },
  checklabel:
    function(req, res, next) {
      const labels = require('../helpers/labels/labels.js');
      labels.checklabel(req, res, next);
    },
  registerlabel:
    function(req, res, next) {
      const labels = require('../helpers/labels/labels.js');
      labels.registerlabel(req, res, next);
    },
  registerproject:
  function(req, res, next) {
    const projects = require('../helpers/projects/projects.js');
    projects.registerproject(req, res, next);
  },
  checkproject:
  function(req, res, next) {
    const projects = require('../helpers/projects/projects.js');
    projects.checkproject(req, res, next);
  },
  registerperson:
  function(req, res, next) {
    const people = require('../helpers/people/people.js');
    people.registerperson(req, res, next);
  },
  checkperson:
  function(req, res, next) {
    const people = require('../helpers/people/people.js');
    people.checkperson(req, res, next);
  },
  registerpaperlabel:
  function(req, res, next) {
    const paperlabels = require('../helpers/papers/papertasks.js');
    paperlabels.registerpaperlabel(req, res, next);
  },
  checkpaperlabel:
  function(req, res, next) {
    const paperlabels = require('../helpers/papers/papertasks.js');
    paperlabels.checkpaperlabel(req, res, next);
  },
  getdata:
  function(req, res, next) {
    const datagetters = require('../helpers/modeldata/modeldata.js');
    datagetters.getdata(req, res, next);
  }
}