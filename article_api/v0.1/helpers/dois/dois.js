'use strict';

// Load Citation.js
const { Cite } = require('@citation-js/core')
// Load plugins
require('@citation-js/plugin-doi')
require('@citation-js/plugin-csl')
const pgPromise = require('pg-promise');
const {ParameterizedQuery: PQ} = require('pg-promise');

const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});

const {ColumnSet, insert} = pgp.helpers;

function clean_empty(value) {
  value = value || []
  if (value.length == 0) {
    return null
  } else {
    return value
  }
}

function call_crossref(doi) {
  return Cite.async(doi)
    .then(function (example) {
        var response = {
          'doi': example.data[0]['DOI'].toLowerCase(),
          'title': example.data[0]['title'],
          'subtitle': example.data[0]['subtitle'],
          'author': example.data[0]['author'],
          'subject': JSON.stringify(example.data[0]['subject']),
          'abstract': example.data[0]['abstract'],
          'containertitle': example.data[0]['container-title'],
          'language': example.data[0]['language'],
          'published': new Date(example.data[0]['published']['date-parts']),
          'publisher': example.data[0]['publisher'],
          'articleurl': example.data[0]['URL'],
          'dateadded': new Date(),
          'crossrefmeta': example.data[0]
        }
        for (const [key, value] of Object.entries(response)) {
          response[key] = clean_empty(value)
        }
        return response
      })
      .catch((error) => {
          return 'Failed to catch DOI.'
      })
}

/**
 * Take a set of DOIs, resolve them using CrossRef and post them to the database.
 * @param {req} req An Express request object.
 * @param {res} res An Express response object.
 * @param {next} next An Express "next" object.
 */
function registerdoi(req, res, next) {
    const db = req.app.locals.db;
    const doitab = new ColumnSet(['doi', 'title',
                                  'subtitle', 'author', 
                                  'subject', 'abstract',
                                  'containertitle', 'language',
                                  'published', 'publisher',
                                  'articleurl',
                                  'dateadded', 'crossrefmeta'], {table: 'papers'});
    var cd = new Date();
    let values = JSON.parse(req.body.data)
    console.log(values)
    if (values instanceof Array) {
      return res.status(500)
        .json({
          status: 'failure',
          message: 'Pass only a single value, not an array.',
        });
    } else {
        values = {doi: values['doi'].toLowerCase(), dateadded: cd}
    }
    db.one('SELECT doi FROM papers WHERE doi ILIKE $1', values['doi'])
    .then(function(data) {
      res.status(200)
      .json({
        status: 'success',
        message: 'DOI already present.'
      });
    })
    .catch(function(error) {
      call_crossref(values['doi'])
      .then((doiformat) => {
        console.log(doiformat)
        const query = insert(doiformat, doitab) + ' ON CONFLICT (doi) DO NOTHING RETURNING doi;'
          db.oneOrNone(query)
          .then(function(data) {
            res.status(200)
                .json({
                  status: 'success',
                  message: 'Inserted DOIs',
                  doi: data,
                });
          })
          .catch(function(err) {
            if (err.message == 'No data returned from the query.') {
              res.status(200)
                .json({
                  status: 'success',
                  message: 'DOI already present.'
                });
            } else {
              return res.status(500)
              .json({
                status: 'failure',
                message: err.message,
              });
            }
          }); 
    })
    .catch(function(err) {
      return res.status(500)
          .json({
            status: 'failure',
            message: err.message,
          });
    });
    });
    
}

/**
 * Take a set of DOIs and post them to the database.
 * @param {req} req An Express request object.
 * @param {res} res An Express response object.
 * @param {next} next An Express "next" object.
 */
function summarydois(req, res, next) {
    const db = req.app.locals.db;
    
    const doi_query = `
        SELECT pp.doi AS doi,
            (CASE WHEN (pp.title IS NULL AND pp.containertitle IS NULL) THEN 0 ELSE 1 END) AS metadata,
            SUM(CASE WHEN pl.labelid is null then 0 else 1 END) AS labels,
            SUM(CASE WHEN em.embeddings is null then 0 else 1 END) AS embedding_arrays,
            SUM(CASE WHEN pr.prediction is null then 0 else 1 END) AS predictions
        FROM papers AS pp
        LEFT JOIN paperlabels AS pl ON pp.doi = pl.doi
        LEFT JOIN embeddings AS em ON em.doi = pp.doi
        LEFT JOIN predictions AS pr ON pp.doi = pr.doi
        GROUP BY pp.doi, pp.title, pp.containertitle;
        `

    db.any(doi_query)
        .then(function(data) {
          res.status(200)
              .json({
                status: 'success',
                message: data,
              });
        })
        .catch(function(err) {
          return res.status(500)
              .json({
                status: 'failure',
                message: err.message,
              });
        });
}

