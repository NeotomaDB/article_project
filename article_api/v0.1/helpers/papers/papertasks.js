const pgPromise = require('pg-promise');
const {ParameterizedQuery: PQ} = require('pg-promise');

const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});

const {ColumnSet, insert} = pgp.helpers;

function checkembedding(req, res, next) {
    const db = req.app.locals.db;
    const doi = req.query.doi;
    const model = req.query.model;
    console.log(doi)
    db.oneOrNone('SELECT em.doi, emm.embeddingmodel, em.embeddings, em.date \
        FROM embeddings AS em \
        INNER JOIN embeddingmodels AS emm ON emm.embeddingmodelid = em.embeddingmodelid \
        WHERE doi =ILIKE ${doi} AND embeddingmodel = ${model}', {'doi': doi, 'model': model})
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

function registerembedding(req, res, next) {
    const db = req.app.locals.db;
    var values = JSON.parse(req.body.data)
    let embedtab = new ColumnSet(['doi', 'embeddingmodelid', 'embeddings', 'date'], {table: 'embeddings'});

    db.oneOrNone('SELECT embeddingmodelid FROM embeddingmodels WHERE embeddingmodel = ${model}', {'model': values['model']})
    .then(function(data){
        if(data === null) {
        db.one("INSERT INTO embeddingmodels (embeddingmodel) VALUES (${model}) RETURNING embeddingmodelid;", {'model': values['model']})
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

function checkpaperlabel(req, res, next) {
    const db = req.app.locals.db;
    const doi = req.query.doi.toLowerCase();
    const label = req.query.label;
    const project = req.query.project;
    const orcid = 'https://orcid.org/' + req.query.orcid;

    db.oneOrNone('SELECT pl.doi, lb.label, pr.projectname \
        FROM paperlabels AS pl \
        INNER JOIN projects AS pr ON pr.projectid = pl.projectid \
        INNER JOIN labels AS lb ON lb.labelid = pl.labelid \
        INNER JOIN people AS pp ON pp.orcid = pl.orcid \
        WHERE doi ILIKE ${doi} AND projectname = ${project} AND label = ${label} AND pl.orcid = ${orcid}',
        {'doi': doi, 'project': project, 'label': label, 'orcid': orcid})
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


function registerpaperlabel(req, res, next) {
  const db = req.app.locals.db;
  var values = JSON.parse(req.body.data)
  let labeltab = new ColumnSet(['doi', 'labelid', 'date', 'orcid', 'projectid'], {table: 'paperlabels'});

  values['date'] = new Date()
  values['orcid'] = 'https://orcid.org/' + values['orcid']
  db.one("SELECT lb.labelid, pr.projectid \
          FROM labels AS lb \
          INNER JOIN projects AS pr ON lb.projectid = pr.projectid \
          WHERE lb.label = ${label} AND pr.projectname = ${project}", {'label': values['label'], 'project': values['project']})
    .then(function (data) {
      values['labelid'] = data['labelid']
      values['projectid'] = data['projectid']
      values['doi'] = values['doi'].toLowerCase()
      const query = insert(values, labeltab) + ' ON CONFLICT (doi, labelid, orcid, date, projectid) DO NOTHING RETURNING doi;'
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

module.exports.registerembedding = registerembedding;
module.exports.registerpaperlabel = registerpaperlabel;
module.exports.checkembedding = checkembedding;
module.exports.checkpaperlabel = checkpaperlabel;