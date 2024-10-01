const pgPromise = require('pg-promise');
const {ParameterizedQuery: PQ} = require('pg-promise');

const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});

const {ColumnSet, insert} = pgp.helpers;

function registerproject(req, res, next) {
    const db = req.app.locals.db;
    const project = JSON.parse(req.body.data);
    db.oneOrNone('INSERT INTO projects(projectname, projectnotes) \
        VALUES (${project}, ${projectnotes}) \
        ON CONFLICT DO NOTHING;', {'project': project.project, 'notes': project.projectnotes})
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
  };

function checkproject(req, res, next) {
const db = req.app.locals.db;
const project = req.query.project;
db.oneOrNone('SELECT pr.projectname, pr.projectnotes \
    FROM projects AS pr \
    WHERE pr.projectname = ${project}', {'project': project})
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


module.exports.checkproject = checkproject;
module.exports.registerproject = registerproject;