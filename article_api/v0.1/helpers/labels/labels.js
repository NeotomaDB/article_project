const pgPromise = require('pg-promise');
const {ParameterizedQuery: PQ} = require('pg-promise');

const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});

function registerlabel(req, res, next) {
    const db = req.app.locals.db;
    var values = JSON.parse(req.body.data)
    
    db.oneOrNone(' \
        SELECT lb.labelid, pr.projectid \
        FROM labels AS lb \
        INNER JOIN projects AS pr ON pr.projectid = lb.projectid \
        WHERE label = ${label} AND pr.projectname = ${project};', {'label': values['label'], 'project': values['project']})
    .then(function(data){
      if(data === null) {
        db.one("INSERT INTO labels (label, projectid) \
                VALUES (${label}, (SELECT projectid FROM projects WHERE projectname = ${project})) RETURNING labelid;",
                {'label': values['label'], 'project': values['project']})
        .then(function(data) {
            return res.status(200)
            .json({
              status: 'success',
              message: 'Inserted new label.',
              doi: data,
            });
        })
        .catch(function(err) {
            return res.status(500)
              .json({status:'no good.',
                error: err.message
              })
            });
      } else {
        return res.status(200)
            .json({
              status: 'success',
              message: 'Label already exists for this project.',
              doi: data,
            });
      };
    })
    .catch(function(err) {
      return res.status(500)
        .json({status:'no good.',
          error: err.message
        })
      })
    };
  
function checklabel(req, res, next) {
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

module.exports.checklabel = checklabel;
module.exports.registerlabel = registerlabel;