function checkdoi(req, res, next) {
  const db = req.app.locals.db;
  let doi = req.query.doi;

  const doi_query_all = '\
    SELECT pp.doi,        \
           pp.title,      \
           pp.subtitle, pp.abstract, pp.language, pp.containertitle \
    FROM papers as pp \
    WHERE doi = ${doi} or ${doi} IS NULL;'
  
  db.any(doi_query_all, {'doi': doi})
      .then(function(data) {
        res.status(200)
            .json({
              status: 'success',
              message: data,
            });
      })
      .catch(function(err) {
        return res.status(500)
            .json({
              status: 'failure',
              message: err.message,
            });
      });
}

function embeddingtext(req, res, next) {
  const db = req.app.locals.db;
  let values = req.query.embeddingmodel;

  const doi_query_all = '\
    SELECT pp.doi,        \
           pp.title,      \
           pp.subtitle, pp.abstract, pp.language, pp.containertitle \
    FROM papers AS pp LEFT JOIN embeddings AS em ON em.doi = pp.doi  \
    LEFT JOIN embeddingmodels AS emm ON emm.embeddingmodelid = em.embeddingmodelid WHERE NOT emm.embeddingmodel = ${embeddingmodel} or emm.embeddingmodel is NULL;'
  
  db.any(doi_query_all, {'embeddingmodel':values})
      .then(function(data) {
        res.status(200)
            .json({
              status: 'success',
              message: data,
            });
      })
      .catch(function(err) {
        return res.status(500)
            .json({
              status: 'failure',
              message: err.message,
            });
      });
}

function submitlabels(req, res, next) {
  const db = req.app.locals.db;
  var values = JSON.parse(req.body.data)
  let labeltab = new ColumnSet(['doi', 'labelid', 'person', 'date'], {table: 'paperlabels'});
  
  db.oneOrNone('SELECT labelid FROM labels WHERE label = ${vaues.label}', {'model': values['model']})
  .then(function(data){
    if(data === null) {
      db.oneOrNone("INSERT INTO labels (label) VALUES (${label}) RETURNING labelid;", {'label': values['label']})
      .then(function(data) {
        values['embeddingmodelid'] = data;
      })
    } else {
      values['embeddingmodelid'] = data.embeddingmodelid;
    }
    return values;
  })
  .then(function(values){
    const query = insert(values, embedtab) + ' ON CONFLICT (doi, embeddingmodelid) DO NOTHING RETURNING doi;'
    db.oneOrNone(query)
    .then(function(data) {
      return res.status(200)
          .json({
            status: 'success',
            message: 'Inserted embedding.',
            doi: data,
          });
  })
  .catch(function(err) {
    return res.status(500)
      .json({status:'no good.',
        error: err.message
      })
    })
  })
}

function checklabels(req, res, next) {
  const db = req.app.locals.db;
  const doi = req.query.doi;
  const label = req.query.label;
  db.oneOrNone('SELECT pl.doi, lab.label \
      FROM paperlabels AS pl \
      INNER JOIN labels AS lab ON lab.labelid = pl.labelid \
      WHERE doi = ${doi} AND label = ${label}', {'doi': doi, 'label': label})
    .then(function(data) {
      return res.status(200)
        .json({
          status: 'success',
          data: data
        })
    })
    .catch(function(err) {
      return res.status(500)
        .json({
          'status': 'failure',
          'data': 'no result'
        })
    })
}

module.exports.registerdoi = registerdoi;
module.exports.getdois = summarydois;
module.exports.embeddingtext = embeddingtext;
module.exports.submitlabels = submitlabels;
module.exports.checklabels = checklabels;
module.exports.checkdoi = checkdoi;
